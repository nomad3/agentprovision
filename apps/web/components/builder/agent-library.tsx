"use client"

import { useMemo } from "react"

import type { AgentNode, AgentNodeCategory, AgentTrainingConfig } from "../../lib/agent-designer-types"

const MODULE_LIBRARY: Array<{
  id: string
  title: string
  category: AgentNodeCategory
  description: string
  latencyMs: number
  tokensPerCall: number
  recommendedInputs?: string[]
  recommendedOutputs?: string[]
}> = [
  {
    id: "retrieval-vector",
    title: "Vector Retrieval",
    category: "Retrieval",
    description: "Embeddings-backed search across private corpora with semantic chunking and freshness filters.",
    latencyMs: 220,
    tokensPerCall: 1200,
    recommendedInputs: ["query", "tenant"],
    recommendedOutputs: ["ranked_documents"],
  },
  {
    id: "retrieval-sql",
    title: "SQL Knowledge",
    category: "Retrieval",
    description: "Parameterised SQL agent that supports row-level security and dynamic joins across warehouses.",
    latencyMs: 410,
    tokensPerCall: 800,
    recommendedInputs: ["query", "filters"],
    recommendedOutputs: ["records"],
  },
  {
    id: "policy-guardrail",
    title: "Policy Guardrail",
    category: "Policy",
    description: "Inline guardrail enforcing SOC2/GDPR rules with policy packs and human approval fallbacks.",
    latencyMs: 80,
    tokensPerCall: 400,
    recommendedInputs: ["conversation", "metadata"],
    recommendedOutputs: ["approved", "reason"],
  },
  {
    id: "memory-session",
    title: "Session Memory",
    category: "Memory",
    description: "Short-term memory buffer with per-tenant isolation, TTL controls, and encryption at rest.",
    latencyMs: 45,
    tokensPerCall: 250,
    recommendedInputs: ["session_context"],
    recommendedOutputs: ["updated_context"],
  },
  {
    id: "actions-webhook",
    title: "Webhook Action",
    category: "Actions",
    description: "Trigger downstream workflows via signed webhooks with retry logic and observability hooks.",
    latencyMs: 120,
    tokensPerCall: 150,
    recommendedInputs: ["payload"],
    recommendedOutputs: ["delivery_status"],
  },
  {
    id: "evaluation-replay",
    title: "Evaluation Replay",
    category: "Evaluation",
    description: "Replay user interactions with scoring rubrics, automated annotation, and regression tracking.",
    latencyMs: 180,
    tokensPerCall: 500,
    recommendedInputs: ["transcript"],
    recommendedOutputs: ["score", "feedback"],
  },
  {
    id: "connector-snowflake",
    title: "Snowflake Connector",
    category: "Connectors",
    description: "Federated warehouse connector with materialized views and automated masking policies.",
    latencyMs: 390,
    tokensPerCall: 900,
  },
  {
    id: "automation-n8n",
    title: "n8n Workflow",
    category: "Automation",
    description: "Bi-directional n8n workflow trigger to orchestrate approvals, enrichment, and notifications.",
    latencyMs: 210,
    tokensPerCall: 320,
    recommendedInputs: ["event", "context"],
    recommendedOutputs: ["workflow_status"],
  },
]

const TRAINING_CONNECTORS: AgentTrainingConfig["connectors"] = [
  {
    id: "pg-finance",
    name: "Finance Postgres",
    type: "postgres",
    status: "ready",
    scope: "finance-prod",
  },
  {
    id: "sf-warehouse",
    name: "Snowflake Warehouse",
    type: "snowflake",
    status: "ready",
    scope: "warehouse-analytics",
  },
  {
    id: "s3-recordings",
    name: "S3 Call Recordings",
    type: "s3",
    status: "pending",
    scope: "s3://agentprovision-demo/call-recordings",
  },
]

type AgentLibraryProps = {
  onCreateNode: (node: AgentNode) => void
  onPlanTraining: (config: AgentTrainingConfig) => void
}

export function AgentLibrary({ onCreateNode, onPlanTraining }: AgentLibraryProps) {
  const modulesByCategory = useMemo(() => {
    return MODULE_LIBRARY.reduce<Record<AgentNodeCategory, typeof MODULE_LIBRARY>>(
      (acc, module) => {
        if (!acc[module.category]) {
          acc[module.category] = []
        }
        acc[module.category].push(module)
        return acc
      },
      {
        Retrieval: [],
        Memory: [],
        Policy: [],
        Actions: [],
        Evaluation: [],
        Connectors: [],
        Automation: [],
      },
    )
  }, [])

  const handleAddModule = (moduleId: string) => {
    const libraryModule = MODULE_LIBRARY.find((entry) => entry.id === moduleId)
    if (!libraryModule) return

    const node: AgentNode = {
      id: crypto.randomUUID(),
      title: libraryModule.title,
      category: libraryModule.category,
      description: libraryModule.description,
      status: "draft",
      latencyMs: libraryModule.latencyMs,
      tokensPerCall: libraryModule.tokensPerCall,
      inputs: libraryModule.recommendedInputs,
      outputs: libraryModule.recommendedOutputs,
      dataConnectors: [],
      params: {},
    }
    onCreateNode(node)
  }

  const handlePlanTrainingClick = () => {
    const config: AgentTrainingConfig = {
      jobName: "agent-experience-sync",
      objective: "Refresh retrieval corpus and evaluation rubrics for conversational agent",
      embeddingModel: "text-embedding-3-large",
      retriever: "faiss",
      schedule: "daily",
      chunkingStrategy: "hybrid",
      chunkSize: 800,
      connectors: TRAINING_CONNECTORS,
      evaluationPlan: {
        rubric: "Groundedness >= 0.85, Policy compliance >= 0.95",
        successThreshold: 0.9,
        reviewers: ["Priya Das", "Morgan Chen"],
      },
    }
    onPlanTraining(config)
  }

  return (
    <aside className="flex min-h-[620px] w-full flex-col gap-6 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm xl:max-w-xs">
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-900">Module Library</h2>
        <p className="text-xs text-slate-500">Drag or click to add orchestration modules, connect data sources, and configure guardrails.</p>
      </div>

      <div className="space-y-4 overflow-y-auto pr-1">
        {Object.entries(modulesByCategory).map(([category, modules]) => (
          <section key={category} className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
              <span>{category}</span>
              <span>{modules.length}</span>
            </div>
            <div className="space-y-2">
              {modules.map((module) => (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => handleAddModule(module.id)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left shadow-sm transition hover:border-brand hover:shadow-brand/10"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{module.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{module.description}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">{module.latencyMs}ms</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">{module.tokensPerCall} tokens</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
        <div>
          <p className="text-sm font-semibold text-slate-800">Training blueprints</p>
          <p className="mt-1 text-xs text-slate-500">Sync embeddings, align guardrails, and benchmark evaluation metrics with scheduled jobs.</p>
        </div>
        <ul className="space-y-2 text-xs text-slate-500">
          <li>• Vector refresh with semantic chunking</li>
          <li>• Warehouse snapshots with masking policies</li>
          <li>• SOC2/GDPR compliance regression suite</li>
        </ul>
        <button
          type="button"
          onClick={handlePlanTrainingClick}
          className="inline-flex w-full items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          Plan training job
        </button>
      </div>
    </aside>
  )
}
