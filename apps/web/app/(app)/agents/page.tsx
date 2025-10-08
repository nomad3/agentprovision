"use client"

import { useEffect, useState } from "react"

import { AgentsTable } from "@/components/cards/agents-table"
import { useAuth } from "@/components/providers/auth-provider"
import { apiRequest } from "@/lib/api-client"
import type { AgentRecord } from "@/lib/types"

const STATUS_MAP: Record<string, AgentRecord["status"]> = {
  active: "Running",
  paused: "Paused",
  error: "Error",
  draft: "Paused",
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

export default function AgentsPage() {
  const { token } = useAuth()
  const [agents, setAgents] = useState<AgentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    const loadAgents = async () => {
      try {
        const response = await apiRequest<AgentResponse[]>("/api/v1/agents", { token })
        setAgents(
          response.map((agent) => ({
            id: agent.id,
            name: agent.name,
            owner: agent.owner ?? "",
            environment: agent.environment,
            status: STATUS_MAP[agent.status] ?? "Running",
            costPerHour: `$${Number(agent.cost_per_hour ?? 0).toFixed(2)}`,
            updatedAt: new Date(agent.updated_at).toLocaleString(),
          })),
        )
        setError(null)
      } catch (err) {
        setError((err as Error).message ?? "Unable to load agents")
      } finally {
        setLoading(false)
      }
    }
    loadAgents()
  }, [token])

  if (loading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">Loading agents…</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Agents</h1>
          <p className="mt-2 text-sm text-slate-500">
            Review orchestrated agents, ownership, and runtime health across environments.
          </p>
        </div>
      </div>
      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      <AgentsTable agents={agents} />
    </div>
  )
}
