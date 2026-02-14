"""
Skill Router Service - Orchestrates skill execution through tenant OpenClaw instances.

Routes skill calls by:
1. Resolving the tenant's running OpenClaw instance (TenantInstance query)
2. Validating SkillConfig (enabled, approval, rate limit)
3. Loading and decrypting credentials via CredentialVault
4. Calling the OpenClaw Gateway (HTTP MVP, WebSocket planned)
5. Logging execution to ExecutionTrace
"""

import uuid
import time
import logging
from collections import defaultdict
from datetime import datetime, timedelta
from threading import Lock
from typing import Dict, Any, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.tenant_instance import TenantInstance
from app.models.skill_config import SkillConfig
from app.models.execution_trace import ExecutionTrace
from app.services.orchestration.credential_vault import retrieve_credentials_for_skill
from app.services.llm.router import LLMRouter

logger = logging.getLogger(__name__)

# Module-level circuit breaker state (shared across SkillRouter instances)
_circuit_breaker_lock = Lock()
_circuit_breaker_state: Dict[str, Dict[str, Any]] = defaultdict(
    lambda: {"failures": 0, "last_failure": None, "open_until": None}
)
CIRCUIT_BREAKER_THRESHOLD = 3
CIRCUIT_BREAKER_WINDOW = timedelta(minutes=5)
CIRCUIT_BREAKER_COOLDOWN = timedelta(minutes=2)


class SkillRouter:
    """Routes skill execution requests through tenant's OpenClaw instance."""

    def __init__(self, db: Session, tenant_id: uuid.UUID):
        self.db = db
        self.tenant_id = tenant_id

    def execute_skill(
        self,
        skill_name: str,
        payload: Dict[str, Any],
        task_id: Optional[uuid.UUID] = None,
        agent_id: Optional[uuid.UUID] = None,
    ) -> Dict[str, Any]:
        """
        Execute a skill through the tenant's OpenClaw instance.

        Steps:
        1. Resolve OpenClaw instance for tenant
        2. Validate skill config (enabled, approval, rate limit)
        3. Load decrypted credentials
        4. Call OpenClaw Gateway
        5. Log to ExecutionTrace

        Returns:
            Dict with status, result, duration_ms
        """
        start = time.time()

        # Step 1: Resolve instance
        instance = self._resolve_instance()
        if not instance:
            return {"status": "error", "error": "No running OpenClaw instance for tenant"}

        # Step 1.5: Circuit breaker check
        cb_error = self._check_circuit_breaker(str(instance.id))
        if cb_error:
            return cb_error

        # Step 2: Validate skill config
        skill_config = self._get_skill_config(skill_name)
        if not skill_config:
            return {"status": "error", "error": f"Skill '{skill_name}' not configured"}
        if not skill_config.enabled:
            return {"status": "error", "error": f"Skill '{skill_name}' is disabled"}
        if skill_config.requires_approval:
            return {"status": "pending_approval", "skill_name": skill_name}

        # Step 3: Load credentials
        credentials = retrieve_credentials_for_skill(
            self.db, skill_config.id, self.tenant_id
        )

        # Step 3.5: Resolve LLM model for this skill
        llm_info = self._resolve_llm(skill_config)

        # Step 4: Call OpenClaw Gateway
        result = self._call_openclaw(
            instance.internal_url,
            skill_name,
            payload,
            credentials,
            llm_info=llm_info,
        )

        # Step 4.5: Track circuit breaker state
        if result.get("status") == "error":
            self._record_failure(str(instance.id))
        else:
            self._record_success(str(instance.id))

        duration_ms = int((time.time() - start) * 1000)

        # Step 5: Log execution trace
        if task_id:
            self._log_trace(
                task_id=task_id,
                agent_id=agent_id,
                step_type="skill_call",
                details={
                    "skill_name": skill_name,
                    "instance_id": str(instance.id),
                    "status": result.get("status"),
                    "duration_ms": duration_ms,
                    "llm": llm_info,
                },
                duration_ms=duration_ms,
            )

        return {
            "status": result.get("status", "completed"),
            "result": result.get("data"),
            "duration_ms": duration_ms,
        }

    # ── Circuit Breaker Methods ────────────────────────────────────────

    def _check_circuit_breaker(self, instance_id: str) -> Optional[Dict[str, Any]]:
        """
        Check if the circuit breaker is open for the given instance.

        Returns an error dict if the circuit is open (too many recent failures),
        or None if the circuit is closed and the call may proceed.
        Automatically resets the circuit after the cooldown period elapses.
        """
        with _circuit_breaker_lock:
            state = _circuit_breaker_state[instance_id]
            if state["open_until"] is not None:
                if datetime.utcnow() < state["open_until"]:
                    logger.warning(
                        "Circuit breaker OPEN for instance %s until %s",
                        instance_id,
                        state["open_until"].isoformat(),
                    )
                    return {
                        "status": "error",
                        "error": "Circuit breaker open — instance temporarily unavailable",
                        "retry_after": state["open_until"].isoformat(),
                    }
                # Cooldown elapsed — half-open: reset and allow one attempt
                logger.info(
                    "Circuit breaker cooldown elapsed for instance %s, resetting",
                    instance_id,
                )
                state["failures"] = 0
                state["last_failure"] = None
                state["open_until"] = None
        return None

    def _record_failure(self, instance_id: str) -> None:
        """
        Record a failure for the given instance.

        Increments the failure counter. If the threshold is reached within the
        configured window, the circuit breaker opens for the cooldown duration.
        Old failures (outside the window) are ignored by resetting the counter.
        """
        with _circuit_breaker_lock:
            state = _circuit_breaker_state[instance_id]
            now = datetime.utcnow()

            # If the last failure was outside the window, start a fresh count
            if (
                state["last_failure"] is not None
                and now - state["last_failure"] > CIRCUIT_BREAKER_WINDOW
            ):
                state["failures"] = 0

            state["failures"] += 1
            state["last_failure"] = now

            if state["failures"] >= CIRCUIT_BREAKER_THRESHOLD:
                state["open_until"] = now + CIRCUIT_BREAKER_COOLDOWN
                logger.error(
                    "Circuit breaker OPENED for instance %s after %d failures "
                    "(cooldown until %s)",
                    instance_id,
                    state["failures"],
                    state["open_until"].isoformat(),
                )

    def _record_success(self, instance_id: str) -> None:
        """Reset the failure counter for the given instance on success."""
        with _circuit_breaker_lock:
            state = _circuit_breaker_state[instance_id]
            state["failures"] = 0
            state["last_failure"] = None
            state["open_until"] = None

    # ── Health Check ─────────────────────────────────────────────────

    def health_check(self) -> Dict[str, Any]:
        """Check health of tenant's OpenClaw instance."""
        instance = self._resolve_instance()
        if not instance:
            return {"status": "no_instance", "healthy": False}

        import requests

        try:
            response = requests.get(
                f"{instance.internal_url}/health", timeout=5
            )
            healthy = response.status_code < 400
            return {
                "status": "healthy" if healthy else "unhealthy",
                "healthy": healthy,
                "instance_id": str(instance.id),
                "response_code": response.status_code,
            }
        except Exception as e:
            self._record_failure(str(instance.id))
            return {
                "status": "unreachable",
                "healthy": False,
                "instance_id": str(instance.id),
                "error": str(e),
            }

    # ── Internal Helpers ─────────────────────────────────────────────

    def _resolve_llm(self, skill_config: SkillConfig) -> Dict[str, Any]:
        """Resolve LLM model configuration for the skill."""
        try:
            llm_router = LLMRouter(self.db)
            if skill_config.llm_config_id:
                model = llm_router.select_model(
                    tenant_id=self.tenant_id,
                    config_id=skill_config.llm_config_id,
                )
            else:
                model = llm_router.select_model(
                    tenant_id=self.tenant_id,
                )

            return {
                "model_name": model.name if model else None,
                "provider": model.provider.name if model and model.provider else None,
            }
        except (ValueError, Exception) as e:
            logger.warning("Could not resolve LLM for skill: %s", str(e))
            return {}

    def _resolve_instance(self) -> Optional[TenantInstance]:
        """Find the tenant's running OpenClaw instance."""
        return (
            self.db.query(TenantInstance)
            .filter(
                TenantInstance.tenant_id == self.tenant_id,
                TenantInstance.instance_type == "openclaw",
                TenantInstance.status == "running",
            )
            .first()
        )

    def _get_skill_config(self, skill_name: str) -> Optional[SkillConfig]:
        """Get skill configuration for the tenant."""
        return (
            self.db.query(SkillConfig)
            .filter(
                SkillConfig.tenant_id == self.tenant_id,
                SkillConfig.skill_name == skill_name,
            )
            .first()
        )

    def _call_openclaw(
        self,
        internal_url: str,
        skill_name: str,
        payload: Dict[str, Any],
        credentials: Dict[str, str],
        llm_info: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Call OpenClaw Gateway via HTTP POST.

        MVP uses synchronous HTTP. WebSocket support (port 18789) will be added
        when the OpenClaw Gateway protocol is finalized.
        """
        import requests

        try:
            # MVP: HTTP POST to OpenClaw Gateway
            gateway_url = f"{internal_url}/api/execute"
            response = requests.post(
                gateway_url,
                json={
                    "skill": skill_name,
                    "payload": payload,
                    "credentials": credentials,  # Injected at runtime, never stored in OpenClaw
                    "llm": llm_info or {},  # Model info for skill execution
                },
                timeout=60,
            )

            if response.status_code < 400:
                return {"status": "completed", "data": response.json()}
            else:
                logger.error(
                    "OpenClaw gateway error for skill '%s': %s",
                    skill_name,
                    response.text[:200],
                )
                return {"status": "error", "error": response.text[:200]}

        except requests.ConnectionError:
            logger.error("Cannot connect to OpenClaw at %s", internal_url)
            return {"status": "error", "error": "OpenClaw instance unreachable"}
        except requests.Timeout:
            logger.error("Timeout calling OpenClaw at %s", internal_url)
            return {"status": "error", "error": "OpenClaw execution timeout"}
        except Exception as e:
            logger.error("Unexpected error calling OpenClaw: %s", str(e))
            return {"status": "error", "error": str(e)}

    def _log_trace(
        self,
        task_id: uuid.UUID,
        step_type: str,
        details: Dict[str, Any],
        duration_ms: int,
        agent_id: Optional[uuid.UUID] = None,
    ):
        """Write an ExecutionTrace record."""
        max_order = (
            self.db.query(func.max(ExecutionTrace.step_order))
            .filter(ExecutionTrace.task_id == task_id)
            .scalar()
        ) or 0

        trace = ExecutionTrace(
            task_id=task_id,
            tenant_id=self.tenant_id,
            step_type=step_type,
            step_order=max_order + 1,
            agent_id=agent_id,
            details=details,
            duration_ms=duration_ms,
        )
        self.db.add(trace)
        self.db.commit()
