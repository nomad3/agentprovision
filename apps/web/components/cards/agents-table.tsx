import type { AgentRecord } from "@/lib/types"
import { Badge } from "./badge"

const statusStyles: Record<AgentRecord["status"], string> = {
  Running: "bg-emerald-100 text-emerald-700",
  Paused: "bg-amber-100 text-amber-700",
  Error: "bg-rose-100 text-rose-700",
}

export function AgentsTable({ agents }: { agents: AgentRecord[] }) {
  const hasAgents = agents.length > 0

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Agent activity</h2>
          <p className="text-sm text-slate-500">Ownership, spend, and health at a glance.</p>
        </div>
        <button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-brand hover:text-brand">
          View all
        </button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Environment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Cost / hour</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {hasAgents ? (
              agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-medium text-slate-900">{agent.name}</td>
                  <td className="px-4 py-3 text-slate-600">{agent.owner}</td>
                  <td className="px-4 py-3">
                    <Badge>{agent.environment}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${statusStyles[agent.status]}`}>
                      {agent.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{agent.costPerHour}</td>
                  <td className="px-4 py-3 text-slate-500">{agent.updatedAt}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
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
