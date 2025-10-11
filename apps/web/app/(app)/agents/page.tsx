"use client"

import { useState } from "react"

import { AgentBuilderCanvas } from "@/components/builder/agent-builder-canvas"
import { AgentLibrary } from "@/components/builder/agent-library"
import { AgentSimulationPanel } from "@/components/builder/agent-simulation-panel"
import { AgentTrainDialog } from "@/components/builder/agent-train-dialog"
import type { AgentNode, AgentTrainingConfig } from "@/lib/agent-designer-types"

export default function AgentsPage() {
  const [nodes, setNodes] = useState<AgentNode[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [trainDialogOpen, setTrainDialogOpen] = useState(false)
  const [trainingConfig, setTrainingConfig] = useState<AgentTrainingConfig | null>(null)

  const handleNodeCreate = (node: AgentNode) => {
    setNodes((existing) => [...existing, node])
    setSelectedNodeId(node.id)
  }

  const handleNodeUpdate = (nodeId: string, updates: Partial<AgentNode>) => {
    setNodes((existing) => existing.map((node) => (node.id === nodeId ? { ...node, ...updates } : node)))
  }

  const handleNodeDelete = (nodeId: string) => {
    setNodes((existing) => existing.filter((node) => node.id !== nodeId))
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null)
    }
  }

  const handleTrainingPlan = (config: AgentTrainingConfig) => {
    setTrainingConfig(config)
    setTrainDialogOpen(true)
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            Agent Designer
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Design, train, and deploy intelligent agents</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Assemble retrieval, policy, and orchestration capabilities with a drag-and-drop canvas. Connect to enterprise data sources,
            configure evaluation pipelines, and simulate agent runbooks before promoting to production.
          </p>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)_360px]">
        <AgentLibrary onCreateNode={handleNodeCreate} onPlanTraining={handleTrainingPlan} />
        <AgentBuilderCanvas
          nodes={nodes}
          onSelectNode={setSelectedNodeId}
          onUpdateNode={handleNodeUpdate}
          onDeleteNode={handleNodeDelete}
          selectedNodeId={selectedNodeId}
        />
        <AgentSimulationPanel
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          onUpdateNode={handleNodeUpdate}
          onPlanTraining={handleTrainingPlan}
        />
      </div>

      <AgentTrainDialog
        open={trainDialogOpen}
        onOpenChange={setTrainDialogOpen}
        trainingConfig={trainingConfig}
        onSubmit={(config) => {
          setTrainingConfig(config)
          setTrainDialogOpen(false)
        }}
      />
    </div>
  )
}
