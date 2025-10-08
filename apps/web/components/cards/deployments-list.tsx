import type { ReactNode } from "react"

import { Cloud, ServerCog } from "lucide-react"

import type { DeploymentRecord } from "@/lib/mock-data"

const providerIcons: Record<string, ReactNode> = {
  AWS: <Cloud className="h-4 w-4 text-amber-300" />,
  GCP: <Cloud className="h-4 w-4 text-sky-300" />,
  Azure: <Cloud className="h-4 w-4 text-indigo-300" />,
  Default: <ServerCog className="h-4 w-4 text-slate-300" />,
}

export function DeploymentsList({ deployments }: { deployments: DeploymentRecord[] }) {
  const hasDeployments = deployments.length > 0

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Recent deployments</h2>
        <button className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:border-brand hover:text-white">
          Manage infrastructure
        </button>
      </div>
      {hasDeployments ? (
        <ul className="space-y-4">
          {deployments.map((deployment) => (
            <li
              key={deployment.id}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3"
            >
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  {providerIcons[deployment.provider] ?? providerIcons.Default}
                  {deployment.name}
                </div>
                <div className="text-xs text-slate-400">{deployment.environment}</div>
              </div>
              <div className="text-right text-xs text-slate-400">
                <div className="font-medium text-slate-200">{deployment.status}</div>
                <div>{new Date(deployment.updatedAt).toLocaleString()}</div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
          No deployments have been synced yet. Connect a cloud account to provision your first cluster.
        </div>
      )}
    </div>
  )
}
