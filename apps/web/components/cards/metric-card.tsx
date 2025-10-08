import { ArrowDownRight, ArrowUpRight } from "lucide-react"

import type { AgentMetric } from "@/lib/mock-data"

export function MetricCard({ metric }: { metric: AgentMetric }) {
  const isPositive = metric.trend === "up"
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-md shadow-slate-950/30">
      <div className="text-xs uppercase tracking-wide text-slate-500">{metric.label}</div>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-2xl font-semibold text-white">{metric.value}</span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
            isPositive ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"
          }`}
        >
          <TrendIcon className="h-3 w-3" />
          {Math.abs(metric.change)}%
        </span>
      </div>
    </div>
  )
}
