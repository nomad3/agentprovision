"""
Temporal activities for OpenClaw provisioning workflow.

Activities:
- generate_openclaw_values: Render per-tenant Helm values YAML
- helm_install_openclaw: Run helm upgrade --install
- wait_pod_ready: Poll until pod is running and ready
- health_check_openclaw: Verify service reachable on port 18789
- register_instance: Update TenantInstance with final status
"""

from temporalio import activity
from typing import Dict, Any
from datetime import datetime
import uuid
import subprocess
import json
import tempfile
import time

import yaml
import requests

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.tenant_instance import TenantInstance
from app.utils.logger import get_logger

logger = get_logger(__name__)


@activity.defn
async def generate_openclaw_values(instance_id: str, tenant_id: str, resource_config: Dict[str, Any]) -> str:
    """
    Generate a temporary Helm values YAML file with tenant-specific configuration.

    Args:
        instance_id: UUID of the TenantInstance
        tenant_id: UUID of the tenant
        resource_config: Resource overrides (cpu_request, cpu_limit, memory_request, memory_limit, storage)

    Returns:
        Path to the generated values YAML file
    """
    tenant_short_id = tenant_id[:8]

    values = {
        "replicaCount": 1,
        "image": {
            "repository": "gcr.io/ai-agency-479516/openclaw",
            "tag": "latest",
            "pullPolicy": "IfNotPresent",
        },
        "service": {
            "type": "ClusterIP",
            "port": 18789,
        },
        "resources": {
            "requests": {
                "cpu": resource_config.get("cpu_request", "250m"),
                "memory": resource_config.get("memory_request", "512Mi"),
            },
            "limits": {
                "cpu": resource_config.get("cpu_limit", "1000m"),
                "memory": resource_config.get("memory_limit", "2Gi"),
            },
        },
        "persistence": {
            "enabled": True,
            "size": resource_config.get("storage", "10Gi"),
        },
        "tenantId": tenant_id,
        "instanceId": instance_id,
        "nameOverride": f"openclaw-{tenant_short_id}",
    }

    # Write to a temp file that persists (delete=False)
    with tempfile.NamedTemporaryFile(
        mode="w",
        suffix=".yaml",
        prefix=f"openclaw-values-{tenant_short_id}-",
        delete=False,
    ) as f:
        yaml.dump(values, f, default_flow_style=False)
        values_path = f.name

    logger.info(f"Generated OpenClaw values at {values_path} for tenant {tenant_short_id}")
    return values_path


@activity.defn
async def helm_install_openclaw(release_name: str, values_path: str, namespace: str) -> Dict[str, Any]:
    """
    Run helm upgrade --install for the OpenClaw chart.

    Args:
        release_name: Helm release name (e.g., openclaw-abcd1234)
        values_path: Path to the generated values YAML
        namespace: Kubernetes namespace

    Returns:
        Dict with success, stdout, stderr
    """
    chart_path = settings.OPENCLAW_CHART_PATH

    cmd = [
        "helm", "upgrade", "--install",
        release_name,
        chart_path,
        "-f", values_path,
        "-n", namespace,
        "--wait",
        "--timeout", "5m",
    ]

    logger.info(f"Running helm install: {' '.join(cmd)}")

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=360,  # 6 minute timeout for subprocess
        )

        success = result.returncode == 0

        if success:
            logger.info(f"Helm install succeeded for {release_name}")
        else:
            logger.error(f"Helm install failed for {release_name}: {result.stderr}")

        return {
            "success": success,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode,
        }

    except subprocess.TimeoutExpired:
        logger.error(f"Helm install timed out for {release_name}")
        return {
            "success": False,
            "stdout": "",
            "stderr": "Helm install timed out after 6 minutes",
            "returncode": -1,
        }
    except FileNotFoundError:
        logger.error("helm binary not found in PATH")
        return {
            "success": False,
            "stdout": "",
            "stderr": "helm binary not found in PATH",
            "returncode": -1,
        }
    except Exception as e:
        logger.error(f"Helm install error for {release_name}: {e}")
        return {
            "success": False,
            "stdout": "",
            "stderr": str(e),
            "returncode": -1,
        }


@activity.defn
async def wait_pod_ready(release_name: str, namespace: str) -> Dict[str, Any]:
    """
    Poll kubectl until the pod for this release is Running with all containers ready.

    Args:
        release_name: Helm release name (used as app label)
        namespace: Kubernetes namespace

    Returns:
        Dict with pod_name, pod_ip

    Raises:
        RuntimeError if pod not ready within 5 minutes
    """
    timeout_seconds = 300
    poll_interval = 10
    start_time = time.time()

    while time.time() - start_time < timeout_seconds:
        try:
            result = subprocess.run(
                [
                    "kubectl", "get", "pods",
                    "-l", f"app={release_name}",
                    "-n", namespace,
                    "-o", "json",
                ],
                capture_output=True,
                text=True,
                timeout=30,
            )

            if result.returncode != 0:
                logger.warning(f"kubectl get pods failed: {result.stderr}")
                time.sleep(poll_interval)
                continue

            pods_data = json.loads(result.stdout)
            items = pods_data.get("items", [])

            for pod in items:
                phase = pod.get("status", {}).get("phase", "")
                pod_name = pod.get("metadata", {}).get("name", "")
                pod_ip = pod.get("status", {}).get("podIP", "")

                if phase != "Running":
                    continue

                # Check all containers are ready
                container_statuses = pod.get("status", {}).get("containerStatuses", [])
                if not container_statuses:
                    continue

                all_ready = all(cs.get("ready", False) for cs in container_statuses)
                if all_ready:
                    logger.info(f"Pod {pod_name} is ready at {pod_ip}")
                    return {"pod_name": pod_name, "pod_ip": pod_ip}

        except subprocess.TimeoutExpired:
            logger.warning("kubectl get pods timed out, retrying...")
        except json.JSONDecodeError:
            logger.warning("Failed to parse kubectl output, retrying...")
        except FileNotFoundError:
            raise RuntimeError("kubectl binary not found in PATH")
        except Exception as e:
            logger.warning(f"Error checking pod status: {e}")

        time.sleep(poll_interval)

    raise RuntimeError(f"Pod for {release_name} not ready within {timeout_seconds}s")


@activity.defn
async def health_check_openclaw(internal_url: str) -> Dict[str, Any]:
    """
    Verify the OpenClaw service is reachable.

    Args:
        internal_url: Internal Kubernetes URL (e.g., http://openclaw-abcd1234.prod.svc.cluster.local:18789)

    Returns:
        Dict with healthy: true/false, status_code, detail
    """
    try:
        response = requests.get(internal_url, timeout=30)
        healthy = response.status_code < 500
        logger.info(f"Health check {internal_url}: status={response.status_code} healthy={healthy}")
        return {
            "healthy": healthy,
            "status_code": response.status_code,
            "detail": response.text[:200] if response.text else "",
        }
    except requests.ConnectionError as e:
        logger.warning(f"Health check connection error for {internal_url}: {e}")
        return {"healthy": False, "status_code": None, "detail": f"Connection error: {e}"}
    except requests.Timeout:
        logger.warning(f"Health check timeout for {internal_url}")
        return {"healthy": False, "status_code": None, "detail": "Request timed out"}
    except Exception as e:
        logger.warning(f"Health check error for {internal_url}: {e}")
        return {"healthy": False, "status_code": None, "detail": str(e)}


@activity.defn
async def register_instance(
    instance_id: str,
    status: str,
    internal_url: str | None,
    helm_release: str,
    error: str | None = None,
) -> Dict[str, Any]:
    """
    Update the TenantInstance record in the database.

    Args:
        instance_id: UUID of the TenantInstance
        status: New status (running, error, etc.)
        internal_url: Internal Kubernetes service URL
        helm_release: Helm release name
        error: Error message if any

    Returns:
        Dict with instance_id and status
    """
    db = SessionLocal()
    try:
        instance = db.query(TenantInstance).filter(
            TenantInstance.id == uuid.UUID(instance_id)
        ).first()

        if not instance:
            raise RuntimeError(f"TenantInstance {instance_id} not found")

        instance.status = status
        instance.internal_url = internal_url
        instance.helm_release = helm_release
        instance.error = error
        instance.updated_at = datetime.utcnow()

        if status == "running":
            instance.health = {
                "last_check": datetime.utcnow().isoformat(),
                "healthy": True,
            }

        db.commit()

        logger.info(f"Registered instance {instance_id}: status={status}")
        return {"instance_id": instance_id, "status": status}
    finally:
        db.close()
