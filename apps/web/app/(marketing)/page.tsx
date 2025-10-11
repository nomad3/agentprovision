import {
    Activity,
    ArrowRight,
    BarChart3,
    Building2,
    CheckCircle2,
    GitBranch,
    Globe2,
    PlayCircle,
    ShieldCheck,
} from "lucide-react"
import Link from "next/link"

import { platformFeatures, testimonials, workflowStages } from "@/lib/marketing-content"
import type { Feature, FeatureIcon, PublicMetrics } from "@/lib/types"

const featureIcons: Record<Feature["icon"], typeof Activity> = {
  ShieldCheck,
  Globe2,
  Activity,
  GitBranch,
}

const complianceBadges = ["SOC2 Type II", "GDPR Ready", "HIPAA Toolkit", "ISO 27001 Roadmap"]

const faqs = [
  {
    question: "How does the sandbox trial work?",
    answer:
      "Every trial provisions an isolated tenant with demo agents, deployments, and guardrails so you can explore the console without touching production systems.",
  },
  {
    question: "Can we connect our own cloud accounts?",
    answer:
      "Yes. Terraform modules and GitHub Actions templates ship with the platform, enabling secure connections to AWS, Azure, or GCP in minutes.",
  },
  {
    question: "What observability tooling is supported?",
    answer:
      "AgentProvision emits OpenTelemetry signals and integrates with Prometheus, Grafana, and popular log pipelines out of the box.",
  },
  {
    question: "How is compliance enforced?",
    answer:
      "Role-based access control, policy guardrails, and audit evidence exports are built in, making SOC2 and GDPR reviews straightforward.",
  },
]

const formatNumber = (value: number): string => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`
  }
  return value.toString()
}

async function fetchPublicMetrics(): Promise<PublicMetrics | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
  try {
    const response = await fetch(`${baseUrl}/api/v1/analytics/public/metrics`, {
      cache: "no-store",
      next: { revalidate: 60 },
    })
    if (!response.ok) {
      console.warn("Public metrics request failed", response.status, await response.text())
      return null
    }

    const data = await response.json()

    if (!data || typeof data !== "object") {
      console.warn("Public metrics payload malformed", data)
      return null
    }
    return {
      tenantCount: data.tenant_count,
      agentCount: data.agent_count,
      deploymentCount: data.deployment_count,
      activeAgentCount: data.active_agent_count,
      environmentCount: data.environment_count,
      highlightTenants: (data.highlight_tenants ?? []).map((tenant: any) => ({
        id: tenant.id,
        name: tenant.name,
        agentCount: tenant.agent_count,
        deploymentCount: tenant.deployment_count,
        environments: tenant.environments ?? [],
      })),
      integrationCatalog: data.integration_catalog ?? [],
      generatedAt: data.generated_at,
    }
  } catch (error) {
    console.warn("Failed to load public metrics", error)
    return null
  }
}

export const dynamic = "force-dynamic"

export default async function LandingPage() {
  const metrics = await fetchPublicMetrics()

  const fallbackHeroStats = [
    { label: "Active tenants", value: "12" },
    { label: "Agents orchestrated", value: "42" },
    { label: "Production envs", value: "18" },
  ]

  const heroStats = metrics
    ? [
        { label: "Active tenants", value: formatNumber(metrics.tenantCount) },
        { label: "Agents orchestrated", value: formatNumber(metrics.agentCount) },
        { label: "Production envs", value: formatNumber(metrics.environmentCount) },
      ]
    : fallbackHeroStats

  const highlightTenants = metrics?.highlightTenants?.length
    ? metrics.highlightTenants
    : [
        {
          id: "retail",
          name: "Global Retail Sandbox",
          agentCount: 8,
          deploymentCount: 15,
          environments: ["prod", "dr"],
        },
        {
          id: "health",
          name: "Healthcare Ops Control",
          agentCount: 6,
          deploymentCount: 9,
          environments: ["prod"],
        },
      ]

  const integrationCatalog = metrics?.integrationCatalog?.length
    ? metrics.integrationCatalog
    : [
        "ServiceNow",
        "Salesforce",
        "Datadog",
        "AWS Bedrock",
        "Azure OpenAI",
        "Atlassian",
        "PagerDuty",
        "Snowflake",
      ]

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-1/2 h-[28rem] w-[28rem] rounded-full bg-emerald-200/40 blur-3xl" />

      <header className="relative z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-base font-bold text-white">AP</span>
            AgentProvision
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
            <a href="#features" className="transition hover:text-slate-900">
              Platform
            </a>
            <a href="#workflow" className="transition hover:text-slate-900">
              Workflow
            </a>
            <a href="#customers" className="transition hover:text-slate-900">
              Customers
            </a>
            <a href="#integrations" className="transition hover:text-slate-900">
              Integrations
            </a>
            <a href="#faq" className="transition hover:text-slate-900">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand hover:text-brand md:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark"
            >
              Launch a demo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-24 px-6 py-16">
        <section className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
              Enterprise AI Agent Platform
            </span>
            <h1 className="text-4xl font-semibold text-slate-900 md:text-6xl">
              Operate production-grade AI agents with security, observability, and control.
            </h1>
            <p className="text-lg text-slate-600">
              AgentProvision centralizes governance, deployment automation, and FinOps telemetry so product teams can build trustworthy agent ecosystems without reinventing platform tooling.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-brand/20 transition hover:bg-brand-dark"
              >
                Start free enterprise trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand"
              >
                Access live console
              </Link>
              <a
                href="#demo"
                className="inline-flex items-center gap-2 rounded-xl border border-transparent px-5 py-3 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
              >
                <PlayCircle className="h-5 w-5 text-brand" />
                Watch 3-minute tour
              </a>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
            <div className="grid gap-4">
              {heroStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-slate-900">
                  <Building2 className="h-4 w-4 text-brand" />
                  Industry sandboxes
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {highlightTenants.length
                    ? highlightTenants.map((tenant) => tenant.name).join(", ")
                    : "Retail and healthcare demos ready to explore."}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-slate-900">
                  <BarChart3 className="h-4 w-4 text-brand" />
                  Live telemetry
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  FinOps dashboards link spend to outcomes with OpenTelemetry, Grafana, and alert pipelines.
                </p>
              </div>
            </div>
          </div>
        </section>

        {highlightTenants.length ? (
          <section className="space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-semibold text-slate-900">Tenants shipping with AgentProvision</h2>
                <p className="mt-2 max-w-2xl text-slate-600">
                  Explore the seeded sandboxes or connect your own cloud accounts to see how AgentProvision manages multi-region fleets.
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {highlightTenants.map((tenant) => (
                <div key={tenant.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md shadow-slate-200/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{tenant.name}</h3>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Demo workspace</p>
                    </div>
                    <Badge>{tenant.agentCount} agents</Badge>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Deployments</p>
                      <p className="font-semibold text-slate-900">{tenant.deploymentCount}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Environments</p>
                      <p className="font-semibold text-slate-900">{tenant.environments.join(", ")}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section id="features" className="space-y-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-slate-900">Built for mission-critical programs</h2>
              <p className="mt-2 max-w-2xl text-slate-600">
                Every module is production hardened—covering governance, deployment automation, and telemetry—so you can scale safely without bespoke glue code.
              </p>
            </div>
            <Link href="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-dark">
              Explore the console blueprints
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {platformFeatures.map((feature) => {
              const Icon = featureIcons[feature.icon as FeatureIcon]
              return (
                <div
                  key={feature.title}
                  className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/40 transition hover:border-brand/40 hover:shadow-brand/20"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                  </div>
                  <p className="mt-4 text-sm text-slate-600">{feature.description}</p>
                  <ul className="mt-6 space-y-3 text-sm text-slate-600">
                    {feature.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>

        <section className="space-y-8 rounded-3xl border border-brand/20 bg-emerald-50/80 p-8" id="compliance">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-slate-900">Security and compliance baked in</h2>
              <p className="mt-2 max-w-2xl text-sm text-emerald-900/80">
                Policy guardrails, audit logging, and identity federation are part of the core runtime—no bolt-on extensions required.
              </p>
            </div>
            <Link href="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-dark">
              Review compliance blueprint
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {complianceBadges.map((badge) => (
              <span key={badge} className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                {badge}
              </span>
            ))}
          </div>
        </section>

        <section id="workflow" className="space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-slate-900">From idea to production in hours, not quarters</h2>
              <p className="mt-2 max-w-2xl text-slate-600">
                Guided playbooks take you from blueprint to observable deployments with guardrails that satisfy security, compliance, and finance stakeholders.
              </p>
            </div>
            <a href="#demo" className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-dark">
              View interactive journey
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {workflowStages.map((stage, index) => (
              <div key={stage.title} className="relative flex flex-col rounded-3xl border border-slate-200 bg-white p-6">
                <span className="absolute -top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{stage.title}</h3>
                <p className="mt-3 text-sm text-slate-600">{stage.description}</p>
                <p className="mt-auto pt-6 text-xs font-semibold uppercase tracking-wide text-brand">{stage.kpi}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="customers" className="space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-slate-900">Teams scaling responsibly</h2>
              <p className="mt-2 max-w-2xl text-slate-600">
                Product, security, and operations teams rely on AgentProvision to ship agents that stay compliant and reliable as usage grows.
              </p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-md shadow-slate-200/40">
                <p className="text-slate-800">“{testimonial.quote}”</p>
                <div className="mt-4 text-xs uppercase tracking-wide text-slate-500">
                  <span className="font-semibold text-slate-900">{testimonial.name}</span>
                  <br />
                  {testimonial.role}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="integrations" className="space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-slate-900">Connect to the stack you already trust</h2>
              <p className="mt-2 max-w-2xl text-slate-600">
                Built-in connectors keep data flowing between your LLM providers, operational systems, and observability pipelines.
              </p>
            </div>
            <Link href="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-dark">
              Browse the integration marketplace
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md shadow-slate-200/40">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {integrationCatalog.map((integration) => (
                <div
                  key={integration}
                  className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                >
                  <span className="font-semibold text-slate-900">{integration}</span>
                  <span className="text-xs uppercase tracking-wide text-slate-500">Certified connector</span>
                </div>
              ))}
              {!integrationCatalog.length ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Connectors load automatically once the API is online.
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section id="faq" className="space-y-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-slate-900">Questions from platform teams</h2>
              <p className="mt-2 max-w-2xl text-slate-600">
                Here’s how AgentProvision fits into established security, infrastructure, and operations practices.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                <h3 className="font-semibold text-slate-900">{faq.question}</h3>
                <p className="mt-2 text-slate-500">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="demo" className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl shadow-slate-200/40">
          <h2 className="text-3xl font-semibold text-slate-900">Ready to orchestrate your AI fleet?</h2>
          <p className="mt-3 text-slate-600">
            Spin up a dedicated sandbox with pre-built marketing, support, and DevOps agents. Invite teammates, explore guardrails, and deploy to a managed Kubernetes cluster in minutes.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-brand/20 transition hover:bg-brand-dark"
            >
              Create enterprise trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand"
            >
              Sign in with SSO
            </Link>
            <a
              href="mailto:hello@agentprovision.com"
              className="inline-flex items-center gap-2 rounded-xl border border-transparent px-5 py-3 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
            >
              Talk to sales
            </a>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-slate-200 bg-white/90">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p className="text-slate-500">© {new Date().getFullYear()} AgentProvision Inc. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/policies/privacy" className="hover:text-slate-900">
              Privacy
            </Link>
            <Link href="/policies/security" className="hover:text-slate-900">
              Security
            </Link>
            <Link href="/register" className="hover:text-slate-900">
              Request SOC2 report
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
      {children}
    </span>
  )
}
