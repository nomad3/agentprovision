"use client"

import { ArrowUpRight, PlayCircle } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { AgentsTable } from "../../../components/cards/agents-table"
import { DeploymentsList } from "../../../components/cards/deployments-list"
import { MetricCard } from "../../../components/cards/metric-card"
import { useAuth } from "../../../components/providers/auth-provider"
import { apiRequest } from "../../../lib/api-client"
import type { AgentMetric, AgentRecord, DeploymentRecord } from "../../../lib/types"

const DEFAULT_METRICS: AgentMetric[] = [
  { label: "Active Agents", value: "--", change: 0, trend: "up" },
  { label: "Monthly Spend", value: "--", change: 0, trend: "up" },
  { label: "Paused Agents", value: "--", change: 0, trend: "down" },
  { label: "Healthy Deployments", value: "--", change: 0, trend: "up" },
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
  updated_at: string
}

type DeploymentResponse = {
  id: string
  name: string
  environment: string
  provider: string
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
            updatedAt: new Date(deployment.last_synced_at).toLocaleString(),
          })),
        )
        setError(null)
      } catch (err) {
        setError((err as Error).message ?? "Unable to load workspace data")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [token])

  const greeting = useMemo(() => {
    if (!user?.full_name) return "Welcome back"
    const firstName = user.full_name.split(" ")[0]
    return `Welcome back, ${firstName}`
  }, [user?.full_name])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        Loading your workspace…
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.45fr)]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">{user?.tenant_name ?? "Your workspace"}</p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-900">{greeting}</h1>
            </div>
            <Link
              href="/agents"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-brand hover:text-brand"
            >
              View agents
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Track performance, deployments, and spend. Use the quick actions below to launch templates or connect cloud accounts.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <QuickAction title="Launch template" description="Browse curated agent playbooks." href="/marketplace" />
            <QuickAction title="Connect cloud" description="Add AWS, Azure, or GCP accounts." href="/deployments" />
            <QuickAction title="Invite teammate" description="Collaborate with your operations team." href="/teams" />
          </div>
        </div>
        <div className="rounded-3xl border border-brand/20 bg-gradient-to-br from-brand/10 to-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-dark">
            <PlayCircle className="h-4 w-4" />
            Guided walkthrough
          </div>
          <p className="mt-3 text-sm text-slate-700">
            See how companies orchestrate compliant AI agents with AgentProvision. This 8-minute tour covers governance, deployment guardrails, and cost visibility.
          </p>
          <a
            href="https://agentprovision.com/demo"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-brand/30 transition hover:bg-brand-dark"
          >
            Watch the overview
            <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {agentMetrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <AgentsTable agents={agents} />
        </div>
        <div className="space-y-6">
          <DeploymentsList deployments={deployments} />
        </div>
      </section>
    </div>
  )
}

function QuickAction({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 transition hover:border-brand hover:text-brand"
    >
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </Link>
  )
}
