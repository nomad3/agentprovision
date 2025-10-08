"use client"

import { useAuth } from "@/components/providers/auth-provider"

export default function SettingsPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Platform settings</h1>
        <p className="mt-2 text-sm text-slate-400">
          Configure compliance, observability exports, and cloud accounts across your organization here.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold text-white">Workspace identity</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
              <span>Tenant name</span>
              <span className="font-medium text-white">{user?.tenant_name ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
              <span>Tenant slug</span>
              <span className="font-mono text-xs text-slate-400">{user?.tenant_slug ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Primary admin</span>
              <span className="font-medium text-white">{user?.email ?? "—"}</span>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold text-white">Regional controls</h2>
          <p className="mt-3 text-sm text-slate-300">
            Regional deployment guardrails, data residency policies, and SOC2 evidence exports are
            available in the paid tier. Contact our team to unlock production controls.
          </p>
        </div>
      </div>
    </div>
  )
}
