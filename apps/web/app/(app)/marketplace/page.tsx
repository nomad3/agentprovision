import Link from "next/link"
import { ArrowUpRight, LayoutTemplate, ShieldCheck } from "lucide-react"

const templates = [
  {
    name: "Customer Care CoPilot",
    description: "Resolve support tickets across channels with guardrails and escalation paths.",
    tags: ["Support", "Customer Experience"],
  },
  {
    name: "Revenue Insights Analyst",
    description: "Surface revenue opportunities with CRM enrichment and finance approvals.",
    tags: ["Sales", "Analytics"],
  },
  {
    name: "Operations Command Center",
    description: "Coordinate incident response with automated playbooks and compliance logging.",
    tags: ["Ops", "Compliance"],
  },
]

export default function MarketplacePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Marketplace</h1>
          <p className="mt-2 text-sm text-slate-500">
            Launch a workspace in minutes with best-practice templates for common business scenarios.
          </p>
        </div>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-brand hover:text-brand"
        >
          Request custom template
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {templates.map((template) => (
          <div key={template.name} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-slate-700">
              <LayoutTemplate className="h-4 w-4 text-brand" />
              <h2 className="text-base font-semibold text-slate-900">{template.name}</h2>
            </div>
            <p className="mt-3 text-sm text-slate-500">{template.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {template.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
        <div className="flex items-center gap-2 text-slate-800">
          <ShieldCheck className="h-4 w-4 text-brand" />
          Need a bespoke workflow?
        </div>
        <p className="mt-2">
          Our solutions team will help you adapt evaluation frameworks, guardrails, and deployment policies for your regulated use cases.
        </p>
        <a href="mailto:solutions@agentprovision.com" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-dark">
          solutions@agentprovision.com
          <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>
    </div>
  )
}
