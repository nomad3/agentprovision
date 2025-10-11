"use client"

import { useAuth } from "../../components/providers/auth-provider"

const rows = [
  { label: "Data residency", value: "US, EU" },
  { label: "Audit logging", value: "Enabled" },
  { label: "SSO provider", value: "Azure AD" },
]

export default function SettingsPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Workspace settings</h1>
        <p className="mt-2 text-sm text-slate-500">
          Review key configuration details and request updates from the AgentProvision team.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Workspace identity</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <SettingRow label="Tenant name" value={user?.tenant_name ?? "—"} />
            <SettingRow label="Tenant slug" value={user?.tenant_slug ?? "—"} mono />
            <SettingRow label="Primary admin" value={user?.email ?? "—"} />
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Compliance & infrastructure</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {rows.map((row) => (
              <SettingRow key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
        <p className="font-semibold text-slate-800">Need to update policies or integrations?</p>
        <p className="mt-2">
          Contact your account team at <a href="mailto:success@agentprovision.com" className="font-medium text-brand">success@agentprovision.com</a> and we’ll guide you through the rollout checklist.
        </p>
      </div>
    </div>
  )
}

function SettingRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-b-0">
      <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
      <span className={`text-sm font-medium text-slate-800 ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  )
}
