from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import schemas
from app.api import deps
from app.services import tenant_instances as instance_service
from app.models.user import User
import uuid

router = APIRouter()


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
def create_instance(
    *,
    db: Session = Depends(deps.get_db),
    item_in: schemas.tenant_instance.TenantInstanceCreate,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Deploy a new tenant instance. Creates the DB record with status='provisioning'.
    """
    instance = instance_service.create_tenant_instance(
        db=db, item_in=item_in, tenant_id=current_user.tenant_id
    )
    # TODO: Trigger Temporal provisioning workflow here (Task 9)
    # workflow_client.start_workflow(
    #     "provision_instance",
    #     ProvisionInstanceInput(instance_id=str(instance.id), tenant_id=str(current_user.tenant_id)),
    # )
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

    # TODO: Execute K8s scale-to-zero via Temporal workflow or direct kubectl
    # kubectl scale deployment/{helm_release} --replicas=0 -n {k8s_namespace}
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

    # TODO: Execute K8s scale-to-one via Temporal workflow or direct kubectl
    # kubectl scale deployment/{helm_release} --replicas=1 -n {k8s_namespace}
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

    # TODO: Execute K8s rollout restart via Temporal workflow or direct kubectl
    # kubectl rollout restart deployment/{helm_release} -n {k8s_namespace}
    instance = instance_service.update_instance_status(db=db, db_obj=instance, status="running")
    return instance


@router.post("/{instance_id}/upgrade", response_model=schemas.tenant_instance.TenantInstance)
def upgrade_instance(
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

    # TODO: Execute helm upgrade via Temporal workflow
    # helm upgrade {helm_release} chart --set image.tag={version} -n {k8s_namespace}
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

    # TODO: Execute helm uninstall + PVC cleanup via Temporal workflow
    # helm uninstall {helm_release} -n {k8s_namespace}
    # kubectl delete pvc -l release={helm_release} -n {k8s_namespace}

    # Mark as destroying then delete the DB record
    instance_service.update_instance_status(db=db, db_obj=instance, status="destroying")
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

    # TODO: Stream pod logs via K8s API
    # kubectl logs deployment/{helm_release} -n {k8s_namespace} --tail={tail}
    return {
        "instance_id": str(instance.id),
        "helm_release": instance.helm_release,
        "k8s_namespace": instance.k8s_namespace,
        "tail": tail,
        "logs": [],  # TODO: Replace with actual K8s pod log lines
    }
