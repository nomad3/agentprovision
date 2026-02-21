import logging
import subprocess
import time
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from temporalio.client import Client

from app import schemas
from app.api import deps
from app.core.config import settings
from app.models.user import User
from app.services import tenant_instances as instance_service
from app.workflows.openclaw_provision import OpenClawProvisionWorkflow

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Subprocess helpers ────────────────────────────────────────────────


def _kubectl_run(args: list[str], timeout: int = 30) -> dict:
    """Run a kubectl command and return result dict."""
    cmd = ["kubectl"] + args
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return {
            "success": result.returncode == 0,
            "stdout": result.stdout,
            "stderr": result.stderr,
        }
    except subprocess.TimeoutExpired:
        return {"success": False, "stdout": "", "stderr": "kubectl timed out"}
    except FileNotFoundError:
        return {"success": False, "stdout": "", "stderr": "kubectl not found"}


def _helm_run(args: list[str], timeout: int = 120) -> dict:
    """Run a helm command and return result dict."""
    cmd = ["helm"] + args
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return {
            "success": result.returncode == 0,
            "stdout": result.stdout,
            "stderr": result.stderr,
        }
    except subprocess.TimeoutExpired:
        return {"success": False, "stdout": "", "stderr": "helm timed out"}
    except FileNotFoundError:
        return {"success": False, "stdout": "", "stderr": "helm not found"}


# ── Endpoints ─────────────────────────────────────────────────────────


@router.get("/", response_model=List[schemas.tenant_instance.TenantInstance])
def read_instances(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Retrieve tenant instances for the current tenant.
    """
    instances = instance_service.get_instances_by_tenant(
        db, tenant_id=current_user.tenant_id, skip=skip, limit=limit
    )
    return instances


@router.post("/", response_model=schemas.tenant_instance.TenantInstance, status_code=status.HTTP_201_CREATED)
async def create_instance(
    *,
    db: Session = Depends(deps.get_db),
    item_in: schemas.tenant_instance.TenantInstanceCreate,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Deploy a new tenant instance. Creates the DB record with status='provisioning'
    and triggers the Temporal provisioning workflow.
    """
    instance = instance_service.create_tenant_instance(
        db=db, item_in=item_in, tenant_id=current_user.tenant_id
    )

    # Trigger Temporal provisioning workflow
    try:
        temporal_client = await Client.connect(settings.TEMPORAL_ADDRESS)
        await temporal_client.start_workflow(
            OpenClawProvisionWorkflow.run,
            args=[str(instance.id), str(current_user.tenant_id), item_in.resource_config or {}],
            id=f"provision-openclaw-{instance.id}",
            task_queue="servicetsunami-orchestration",
        )
    except Exception as e:
        logger.error(f"Failed to start provisioning workflow: {e}")
        instance = instance_service.update_instance_status(
            db=db, db_obj=instance, status="error", error=str(e)
        )

    return instance


@router.get("/{instance_id}", response_model=schemas.tenant_instance.TenantInstance)
def read_instance(
    instance_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Retrieve a specific tenant instance by ID with health info.
    """
    instance = instance_service.get_instance(db, instance_id=instance_id)
    if not instance or str(instance.tenant_id) != str(current_user.tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instance not found")
    return instance


@router.post("/{instance_id}/stop", response_model=schemas.tenant_instance.TenantInstance)
def stop_instance(
    instance_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Stop a tenant instance (scale to 0 replicas).
    """
    instance = instance_service.get_instance(db, instance_id=instance_id)
    if not instance or str(instance.tenant_id) != str(current_user.tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instance not found")
    if instance.status not in ("running",):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Instance must be running to stop")

    k8s_result = _kubectl_run([
        "scale", f"deployment/{instance.helm_release}",
        "--replicas=0", "-n", instance.k8s_namespace,
    ])
    if not k8s_result["success"]:
        raise HTTPException(status_code=500, detail=f"Failed to stop: {k8s_result['stderr']}")

    instance = instance_service.update_instance_status(db=db, db_obj=instance, status="stopped")
    return instance


@router.post("/{instance_id}/start", response_model=schemas.tenant_instance.TenantInstance)
def start_instance(
    instance_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Start a stopped tenant instance (scale to 1 replica).
    """
    instance = instance_service.get_instance(db, instance_id=instance_id)
    if not instance or str(instance.tenant_id) != str(current_user.tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instance not found")
    if instance.status not in ("stopped",):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Instance must be stopped to start")

    k8s_result = _kubectl_run([
        "scale", f"deployment/{instance.helm_release}",
        "--replicas=1", "-n", instance.k8s_namespace,
    ])
    if not k8s_result["success"]:
        raise HTTPException(status_code=500, detail=f"Failed to start: {k8s_result['stderr']}")

    instance = instance_service.update_instance_status(db=db, db_obj=instance, status="running")
    return instance


@router.post("/{instance_id}/restart", response_model=schemas.tenant_instance.TenantInstance)
def restart_instance(
    instance_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Restart a running tenant instance (rollout restart).
    """
    instance = instance_service.get_instance(db, instance_id=instance_id)
    if not instance or str(instance.tenant_id) != str(current_user.tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instance not found")
    if instance.status not in ("running",):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Instance must be running to restart")

    k8s_result = _kubectl_run([
        "rollout", "restart", f"deployment/{instance.helm_release}",
        "-n", instance.k8s_namespace,
    ])
    if not k8s_result["success"]:
        raise HTTPException(status_code=500, detail=f"Failed to restart: {k8s_result['stderr']}")

    instance = instance_service.update_instance_status(db=db, db_obj=instance, status="running")
    return instance


@router.post("/{instance_id}/upgrade", response_model=schemas.tenant_instance.TenantInstance)
async def upgrade_instance(
    instance_id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    item_in: schemas.tenant_instance.TenantInstanceUpdate,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Upgrade a tenant instance to a new version.
    """
    instance = instance_service.get_instance(db, instance_id=instance_id)
    if not instance or str(instance.tenant_id) != str(current_user.tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instance not found")
    if instance.status not in ("running", "stopped"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Instance must be running or stopped to upgrade")

    # Update version and resource_config fields
    instance = instance_service.update_instance(db=db, db_obj=instance, obj_in=item_in)
    # Set status to upgrading
    instance = instance_service.update_instance_status(db=db, db_obj=instance, status="upgrading")

    # Re-run provisioning workflow (helm upgrade --install is idempotent)
    try:
        temporal_client = await Client.connect(settings.TEMPORAL_ADDRESS)
        await temporal_client.start_workflow(
            OpenClawProvisionWorkflow.run,
            args=[str(instance.id), str(current_user.tenant_id), instance.resource_config or {}],
            id=f"upgrade-openclaw-{instance.id}-{int(time.time())}",
            task_queue="servicetsunami-orchestration",
        )
    except Exception as e:
        logger.error(f"Failed to start upgrade workflow: {e}")
        instance = instance_service.update_instance_status(
            db=db, db_obj=instance, status="error", error=str(e)
        )

    return instance


@router.delete("/{instance_id}", status_code=status.HTTP_204_NO_CONTENT)
def destroy_instance(
    instance_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Destroy a tenant instance (helm uninstall + delete PVC + remove DB record).
    """
    instance = instance_service.get_instance(db, instance_id=instance_id)
    if not instance or str(instance.tenant_id) != str(current_user.tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instance not found")

    instance_service.update_instance_status(db=db, db_obj=instance, status="destroying")

    # Helm uninstall
    helm_result = _helm_run([
        "uninstall", instance.helm_release, "-n", instance.k8s_namespace,
    ])
    if not helm_result["success"]:
        instance_service.update_instance_status(
            db=db, db_obj=instance, status="error", error=helm_result["stderr"]
        )
        raise HTTPException(status_code=500, detail=f"Failed to destroy: {helm_result['stderr']}")

    # Best-effort PVC cleanup
    _kubectl_run([
        "delete", "pvc", "-l", f"release={instance.helm_release}",
        "-n", instance.k8s_namespace,
    ])

    instance_service.delete_instance(db=db, instance_id=instance_id)
    return {"message": "Instance destroyed successfully"}


@router.get("/{instance_id}/logs")
def get_instance_logs(
    instance_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    tail: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Retrieve pod logs for a tenant instance.
    """
    instance = instance_service.get_instance(db, instance_id=instance_id)
    if not instance or str(instance.tenant_id) != str(current_user.tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instance not found")

    k8s_result = _kubectl_run([
        "logs", f"deployment/{instance.helm_release}",
        "-n", instance.k8s_namespace,
        f"--tail={tail}",
    ], timeout=15)

    log_lines = k8s_result["stdout"].splitlines() if k8s_result["success"] else []

    return {
        "instance_id": str(instance.id),
        "helm_release": instance.helm_release,
        "k8s_namespace": instance.k8s_namespace,
        "tail": tail,
        "logs": log_lines,
        "error": k8s_result["stderr"] if not k8s_result["success"] else None,
    }
