import Link from "next/link"
import { ArrowUpRight, Users } from "lucide-react"

const roles = [
  { name: "Executive", description: "View performance, spend, and compliance dashboards." },
  { name: "Operator", description: "Manage agents, review evaluations, and respond to incidents." },
  { name: "Developer", description: "Deploy templates, integrate APIs, and monitor logs." },
]

export default function TeamsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Teams & access</h1>
          <p className="mt-2 text-sm text-slate-500">
            Align roles with responsibilities so leaders, operators, and developers stay in sync.
          </p>
        </div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-brand hover:text-brand"
        >
          Configure SSO
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {roles.map((role) => (
          <div key={role.name} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-slate-700">
              <Users className="h-4 w-4 text-brand" />
              <h2 className="text-base font-semibold text-slate-900">{role.name}</h2>
            </div>
            <p className="mt-3 text-sm text-slate-500">{role.description}</p>
          </div>
        ))}
      </div>
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
        <p className="font-semibold text-slate-800">Tip</p>
        <p className="mt-2">
          Map these roles directly to your identity provider groups so provisioning and off-boarding stay automated.
        </p>
      </div>
    </div>
  )
}
