"use client"

import { useEffect, useState } from "react"

import { AgentsTable } from "@/components/cards/agents-table"
import { DeploymentsList } from "@/components/cards/deployments-list"
import { MetricCard } from "@/components/cards/metric-card"
import { useAuth } from "@/components/providers/auth-provider"
import { apiRequest } from "@/lib/api-client"
import type { AgentMetric, AgentRecord, DeploymentRecord } from "@/lib/mock-data"

const DEFAULT_METRICS: AgentMetric[] = [
  { label: "Active Agents", value: "0", change: 0, trend: "up" },
  { label: "Monthly Spend", value: "$0", change: 0, trend: "up" },
  { label: "Paused Agents", value: "0", change: 0, trend: "down" },
  { label: "Healthy Deployments", value: "0", change: 0, trend: "up" },
]

type SummaryResponse = {
  active_agents: number
  paused_agents: number
  error_agents: number
  monthly_spend: number
  deployment_health: number
  total_deployments: number
}

type AgentResponse = {
  id: string
  name: string
  owner?: string | null
  environment: string
  status: "draft" | "active" | "paused" | "error"
  cost_per_hour: number
  description?: string | null
  updated_at: string
}

type DeploymentResponse = {
  id: string
  name: string
  provider: string
  environment: string
  status: "healthy" | "degraded" | "failed"
  last_synced_at: string
}

const STATUS_MAP: Record<string, AgentRecord["status"]> = {
  active: "Running",
  paused: "Paused",
  error: "Error",
  draft: "Paused",
}

export default function DashboardPage() {
  const { token, user } = useAuth()
  const [agentMetrics, setAgentMetrics] = useState<AgentMetric[]>(DEFAULT_METRICS)
  const [agents, setAgents] = useState<AgentRecord[]>([])
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return

    const load = async () => {
      try {
        const [summary, agentsResponse, deploymentsResponse] = await Promise.all([
          apiRequest<SummaryResponse>("/api/v1/analytics/summary", { token }),
          apiRequest<AgentResponse[]>("/api/v1/agents", { token }),
          apiRequest<DeploymentResponse[]>("/api/v1/deployments", { token }),
        ])

        setAgentMetrics([
          {
            label: "Active Agents",
            value: String(summary.active_agents),
            change: summary.error_agents > 0 ? -summary.error_agents : summary.active_agents,
            trend: summary.error_agents > 0 ? "down" : "up",
          },
          {
            label: "Monthly Spend",
            value: `$${summary.monthly_spend.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            change: summary.monthly_spend ? 12 : 0,
            trend: "up",
          },
          {
            label: "Paused Agents",
            value: String(summary.paused_agents),
            change: summary.paused_agents,
            trend: summary.paused_agents ? "down" : "up",
          },
          {
            label: "Healthy Deployments",
            value: `${summary.deployment_health}/${summary.total_deployments}`,
            change: summary.deployment_health,
            trend: summary.deployment_health === summary.total_deployments ? "up" : "down",
          },
        ])

        setAgents(
          agentsResponse.map((agent) => ({
            id: agent.id,
            name: agent.name,
            owner: agent.owner ?? "",
            environment: agent.environment,
            status: STATUS_MAP[agent.status] ?? "Running",
            costPerHour: `$${Number(agent.cost_per_hour ?? 0).toFixed(2)}`,
            updatedAt: new Date(agent.updated_at).toLocaleString(),
          })),
        )

        setDeployments(
          deploymentsResponse.map((deployment) => ({
            id: deployment.id,
            name: deployment.name,
            environment: deployment.environment,
            provider: deployment.provider,
            status:
              deployment.status === "healthy"
                ? "Healthy"
                : deployment.status === "degraded"
                  ? "Degraded"
                  : "Failed",
            updatedAt: deployment.last_synced_at,
          })),
        )
      } catch (err) {
        setError((err as Error).message ?? 'Unable to load workspace data')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [token])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-400">
        Loading your workspace…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold text-white">Command Center</h1>
        <p className="mt-1 text-sm text-slate-400">
          {user ? `Monitoring ${user.tenant_name}` : "Monitor agent health, deployments, and spend across every environment in real time."}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {agentMetrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AgentsTable agents={agents} />
        </div>
        <div className="space-y-6">
          <DeploymentsList deployments={deployments} />
        </div>
      </section>
    </div>
  )
}
