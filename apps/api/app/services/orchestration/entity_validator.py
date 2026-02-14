"""
Entity Validator Service - Pre-persistence validation for knowledge graph entities.

Enforces rate limits, deduplication, required fields, content filtering,
and confidence thresholds before entities are written to KnowledgeEntity.
Operates within multi-tenant isolation boundaries.
"""

import re
import uuid
import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.knowledge_entity import KnowledgeEntity

logger = logging.getLogger(__name__)


@dataclass
class ValidationPolicy:
    """Configurable validation rules for entity batches."""

    max_entities_per_task: int = 500
    max_entities_per_hour: int = 1000
    required_fields: List[str] = field(
        default_factory=lambda: ["name", "entity_type"]
    )
    prohibited_patterns: List[str] = field(default_factory=list)
    dedup_fields: List[str] = field(
        default_factory=lambda: ["name", "entity_type"]
    )
    min_confidence: float = 0.0
    max_name_length: int = 500


@dataclass
class ValidationResult:
    """Outcome of a batch validation pass."""

    valid_entities: List[Dict] = field(default_factory=list)
    rejected_entities: List[Dict] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    duplicates_skipped: int = 0

    @property
    def is_valid(self) -> bool:
        """True when at least one entity survived validation and no hard errors."""
        return len(self.valid_entities) > 0 and len(self.errors) == 0

    @property
    def summary(self) -> Dict:
        return {
            "valid_count": len(self.valid_entities),
            "rejected_count": len(self.rejected_entities),
            "duplicates_skipped": self.duplicates_skipped,
            "error_count": len(self.errors),
            "is_valid": self.is_valid,
        }


class EntityValidator:
    """Validates entity batches before they are persisted to the knowledge graph.

    All queries are scoped to the provided ``tenant_id`` for multi-tenant
    isolation.  The validator is designed to be instantiated per-request
    (cheap — no heavy state).
    """

    def __init__(self, db: Session, tenant_id: uuid.UUID):
        self.db = db
        self.tenant_id = tenant_id

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def validate_batch(
        self,
        entities: List[Dict],
        policy: Optional[ValidationPolicy] = None,
        task_id: Optional[uuid.UUID] = None,
    ) -> ValidationResult:
        """Run the full validation pipeline on a list of raw entity dicts.

        Steps executed in order:
        1. Rate-limit check (per-task count and per-hour tenant count)
        2. Normalise each entity (map ``type`` -> ``entity_type``)
        3. Validate individual entity fields
        4. Deduplicate within the batch
        5. Deduplicate against existing DB entities

        Args:
            entities: Raw entity dicts, typically produced by an LLM.
            policy: Validation rules to apply.  Uses defaults when ``None``.
            task_id: Optional task ID for per-task rate-limit enforcement.

        Returns:
            A :class:`ValidationResult` summarising accepted and rejected
            entities.
        """
        if policy is None:
            policy = ValidationPolicy()

        result = ValidationResult()

        if not entities:
            result.errors.append("Empty entity batch — nothing to validate")
            return result

        # ----- rate-limit: per-task count -----
        if len(entities) > policy.max_entities_per_task:
            result.errors.append(
                f"Batch size {len(entities)} exceeds per-task limit "
                f"of {policy.max_entities_per_task}"
            )
            return result

        # ----- rate-limit: per-hour tenant count -----
        hourly_count = self._count_entities_last_hour()
        if hourly_count + len(entities) > policy.max_entities_per_hour:
            remaining = max(0, policy.max_entities_per_hour - hourly_count)
            result.errors.append(
                f"Tenant hourly entity limit would be exceeded "
                f"({hourly_count} existing + {len(entities)} new > "
                f"{policy.max_entities_per_hour}). "
                f"{remaining} entity slot(s) remaining this hour."
            )
            return result

        # ----- compile prohibited patterns once -----
        compiled_patterns = self._compile_patterns(policy.prohibited_patterns)

        # ----- per-entity validation -----
        candidates: List[Dict] = []
        for raw_entity in entities:
            entity = self._normalise(raw_entity)
            ok, reason = self._validate_entity(entity, policy, compiled_patterns)
            if ok:
                candidates.append(entity)
            else:
                entity["_rejection_reason"] = reason
                result.rejected_entities.append(entity)

        # ----- intra-batch dedup -----
        candidates, intra_dupes = self._dedup_within_batch(
            candidates, policy.dedup_fields
        )
        result.duplicates_skipped += intra_dupes

        # ----- cross-DB dedup -----
        candidates, db_dupes = self._dedup_against_db(
            candidates, policy.dedup_fields, task_id
        )
        result.duplicates_skipped += db_dupes

        result.valid_entities = candidates

        logger.info(
            "Entity validation complete for tenant=%s task=%s — %s",
            self.tenant_id,
            task_id,
            result.summary,
        )
        return result

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _normalise(entity: Dict) -> Dict:
        """Transparently map LLM output field ``type`` to ``entity_type``."""
        entity = dict(entity)  # shallow copy to avoid mutating caller data
        if "type" in entity and "entity_type" not in entity:
            entity["entity_type"] = entity.pop("type")
        return entity

    @staticmethod
    def _compile_patterns(patterns: List[str]) -> List[re.Pattern]:
        compiled: List[re.Pattern] = []
        for pat in patterns:
            try:
                compiled.append(re.compile(pat, re.IGNORECASE))
            except re.error as exc:
                logger.warning("Skipping invalid prohibited pattern %r: %s", pat, exc)
        return compiled

    @staticmethod
    def _validate_entity(
        entity: Dict,
        policy: ValidationPolicy,
        compiled_patterns: List[re.Pattern],
    ) -> Tuple[bool, str]:
        """Validate a single normalised entity dict.

        Returns:
            ``(True, "")`` on success or ``(False, reason)`` on rejection.
        """
        # Required fields
        for field_name in policy.required_fields:
            value = entity.get(field_name)
            if value is None or (isinstance(value, str) and not value.strip()):
                return False, f"Missing or empty required field: {field_name}"

        # Name length
        name = entity.get("name", "")
        if isinstance(name, str) and len(name) > policy.max_name_length:
            return False, (
                f"Name length {len(name)} exceeds maximum of "
                f"{policy.max_name_length}"
            )

        # Confidence range
        confidence = entity.get("confidence")
        if confidence is not None:
            try:
                conf_float = float(confidence)
            except (TypeError, ValueError):
                return False, f"Invalid confidence value: {confidence!r}"
            if conf_float < policy.min_confidence:
                return False, (
                    f"Confidence {conf_float} below minimum "
                    f"{policy.min_confidence}"
                )
            if conf_float < 0.0 or conf_float > 1.0:
                return False, (
                    f"Confidence {conf_float} outside valid range [0.0, 1.0]"
                )

        # Prohibited patterns — scan name and entity_type
        scannable_values = [
            str(entity.get("name", "")),
            str(entity.get("entity_type", "")),
        ]
        attrs = entity.get("attributes")
        if isinstance(attrs, dict):
            scannable_values.extend(str(v) for v in attrs.values())

        for pattern in compiled_patterns:
            for value in scannable_values:
                if pattern.search(value):
                    return False, (
                        f"Prohibited pattern matched: {pattern.pattern!r}"
                    )

        return True, ""

    @staticmethod
    def _dedup_within_batch(
        entities: List[Dict],
        dedup_fields: List[str],
    ) -> Tuple[List[Dict], int]:
        """Remove duplicates within the batch based on ``dedup_fields``.

        Returns:
            Tuple of (deduplicated list, number of duplicates removed).
        """
        seen: Set[Tuple] = set()
        unique: List[Dict] = []
        dupes = 0

        for entity in entities:
            key = tuple(
                str(entity.get(f, "")).strip().lower() for f in dedup_fields
            )
            if key in seen:
                dupes += 1
                continue
            seen.add(key)
            unique.append(entity)

        return unique, dupes

    def _dedup_against_db(
        self,
        entities: List[Dict],
        dedup_fields: List[str],
        task_id: Optional[uuid.UUID],
    ) -> Tuple[List[Dict], int]:
        """Remove entities that already exist in the knowledge graph.

        Uses a single batch query for efficiency — loads all existing
        (name, entity_type) pairs for the tenant and compares in memory.

        Returns:
            Tuple of (new entities, number of DB duplicates removed).
        """
        if not entities:
            return entities, 0

        # Load existing dedup keys in one query.  We restrict to the
        # columns referenced in dedup_fields.  The standard pair is
        # (name, entity_type) which maps to KnowledgeEntity columns.
        col_map = {
            "name": KnowledgeEntity.name,
            "entity_type": KnowledgeEntity.entity_type,
        }

        query_cols = []
        usable_fields = []
        for f in dedup_fields:
            col = col_map.get(f)
            if col is not None:
                query_cols.append(col)
                usable_fields.append(f)

        if not query_cols:
            # No DB-mappable dedup fields — skip DB dedup entirely
            return entities, 0

        rows = (
            self.db.query(*query_cols)
            .filter(KnowledgeEntity.tenant_id == self.tenant_id)
            .all()
        )

        existing_keys: Set[Tuple] = set()
        for row in rows:
            key = tuple(str(v).strip().lower() for v in row)
            existing_keys.add(key)

        unique: List[Dict] = []
        dupes = 0
        for entity in entities:
            key = tuple(
                str(entity.get(f, "")).strip().lower() for f in usable_fields
            )
            if key in existing_keys:
                dupes += 1
            else:
                unique.append(entity)
                # Add to existing set so later entries in the same batch
                # don't sneak through against the same key.
                existing_keys.add(key)

        return unique, dupes

    def _count_entities_last_hour(self) -> int:
        """Count entities created in the last hour for this tenant."""
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)
        count = (
            self.db.query(func.count(KnowledgeEntity.id))
            .filter(
                KnowledgeEntity.tenant_id == self.tenant_id,
                KnowledgeEntity.created_at >= one_hour_ago,
            )
            .scalar()
        )
        return count or 0
