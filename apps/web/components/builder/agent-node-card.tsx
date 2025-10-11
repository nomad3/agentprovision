"use client"

import { useMemo } from "react"

import type { AgentNode } from "@/lib/agent-designer-types"

type AgentNodeCardProps = {
  node: AgentNode
  selected: boolean
  onClick: () => void
  onUpdate: (nodeId: string, updates: Partial<AgentNode>) => void
  onDelete: (nodeId: string) => void
}

const statusStyles: Record<AgentNode["status"], string> = {
  draft: "bg-slate-100 text-slate-500",
  configured: "bg-emerald-100 text-emerald-700",
  "needs-data": "bg-amber-100 text-amber-700",
  error: "bg-rose-100 text-rose-700",
}

export function AgentNodeCard({ node, selected, onClick, onUpdate, onDelete }: AgentNodeCardProps) {
  const connectorsLabel = useMemo(() => {
    if (!node.dataConnectors?.length) return "No connectors"
    const healthy = node.dataConnectors.filter((connector) => connector.status === "connected").length
    return `${healthy}/${node.dataConnectors.length} connectors`
  }, [node.dataConnectors])

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onClick()
        }
      }}
      className={`group relative rounded-2xl border ${
        selected ? "border-brand shadow-brand/20" : "border-slate-200"
      } bg-white p-4 shadow-sm transition hover:border-brand/70 hover:shadow-md`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">{node.title}</p>
          <p className="text-xs text-slate-500">{node.description}</p>
        </div>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusStyles[node.status]}`}>
          {node.status.replace("-", " ")}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
        {node.latencyMs ? <span className="rounded-full bg-slate-100 px-2 py-0.5">{node.latencyMs}ms</span> : null}
        {node.tokensPerCall ? <span className="rounded-full bg-slate-100 px-2 py-0.5">{node.tokensPerCall} tokens</span> : null}
        <span className="rounded-full bg-slate-100 px-2 py-0.5">{connectorsLabel}</span>
      </div>
      {node.inputs?.length || node.outputs?.length ? (
        <div className="mt-4 grid gap-2 text-[11px] text-slate-500 sm:grid-cols-2">
          {node.inputs?.length ? (
            <div>
              <p className="font-semibold uppercase tracking-wide text-slate-400">Inputs</p>
              <ul className="mt-1 space-y-0.5">
                {node.inputs.map((input) => (
                  <li key={input} className="rounded-lg bg-slate-100/70 px-2 py-1">
                    {input}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {node.outputs?.length ? (
            <div>
              <p className="font-semibold uppercase tracking-wide text-slate-400">Outputs</p>
              <ul className="mt-1 space-y-0.5">
                {node.outputs.map((output) => (
                  <li key={output} className="rounded-lg bg-slate-100/70 px-2 py-1">
                    {output}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="mt-4 flex items-center justify-end gap-2 text-xs">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onUpdate(node.id, { status: node.status === "draft" ? "configured" : "draft" })
          }}
          className="rounded-lg border border-slate-200 px-2 py-1 text-slate-500 transition hover:border-brand hover:text-brand"
        >
          {node.status === "draft" ? "Mark configured" : "Mark draft"}
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onDelete(node.id)
          }}
          className="rounded-lg border border-rose-200 px-2 py-1 text-rose-600 transition hover:bg-rose-50"
        >
          Remove
        </button>
      </div>
    </div>
  )
}
