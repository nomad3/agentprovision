import type { ReactNode } from "react"

import { Cloud, ServerCog } from "lucide-react"

import type { DeploymentRecord } from "@/lib/types"

const providerIcons: Record<string, ReactNode> = {
  AWS: <Cloud className="h-4 w-4 text-amber-500" />,
  GCP: <Cloud className="h-4 w-4 text-sky-500" />,
  Azure: <Cloud className="h-4 w-4 text-indigo-500" />,
  Default: <ServerCog className="h-4 w-4 text-slate-400" />,
}

export function DeploymentsList({ deployments }: { deployments: DeploymentRecord[] }) {
  const hasDeployments = deployments.length > 0

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Recent deployments</h2>
          <p className="text-sm text-slate-500">Rollout status across your connected environments.</p>
        </div>
        <button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-brand hover:text-brand">
          Manage infrastructure
        </button>
      </div>
      {hasDeployments ? (
        <ul className="space-y-4">
          {deployments.map((deployment) => (
            <li
              key={deployment.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  {providerIcons[deployment.provider] ?? providerIcons.Default}
                  {deployment.name}
                </div>
                <div className="text-xs text-slate-500">{deployment.environment}</div>
              </div>
              <div className="text-right text-xs text-slate-500">
                <div className="font-medium text-slate-700">{deployment.status}</div>
                <div>{deployment.updatedAt}</div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No deployments have been synced yet. Connect a cloud account to provision your first cluster.
        </div>
      )}
    </div>
  )
}
