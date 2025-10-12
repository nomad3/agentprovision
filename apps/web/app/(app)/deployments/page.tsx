"use client"

import { useEffect, useState } from "react"

import { DeploymentsList } from "../../../components/cards/deployments-list"
import { useAuth } from "../../../components/providers/auth-provider"
import { apiRequest } from "../../../lib/api-client"
import type { DeploymentRecord } from "../../../lib/types"

type DeploymentResponse = {
  id: string
  name: string
  environment: string
  provider: string
  status: "healthy" | "degraded" | "failed"
  last_synced_at: string
}

const STATUS_MAP: Record<DeploymentResponse["status"], DeploymentRecord["status"]> = {
  healthy: "Healthy",
  degraded: "Degraded",
  failed: "Failed",
}

export default function DeploymentsPage() {
  const { token } = useAuth()
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    const load = async () => {
      try {
        const response = await apiRequest<DeploymentResponse[]>("/api/v1/deployments", { token })
        setDeployments(
          response.map((deployment) => ({
            id: deployment.id,
            name: deployment.name,
            environment: deployment.environment,
            provider: deployment.provider,
            status: STATUS_MAP[deployment.status],
            updatedAt: new Date(deployment.last_synced_at).toLocaleString(),
          })),
        )
        setError(null)
      } catch (err) {
        setError((err as Error).message ?? "Unable to load deployments")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  if (loading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">Loading deployments…</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Deployments</h1>
        <p className="mt-2 text-sm text-slate-500">
          Kubernetes clusters, serverless targets, and rollout pipelines managed in one place.
        </p>
      </div>
      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      <DeploymentsList deployments={deployments} />
    </div>
  )
}
