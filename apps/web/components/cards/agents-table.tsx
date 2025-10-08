import { Badge } from "./badge"
import type { AgentRecord } from "@/lib/mock-data"

const statusStyles: Record<AgentRecord["status"], string> = {
  Running: "bg-emerald-500/15 text-emerald-300",
  Paused: "bg-amber-500/15 text-amber-300",
  Error: "bg-rose-500/15 text-rose-300",
}

export function AgentsTable({ agents }: { agents: AgentRecord[] }) {
  const hasAgents = agents.length > 0

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Fleet overview</h2>
        <button className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:border-brand hover:text-white">
          View all
        </button>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-800">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-slate-900 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Environment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Cost / Hour</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {hasAgents ? (
              agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-slate-900/40">
                  <td className="px-4 py-3 font-medium text-slate-100">{agent.name}</td>
                  <td className="px-4 py-3 text-slate-400">{agent.owner}</td>
                  <td className="px-4 py-3">
                    <Badge>{agent.environment}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${statusStyles[agent.status]}`}>
                      {agent.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{agent.costPerHour}</td>
                  <td className="px-4 py-3 text-slate-500">{agent.updatedAt}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-400">
                  No agents found yet. Use the marketplace blueprints to launch your first automation.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
