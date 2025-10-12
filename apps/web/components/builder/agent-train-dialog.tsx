"use client"

import type { AgentTrainingConfig } from "../../lib/agent-designer-types"

type AgentTrainDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  trainingConfig: AgentTrainingConfig | null
  onSubmit: (config: AgentTrainingConfig) => void
}

export function AgentTrainDialog({ open, onOpenChange, trainingConfig, onSubmit }: AgentTrainDialogProps) {
  if (!open || !trainingConfig) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-6 py-10">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Plan training job</p>
            <p className="text-xs text-slate-500">Review the data sync plan, evaluation thresholds, and connector scopes.</p>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} className="text-xs text-slate-400 transition hover:text-slate-600">
            Close
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto px-6 py-6 text-sm text-slate-600">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Job details</p>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">{trainingConfig.jobName}</p>
              <p className="text-xs text-slate-500">{trainingConfig.objective}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
                <span className="rounded-full bg-white px-2 py-1">Embedding: {trainingConfig.embeddingModel}</span>
                {trainingConfig.retriever ? (
                  <span className="rounded-full bg-white px-2 py-1">Retriever: {trainingConfig.retriever.toUpperCase()}</span>
                ) : null}
                <span className="rounded-full bg-white px-2 py-1">Schedule: {trainingConfig.schedule}</span>
                <span className="rounded-full bg-white px-2 py-1">Chunking: {trainingConfig.chunkingStrategy}</span>
                {trainingConfig.chunkSize ? (
                  <span className="rounded-full bg-white px-2 py-1">Chunk size: {trainingConfig.chunkSize}</span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Connectors</p>
            <div className="grid gap-3 md:grid-cols-2">
              {trainingConfig.connectors.map((connector) => (
                <div key={connector.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{connector.name}</p>
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">{connector.type}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        connector.status === "ready"
                          ? "bg-emerald-100 text-emerald-700"
                          : connector.status === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {connector.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Scope: {connector.scope}</p>
                </div>
              ))}
            </div>
          </div>

          {trainingConfig.evaluationPlan ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Evaluation plan</p>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">Success threshold: {trainingConfig.evaluationPlan.successThreshold * 100}%</p>
                <p className="mt-1 text-xs text-slate-500">{trainingConfig.evaluationPlan.rubric}</p>
                {trainingConfig.evaluationPlan.reviewers?.length ? (
                  <div className="mt-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Reviewers</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                      {trainingConfig.evaluationPlan.reviewers.map((reviewer) => (
                        <span key={reviewer} className="rounded-full bg-white px-2 py-1">
                          {reviewer}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-brand hover:text-brand"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSubmit(trainingConfig)}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            Launch training job
          </button>
        </div>
      </div>
    </div>
  )
}
