"use client"

import { useMemo, useState } from "react"

import type { AgentNode } from "../../lib/agent-designer-types"

import { AgentNodeCard } from "./agent-node-card"

type AgentBuilderCanvasProps = {
  nodes: AgentNode[]
  selectedNodeId: string | null
  onSelectNode: (id: string | null) => void
  onUpdateNode: (id: string, updates: Partial<AgentNode>) => void
  onDeleteNode: (id: string) => void
}

export function AgentBuilderCanvas({ nodes, selectedNodeId, onSelectNode, onUpdateNode, onDeleteNode }: AgentBuilderCanvasProps) {
  const [scale, setScale] = useState(1)
  const groupedNodes = useMemo(() => {
    return nodes.reduce<Record<string, AgentNode[]>>((acc, node) => {
      if (!acc[node.category]) {
        acc[node.category] = []
      }
      acc[node.category].push(node)
      return acc
    }, {})
  }, [nodes])

  return (
    <div className="relative flex min-h-[620px] flex-col rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Agent Canvas</h2>
          <p className="text-xs text-slate-500">Arrange orchestration and policy modules. Connect data sources to power agent behaviors.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            type="button"
            onClick={() => setScale((value) => Math.max(0.5, Number((value - 0.1).toFixed(1))))}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-brand hover:text-brand"
          >
            -
          </button>
          <span className="w-12 text-center tabular-nums">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            onClick={() => setScale((value) => Math.min(1.5, Number((value + 0.1).toFixed(1))))}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-brand hover:text-brand"
          >
            +
          </button>
        </div>
      </div>
      <div
        className="relative flex-1 overflow-auto rounded-b-3xl bg-gradient-to-br from-slate-50 via-white to-slate-100"
        style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        <div className="grid gap-6 p-6 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(groupedNodes).map(([category, categoryNodes]) => (
            <section key={category} className="space-y-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">{category}</h3>
                <span className="text-[11px] uppercase tracking-wide text-slate-400">{categoryNodes.length} modules</span>
              </div>
              <div className="space-y-3">
                {categoryNodes.map((node) => (
                  <AgentNodeCard
                    key={node.id}
                    node={node}
                    selected={selectedNodeId === node.id}
                    onClick={() => onSelectNode(node.id)}
                    onUpdate={onUpdateNode}
                    onDelete={onDeleteNode}
                  />
                ))}
              </div>
            </section>
          ))}
          {!nodes.length ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/70 text-center text-slate-500">
              <p className="text-sm font-semibold text-slate-700">Drop modules here to start orchestrating your agent</p>
              <p className="mt-2 max-w-sm text-xs text-slate-500">
                Ingest data with vectors or SQL connectors, add guardrails, and orchestrate tools. Your canvas updates as you drag modules from the library.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
