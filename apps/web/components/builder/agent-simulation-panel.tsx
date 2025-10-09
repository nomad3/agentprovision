"use client"

import { useMemo, useState } from "react"

import type { AgentNode, AgentTrainingConfig } from "@/lib/agent-designer-types"

type AgentSimulationPanelProps = {
  nodes: AgentNode[]
  selectedNodeId: string | null
  onUpdateNode: (id: string, updates: Partial<AgentNode>) => void
  onPlanTraining: (config: AgentTrainingConfig) => void
}

const PLAYBOOK_TEMPLATES = [
  {
    id: "drift-alert",
    name: "Model drift alert",
    description: "Route drift signals to Slack and trigger n8n remediation workflows.",
  },
  {
    id: "policy-review",
    name: "Policy review",
    description: "Aggregate guardrail rejections for human review in ServiceNow.",
  },
  {
    id: "retraining",
    name: "Retraining pipeline",
    description: "Launch evaluation suite and vector refresh when schema changes detected.",
  },
]

export function AgentSimulationPanel({ nodes, selectedNodeId, onUpdateNode, onPlanTraining }: AgentSimulationPanelProps) {
  const [prompt, setPrompt] = useState("Monitor regional finance risk exposure and escalate exceptions > 5%.")
  const [simulationLog, setSimulationLog] = useState<string[]>([])
  const [isSimulating, setIsSimulating] = useState(false)

  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId), [nodes, selectedNodeId])

  const handleRunSimulation = async () => {
    setIsSimulating(true)
    setSimulationLog((log) => ["Starting simulation...", ...log])
    await new Promise((resolve) => setTimeout(resolve, 800))
    setSimulationLog((log) => ["Retrieving context from vector store", ...log])
    await new Promise((resolve) => setTimeout(resolve, 700))
    setSimulationLog((log) => ["Policies approved request", ...log])
    await new Promise((resolve) => setTimeout(resolve, 600))
    setSimulationLog((log) => ["Triggered n8n workflow for finance handoff", ...log])
    setIsSimulating(false)
  }

  return (
    <aside className="flex min-h-[620px] w-full flex-col gap-6 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-900">Simulation & Runbooks</h2>
        <p className="text-xs text-slate-500">Test prompts against your canvas, preview guardrail outcomes, and trigger automation playbooks.</p>
      </div>

      <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50/60 p-4">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Prompt playground</label>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={4}
          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        <button
          type="button"
          onClick={handleRunSimulation}
          disabled={isSimulating}
          className="inline-flex w-full items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {isSimulating ? "Running simulation…" : "Run simulation"}
        </button>
        <div className="space-y-2 text-xs text-slate-500">
          <p className="font-semibold text-slate-700">Execution log</p>
          <div className="h-32 overflow-y-auto rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-inner">
            {simulationLog.length ? (
              <ul className="space-y-1">
                {simulationLog.map((entry, index) => (
                  <li key={`${entry}-${index}`} className="text-[11px] text-slate-500">
                    {entry}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-slate-400">No simulations run yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Selected module</p>
            <p className="text-xs text-slate-500">
              {selectedNode ? `Configure parameters for ${selectedNode.title}.` : "Select a module to edit its parameters."}
            </p>
          </div>
          {selectedNode ? (
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-500">{selectedNode.category}</span>
          ) : null}
        </div>
        {selectedNode ? (
          <div className="space-y-3 text-xs text-slate-500">
            <div>
              <label className="font-semibold uppercase tracking-wide text-slate-400">Description</label>
              <textarea
                value={selectedNode.description}
                onChange={(event) => onUpdateNode(selectedNode.id, { description: event.target.value })}
                rows={3}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="font-semibold uppercase tracking-wide text-slate-400">Latency (ms)</label>
                <input
                  type="number"
                  value={selectedNode.latencyMs ?? 0}
                  onChange={(event) => onUpdateNode(selectedNode.id, { latencyMs: Number(event.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div>
                <label className="font-semibold uppercase tracking-wide text-slate-400">Tokens per call</label>
                <input
                  type="number"
                  value={selectedNode.tokensPerCall ?? 0}
                  onChange={(event) => onUpdateNode(selectedNode.id, { tokensPerCall: Number(event.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>
            </div>
            <div>
              <label className="font-semibold uppercase tracking-wide text-slate-400">Connectors</label>
              <div className="mt-1 space-y-2">
                {selectedNode.dataConnectors?.length ? (
                  selectedNode.dataConnectors.map((connector) => (
                    <div key={connector.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{connector.name}</p>
                        <p className="text-[11px] text-slate-400">{connector.type.toUpperCase()} • {connector.scope ?? ""}</p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          connector.status === "connected"
                            ? "bg-emerald-100 text-emerald-700"
                            : connector.status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {connector.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-400">No connectors attached. Add from the library or training blueprint.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-xs text-slate-400">
            Select a module to configure runtime parameters and data connectors.
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Automation playbooks</p>
            <p className="text-xs text-slate-500">Connect to n8n workflows to operationalize escalations and approvals.</p>
          </div>
        </div>
        <div className="space-y-2">
          {PLAYBOOK_TEMPLATES.map((playbook) => (
            <div key={playbook.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-sm font-semibold text-slate-700">{playbook.name}</p>
              <p className="text-[11px] text-slate-500">{playbook.description}</p>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onPlanTraining({
            jobName: "playbook-eval-refresh",
            objective: "Automate evaluation update and remediation hooks",
            embeddingModel: "text-embedding-3-large",
            schedule: "weekly",
            chunkingStrategy: "semantic",
            connectors: [],
          })}
          className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-brand hover:text-brand"
        >
          Schedule blueprint run
        </button>
      </div>
    </aside>
  )
}
