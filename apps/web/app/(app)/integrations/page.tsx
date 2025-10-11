import { ArrowUpRight, BookOpen, PlugZap } from "lucide-react"
import Link from "next/link"

import { integrationConnectors, integrationGuides } from "../../../lib/marketing-content"

export default function IntegrationsPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            Integrations Hub
          </div>
          <h1 className="text-3xl font-semibold text-slate-900">Connect AgentProvision to your automation stack</h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Discover managed connectors for MCP servers and low-code workflows. Harden approvals, stream telemetry, and let agents orchestrate across n8n, ServiceNow, Salesforce, Vertex AI, and more.
          </p>
        </div>
        <Link
          href="https://docs.agentprovision.com/integrations"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-brand hover:text-brand"
        >
          View integration docs
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </header>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Featured connectors</h2>
            <p className="mt-1 text-sm text-slate-500">Managed Connector Platform (MCP) servers and n8n integrations curated for enterprise workflows.</p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {integrationConnectors.map((connector) => (
            <div key={connector.name} className="relative flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">{connector.vendor}</p>
                  <h3 className="text-lg font-semibold text-slate-900">{connector.name}</h3>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    connector.status === "GA"
                      ? "bg-emerald-100 text-emerald-700"
                      : connector.status === "Beta"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {connector.status}
                </span>
              </div>
              <p className="text-sm text-slate-600">{connector.summary}</p>
              <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                {connector.protocols.map((protocol) => (
                  <span key={protocol} className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                    {protocol}
                  </span>
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Capabilities</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-600">
                    {connector.capabilities.map((capability) => (
                      <li key={capability}>{capability}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Categories</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                    {connector.categories.map((category) => (
                      <span key={category} className="rounded-full border border-slate-200 px-3 py-1">
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <Link
                href={connector.docsUrl}
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-dark"
                target="_blank"
                rel="noreferrer"
              >
                Explore setup guide
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            n8n automation blueprint
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">Run n8n alongside AgentProvision</h2>
          <p className="text-sm text-slate-600">
            Ship a fully managed n8n instance in the same stack as your agents. Sync credentials through AgentProvision secrets, trigger flows with guardrail context, and stream execution results back into analytics.
          </p>
          <ul className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
            <li className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Provisioning</p>
              <p className="mt-2 font-semibold text-slate-900">Dedicated container with persistent volume, exposed via Traefik or API gateway.</p>
            </li>
            <li className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Security</p>
              <p className="mt-2 font-semibold text-slate-900">SSO and RBAC mirrored from AgentProvision tenants using JWT session tokens.</p>
            </li>
            <li className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Observability</p>
              <p className="mt-2 font-semibold text-slate-900">Telemetry bridged to OpenTelemetry exporters for unified dashboards.</p>
            </li>
            <li className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Runtime syncing</p>
              <p className="mt-2 font-semibold text-slate-900">Webhook triggers posted to AgentProvision analytics for replay and governance.</p>
            </li>
          </ul>
        </div>
        <div className="flex h-full flex-col justify-between rounded-3xl border border-brand/20 bg-brand/10 p-6 text-slate-900">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand">
              <PlugZap className="h-4 w-4" />
              Quick actions
            </div>
            <p className="text-sm text-slate-700">
              Launch n8n directly from your tenant environment or import curated playbooks maintained by the AgentProvision community.
            </p>
          </div>
          <div className="space-y-3 text-sm">
            <Link
              href="https://github.com/agentprovision/integrations/tree/main/n8n"
              className="inline-flex items-center justify-between rounded-2xl bg-white px-4 py-3 font-semibold text-brand shadow-sm transition hover:text-brand-dark"
            >
              Deploy n8n module
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="https://community.agentprovision.com/t/n8n-blueprints"
              className="inline-flex items-center justify-between rounded-2xl border border-white/40 px-4 py-3 font-semibold text-slate-700 transition hover:border-brand hover:text-brand"
            >
              Explore community flows
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-slate-800">
          <BookOpen className="h-4 w-4 text-brand" />
          <h2 className="text-xl font-semibold text-slate-900">Implementation guides</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {integrationGuides.map((guide) => (
            <Link
              key={guide.title}
              href={guide.href}
              className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 text-left text-sm text-slate-600 transition hover:border-brand hover:text-slate-800"
              target="_blank"
              rel="noreferrer"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide">
                  <span className="text-brand">{guide.status}</span>
                  {guide.eta ? <span className="text-slate-400">ETA {guide.eta}</span> : null}
                </div>
                <h3 className="text-base font-semibold text-slate-900">{guide.title}</h3>
                <p>{guide.description}</p>
              </div>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand">
                Read guide
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
