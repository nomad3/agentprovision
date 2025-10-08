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
                }
            ],
            "agents": [
                {
                    "name": "RevenueOps Analyst",
                    "owner": "RevOps",
                    "environment": "prod-us-east-1",
                    "status": AgentStatus.ACTIVE,
                    "cost_per_hour": Decimal("1.42"),
                },
                {
                    "name": "Marketing Playbook Coach",
                    "owner": "Marketing",
                    "environment": "prod-eu-west-1",
                    "status": AgentStatus.ACTIVE,
                    "cost_per_hour": Decimal("0.98"),
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
                }
            ],
            "agents": [
                {
                    "name": "Security Ops Responder",
                    "owner": "Security",
                    "environment": "staging-us-west-2",
                    "status": AgentStatus.PAUSED,
                    "cost_per_hour": Decimal("1.87"),
                },
                {
                    "name": "Clinical Intake Assistant",
                    "owner": "Clinical Ops",
                    "environment": "prod-us-east-1",
                    "status": AgentStatus.ACTIVE,
                    "cost_per_hour": Decimal("2.10"),
                },
            ],
            "deployments": [
                {
                    "name": "AKS - Compliance",
                    "environment": "azure-staging",
                    "provider": "Azure",
                    "status": DeploymentStatus.DEGRADED,
                }
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
                hashed_password=get_password_hash(user_payload["password"]),
            )
            session.add(user)

        for agent_payload in tenant_payload["agents"]:
            agent = Agent(
                tenant_id=tenant.id,
                name=agent_payload["name"],
                owner=agent_payload.get("owner"),
                environment=agent_payload["environment"],
                status=agent_payload["status"],
                cost_per_hour=agent_payload["cost_per_hour"],
                config={},
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
