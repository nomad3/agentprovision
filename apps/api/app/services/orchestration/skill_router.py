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
from typing import Dict, Any, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.tenant_instance import TenantInstance
from app.models.skill_config import SkillConfig
from app.models.execution_trace import ExecutionTrace
from app.services.orchestration.credential_vault import retrieve_credentials_for_skill

logger = logging.getLogger(__name__)


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

        # Step 4: Call OpenClaw Gateway
        result = self._call_openclaw(
            instance.internal_url,
            skill_name,
            payload,
            credentials,
        )

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
                },
                duration_ms=duration_ms,
            )

        return {
            "status": result.get("status", "completed"),
            "result": result.get("data"),
            "duration_ms": duration_ms,
        }

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
