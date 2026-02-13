"""
Temporal workflow for provisioning OpenClaw instances per tenant.

Steps:
1. Generate tenant-specific Helm values YAML
2. Run helm upgrade --install for the OpenClaw chart
3. Wait for pod to become ready
4. Health-check the new service
5. Register the running instance in the database
"""

from temporalio import workflow
from datetime import timedelta
from typing import Dict, Any


@workflow.defn(sandboxed=False)
class OpenClawProvisionWorkflow:
    """
    Durable workflow for provisioning an OpenClaw instance.

    Steps:
    1. generate_openclaw_values - Render per-tenant Helm values YAML
    2. helm_install_openclaw - Run helm upgrade --install
    3. wait_pod_ready - Poll until pod is running and ready
    4. health_check_openclaw - Verify service reachable on port 18789
    5. register_instance - Update TenantInstance with status=running
    """

    @workflow.run
    async def run(self, instance_id: str, tenant_id: str, resource_config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Provision an OpenClaw instance for a tenant.

        Args:
            instance_id: UUID of the TenantInstance record
            tenant_id: UUID of the tenant
            resource_config: Resource configuration dict (cpu, memory, storage overrides)

        Returns:
            Dict with status, internal_url, helm_release, pod_name
        """
        retry_policy = workflow.RetryPolicy(
            maximum_attempts=3,
            initial_interval=timedelta(seconds=30),
            backoff_coefficient=2.0,
        )

        tenant_short_id = tenant_id[:8]
        release_name = f"openclaw-{tenant_short_id}"
        namespace = "prod"

        workflow.logger.info(f"Starting OpenClaw provision for tenant {tenant_short_id}")

        # Step 1: Generate Helm values
        values_path = await workflow.execute_activity(
            "generate_openclaw_values",
            args=[instance_id, tenant_id, resource_config],
            start_to_close_timeout=timedelta(minutes=1),
            retry_policy=retry_policy,
        )

        workflow.logger.info(f"Generated values file: {values_path}")

        # Step 2: Helm install
        helm_result = await workflow.execute_activity(
            "helm_install_openclaw",
            args=[release_name, values_path, namespace],
            start_to_close_timeout=timedelta(minutes=7),
            retry_policy=retry_policy,
        )

        if not helm_result.get("success"):
            # Update instance with error status
            await workflow.execute_activity(
                "register_instance",
                args=[instance_id, "error", None, release_name, helm_result.get("stderr", "Helm install failed")],
                start_to_close_timeout=timedelta(minutes=1),
                retry_policy=retry_policy,
            )
            raise RuntimeError(f"Helm install failed: {helm_result.get('stderr')}")

        workflow.logger.info(f"Helm install succeeded for {release_name}")

        # Step 3: Wait for pod ready
        pod_result = await workflow.execute_activity(
            "wait_pod_ready",
            args=[release_name, namespace],
            start_to_close_timeout=timedelta(minutes=6),
            retry_policy=retry_policy,
        )

        workflow.logger.info(f"Pod ready: {pod_result['pod_name']} at {pod_result['pod_ip']}")

        # Step 4: Health check
        internal_url = f"http://{release_name}.{namespace}.svc.cluster.local:18789"
        health_result = await workflow.execute_activity(
            "health_check_openclaw",
            args=[internal_url],
            start_to_close_timeout=timedelta(minutes=2),
            retry_policy=retry_policy,
        )

        status = "running" if health_result.get("healthy") else "error"
        error = None if health_result.get("healthy") else "Health check failed after deployment"

        workflow.logger.info(f"Health check result: healthy={health_result.get('healthy')}")

        # Step 5: Register instance
        await workflow.execute_activity(
            "register_instance",
            args=[instance_id, status, internal_url, release_name, error],
            start_to_close_timeout=timedelta(minutes=1),
            retry_policy=retry_policy,
        )

        workflow.logger.info(f"Instance registered: status={status}")

        return {
            "status": status,
            "internal_url": internal_url,
            "helm_release": release_name,
            "pod_name": pod_result.get("pod_name"),
        }
