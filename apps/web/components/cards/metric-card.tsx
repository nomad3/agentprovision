import { ArrowDownRight, ArrowUpRight } from "lucide-react"

import type { AgentMetric } from "@/lib/types"

export function MetricCard({ metric }: { metric: AgentMetric }) {
  const isPositive = metric.trend === "up"
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-slate-500">{metric.label}</div>
      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl font-semibold text-slate-900">{metric.value}</span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
            isPositive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          }`}
        >
          <TrendIcon className="h-3 w-3" />
          {Math.abs(metric.change)}%
        </span>
      </div>
    </div>
  )
}
