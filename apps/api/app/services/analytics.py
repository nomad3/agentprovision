from collections.abc import Sequence

from app.models.agent import Agent, AgentStatus
from app.models.deployment import Deployment, DeploymentStatus


def build_summary(agents: Sequence[Agent], deployments: Sequence[Deployment]) -> dict[str, object]:
    active_agents = sum(1 for agent in agents if agent.status == AgentStatus.ACTIVE)
    paused_agents = sum(1 for agent in agents if agent.status == AgentStatus.PAUSED)
    error_agents = sum(1 for agent in agents if agent.status == AgentStatus.ERROR)

    spend = float(sum(agent.cost_per_hour for agent in agents))

    healthy_deployments = sum(1 for deployment in deployments if deployment.status == DeploymentStatus.HEALTHY)

    return {
        "active_agents": active_agents,
        "paused_agents": paused_agents,
        "error_agents": error_agents,
        "monthly_spend": round(spend * 720, 2),  # rough monthly projection
        "deployment_health": healthy_deployments,
        "total_deployments": len(deployments),
    }
