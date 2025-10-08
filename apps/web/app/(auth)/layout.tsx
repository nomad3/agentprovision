import type { ReactNode } from "react"
import Link from "next/link"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-6 py-12">
      <Link href="/" className="mb-10 inline-flex items-center gap-2 text-lg font-semibold text-white">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-sm font-bold">AP</span>
        AgentProvision
      </Link>
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-slate-950/50">
        {children}
      </div>
      <p className="mt-8 text-xs text-slate-500">
        Demo credentials available inside the landing page sandbox. Need full access?
        <a href="mailto:hello@agentprovision.com" className="ml-2 text-brand-light hover:text-brand">
          Contact sales
        </a>
      </p>
    </div>
  )
}
