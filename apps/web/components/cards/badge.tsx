import type { ReactNode } from "react"

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-700/80 bg-slate-900/70 px-2 py-1 text-xs text-slate-300">
      {children}
    </span>
  )
}
