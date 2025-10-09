from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.models.agent import Agent, AgentStatus
from app.models.deployment import Deployment, DeploymentStatus
from app.models.tenant import Tenant
from app.models.user import User


async def seed_demo_data(session: AsyncSession) -> None:
    existing = await session.execute(select(Tenant))
    if existing.scalars().first():
        return

    tenants = [
        {
            "name": "Nimbus Retail",
            "slug": "nimbus-retail",
            "users": [
                {
                    "email": "retail-demo@agentprovision.com",
                    "full_name": "Priya Das",
                    "password": "SecurePass!23",
                    "role": "Director, Revenue Operations",
                },
                {
                    "email": "ops-lead@agentprovision.com",
                    "full_name": "Carlos Alvarez",
                    "password": "OpsCtrl!34",
                    "role": "VP, Platform Engineering",
                },
            ],
            "agents": [
                {
                    "name": "RevenueOps Analyst",
                    "owner": "RevOps",
                    "description": "Monitors revenue pipeline hygiene and orchestrates account handoffs across Salesforce and Snowflake.",
                    "environment": "prod-us-east-1",
                    "status": AgentStatus.ACTIVE,
                    "cost_per_hour": Decimal("1.42"),
                    "config": {
                        "model": "gpt-4o",
                        "connectors": ["snowflake", "salesforce"],
                        "policies": ["soc2", "sox"],
                    },
                },
                {
                    "name": "Marketing Playbook Coach",
                    "owner": "Marketing",
                    "description": "Generates campaign messaging across channels with guardrailed brand voice and spend telemetry.",
                    "environment": "prod-eu-west-1",
                    "status": AgentStatus.ACTIVE,
                    "cost_per_hour": Decimal("0.98"),
                    "config": {
                        "model": "claude-3-sonnet",
                        "connectors": ["hubspot", "bigquery"],
                        "policies": ["brand", "gdpr"],
                    },
                },
                {
                    "name": "Store Ops Evaluator",
                    "owner": "Retail Ops",
                    "description": "Audits store telemetry for anomalies and triggers n8n remediation workflows.",
                    "environment": "staging-us-west-2",
                    "status": AgentStatus.PAUSED,
                    "cost_per_hour": Decimal("1.10"),
                    "config": {
                        "model": "gpt-4o",
                        "connectors": ["postgres", "n8n"],
                        "policies": ["pci"],
                    },
                },
            ],
            "deployments": [
                {
                    "name": "EKS - North America",
                    "environment": "aws-prod",
                    "provider": "AWS",
                    "status": DeploymentStatus.HEALTHY,
                },
                {
                    "name": "Cloud Run - Europe",
                    "environment": "gcp-prod",
                    "provider": "GCP",
                    "status": DeploymentStatus.HEALTHY,
                },
                {
                    "name": "Agents Lambda Edge",
                    "environment": "aws-edge",
                    "provider": "AWS",
                    "status": DeploymentStatus.HEALTHY,
                },
            ],
        },
        {
            "name": "Helio Health",
            "slug": "helio-health",
            "users": [
                {
                    "email": "health-demo@agentprovision.com",
                    "full_name": "Morgan Chen",
                    "password": "CareOps!42",
                    "role": "Chief Clinical Officer",
                },
                {
                    "email": "compliance@agentprovision.com",
                    "full_name": "Sandra Lee",
                    "password": "SecureAudit!19",
                    "role": "Director, Compliance",
                },
            ],
            "agents": [
                {
                    "name": "Security Ops Responder",
                    "owner": "Security",
                    "description": "Investigates telemetry alerts, enforces ServiceNow MCP policies, and orchestrates PagerDuty responders.",
                    "environment": "staging-us-west-2",
                    "status": AgentStatus.PAUSED,
                    "cost_per_hour": Decimal("1.87"),
                    "config": {
                        "model": "claude-3-opus",
                        "connectors": ["servicenow", "pagerduty"],
                        "policies": ["hipaa", "soc2"],
                    },
                },
                {
                    "name": "Clinical Intake Assistant",
                    "owner": "Clinical Ops",
                    "description": "Transcribes patient intake, applies guardrails, and writes structured updates back into Epic.",
                    "environment": "prod-us-east-1",
                    "status": AgentStatus.ACTIVE,
                    "cost_per_hour": Decimal("2.10"),
                    "config": {
                        "model": "gpt-4o",
                        "connectors": ["epic", "s3"],
                        "policies": ["hipaa"],
                    },
                },
                {
                    "name": "Utilization Forecaster",
                    "owner": "Finance",
                    "description": "Forecasts bed utilization by region with Snowflake metrics and publishes Looker dashboards.",
                    "environment": "prod-eu-central-1",
                    "status": AgentStatus.ACTIVE,
                    "cost_per_hour": Decimal("1.65"),
                    "config": {
                        "model": "gpt-4.1-mini",
                        "connectors": ["snowflake", "looker"],
                        "policies": ["gdpr"],
                    },
                },
            ],
            "deployments": [
                {
                    "name": "AKS - Compliance",
                    "environment": "azure-staging",
                    "provider": "Azure",
                    "status": DeploymentStatus.DEGRADED,
                },
                {
                    "name": "GKE - Europe",
                    "environment": "gcp-prod",
                    "provider": "GCP",
                    "status": DeploymentStatus.HEALTHY,
                },
            ],
        },
        {
            "name": "Forge Industrial",
            "slug": "forge-industrial",
            "users": [
                {
                    "email": "industrial-demo@agentprovision.com",
                    "full_name": "Ethan Ryder",
                    "password": "ForgeOps!27",
                    "role": "VP, Manufacturing Excellence",
                },
                {
                    "email": "iot-platform@agentprovision.com",
                    "full_name": "Jamie Patel",
                    "password": "EdgeSecure!55",
                    "role": "Director, IIoT Platform",
                },
            ],
            "agents": [
                {
                    "name": "Predictive Maintenance",
                    "owner": "Operations",
                    "description": "Monitors edge telemetry, predicts failures, and coordinates technician dispatch via ServiceNow.",
                    "environment": "prod-us-central-1",
                    "status": AgentStatus.ACTIVE,
                    "cost_per_hour": Decimal("1.30"),
                    "config": {
                        "model": "gpt-4.1-mini",
                        "connectors": ["mqtt", "postgres", "n8n"],
                        "policies": ["iso27001"],
                    },
                },
                {
                    "name": "Supplier Risk Sentinel",
                    "owner": "Procurement",
                    "description": "Evaluates supplier SLAs, renewals, and risk signals with MCP Salesforce guardrails.",
                    "environment": "prod-ap-southeast-1",
                    "status": AgentStatus.ACTIVE,
                    "cost_per_hour": Decimal("1.55"),
                    "config": {
                        "model": "claude-3-sonnet",
                        "connectors": ["salesforce", "snowflake"],
                        "policies": ["sox", "gdpr"],
                    },
                },
            ],
            "deployments": [
                {
                    "name": "EKS - Edge",
                    "environment": "aws-outposts",
                    "provider": "AWS",
                    "status": DeploymentStatus.HEALTHY,
                },
                {
                    "name": "IoT Greengrass",
                    "environment": "aws-iot",
                    "provider": "AWS",
                    "status": DeploymentStatus.HEALTHY,
                },
            ],
        },
    ]

    for tenant_payload in tenants:
        tenant = Tenant(name=tenant_payload["name"], slug=tenant_payload["slug"])
        session.add(tenant)
        await session.flush()

        for user_payload in tenant_payload["users"]:
            user = User(
                tenant_id=tenant.id,
                email=user_payload["email"],
                full_name=user_payload.get("full_name"),
                title=user_payload.get("role"),
                hashed_password=get_password_hash(user_payload["password"]),
            )
            session.add(user)

        for agent_payload in tenant_payload["agents"]:
            agent = Agent(
                tenant_id=tenant.id,
                name=agent_payload["name"],
                owner=agent_payload.get("owner"),
                description=agent_payload.get("description"),
                environment=agent_payload["environment"],
                status=agent_payload["status"],
                cost_per_hour=agent_payload["cost_per_hour"],
                config=agent_payload.get("config", {}),
            )
            session.add(agent)

        for deployment_payload in tenant_payload["deployments"]:
            deployment = Deployment(
                tenant_id=tenant.id,
                name=deployment_payload["name"],
                environment=deployment_payload["environment"],
                provider=deployment_payload["provider"],
                status=deployment_payload["status"],
            )
            session.add(deployment)

    await session.commit()
