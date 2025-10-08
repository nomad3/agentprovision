import type { ReactNode } from "react"
import Link from "next/link"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-6 py-12">
      <Link href="/" className="mb-10 inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">AP</span>
        AgentProvision
      </Link>
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
        {children}
      </div>
      <p className="mt-8 text-xs text-slate-500">
        Demo credentials available inside the landing page sandbox. Need full access?
        <a href="mailto:hello@agentprovision.com" className="ml-2 font-medium text-brand hover:text-brand-dark">
          Contact sales
        </a>
      </p>
    </div>
  )
}
