"use client"

import { useEffect, useState } from "react"

import { DeploymentsList } from "@/components/cards/deployments-list"
import { useAuth } from "@/components/providers/auth-provider"
import { apiRequest } from "@/lib/api-client"
import type { DeploymentRecord } from "@/lib/mock-data"

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
            updatedAt: deployment.last_synced_at,
          })),
        )
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  if (loading) {
    return <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-10 text-center">Loading deployments…</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Deployments workspace</h1>
        <p className="mt-2 text-sm text-slate-400">
          Kubernetes clusters, serverless targets, and rollout pipelines managed in one place.
        </p>
      </div>
      <DeploymentsList deployments={deployments} />
    </div>
  )
}
