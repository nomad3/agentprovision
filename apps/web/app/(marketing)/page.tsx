import Link from "next/link"
import { Activity, ArrowRight, CheckCircle2, GitBranch, Globe2, PlayCircle, ShieldCheck } from "lucide-react"

import {
  complianceBadges,
  heroStats,
  integrationCategories,
  platformFeatures,
  testimonials,
  workflowStages,
} from "@/lib/mock-data"

const featureIcons = {
  ShieldCheck,
  Globe2,
  Activity,
  GitBranch,
}

type FeatureIconKey = keyof typeof featureIcons

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-1/2 h-[28rem] w-[28rem] rounded-full bg-emerald-500/10 blur-3xl" />

      <header className="relative z-10 border-b border-white/5 bg-slate-950/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-base font-bold">AP</span>
            AgentProvision
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#features" className="transition hover:text-white">
              Platform
            </a>
            <a href="#workflow" className="transition hover:text-white">
              Workflow
            </a>
            <a href="#integrations" className="transition hover:text-white">
              Integrations
            </a>
            <a href="#trust" className="transition hover:text-white">
              Trust &amp; Compliance
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-brand hover:text-white md:inline-flex"
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
            <span className="inline-flex items-center gap-2 rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-light">
              Enterprise AI Agent Platform
            </span>
            <h1 className="text-4xl font-semibold text-white md:text-6xl">
              Operate production-grade AI agents with security, observability, and control.
            </h1>
            <p className="text-lg text-slate-300">
              AgentProvision unifies multi-tenant governance, cross-cloud deployments, and real-time FinOps so your teams can design, ship, and trust autonomous agents at scale.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-brand/40 transition hover:bg-brand-dark"
              >
                Start free enterprise trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-brand hover:text-white"
              >
                Access live console
              </Link>
              <a
                href="#demo"
                className="inline-flex items-center gap-2 rounded-xl border border-transparent px-5 py-3 text-sm font-semibold text-slate-200 transition hover:text-white"
              >
                <PlayCircle className="h-5 w-5 text-brand-light" />
                Watch 3-minute tour
              </a>
            </div>
          </div>
          <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-6 shadow-2xl shadow-slate-950/40">
            <div className="grid gap-4">
              {heroStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/5 bg-slate-900/70 px-5 py-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">{stat.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-3 text-sm text-slate-400">
              <p className="font-semibold text-slate-200">Pre-loaded demo tenants include:</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-light" /> Global retail automation suite
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-light" /> SOC2-ready customer care copilots
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-light" /> FinOps dashboard with spend guardrails
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section id="features" className="space-y-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-white">Built for mission-critical programs</h2>
              <p className="mt-2 max-w-2xl text-slate-300">
                Every AgentProvision module is designed to accelerate regulated enterprise teams while preserving security, observability, and cost control.
              </p>
            </div>
            <Link href="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-light hover:text-brand">
              Explore the console blueprints
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {platformFeatures.map((feature) => {
              const Icon = featureIcons[feature.icon as FeatureIconKey]
              return (
                <div
                  key={feature.title}
                  className="group flex h-full flex-col rounded-3xl border border-white/5 bg-slate-900/60 p-6 shadow-xl shadow-slate-950/30 transition hover:border-brand/40 hover:shadow-brand/20"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/15 text-brand">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                  </div>
                  <p className="mt-4 text-sm text-slate-300">{feature.description}</p>
                  <ul className="mt-6 space-y-3 text-sm text-slate-300">
                    {feature.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-light" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>

        <section id="workflow" className="space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-white">From idea to production in hours, not quarters</h2>
              <p className="mt-2 max-w-2xl text-slate-300">
                Guided playbooks take you from blueprint to observable deployments with demo pipelines for marketing, support, and DevOps teams.
              </p>
            </div>
            <a href="#demo" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-light hover:text-brand">
              View interactive journey
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {workflowStages.map((stage, index) => (
              <div key={stage.title} className="relative flex flex-col rounded-3xl border border-white/5 bg-slate-900/60 p-6">
                <span className="absolute -top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-bold">
                  {index + 1}
                </span>
                <h3 className="mt-2 text-lg font-semibold text-white">{stage.title}</h3>
                <p className="mt-3 text-sm text-slate-300">{stage.description}</p>
                <p className="mt-auto pt-6 text-xs font-semibold uppercase tracking-wide text-brand-light">{stage.kpi}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="integrations" className="space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-white">Connect to the stack you already trust</h2>
              <p className="mt-2 max-w-2xl text-slate-300">
                AgentProvision ships with pre-built connectors and demo data sources so teams can experiment safely without touching production systems.
              </p>
            </div>
            <Link href="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-light hover:text-brand">
              Browse the integration marketplace
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-6">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {integrationCategories.map((integration) => (
                <div
                  key={integration.name}
                  className="flex flex-col gap-1 rounded-2xl border border-white/5 bg-slate-900/70 px-4 py-3 text-sm text-slate-200"
                >
                  <span className="font-semibold text-white">{integration.name}</span>
                  <span className="text-xs uppercase tracking-wide text-slate-500">{integration.type}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="trust" className="grid gap-10 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="rounded-3xl border border-brand/20 bg-brand/10 p-8 text-brand-foreground">
            <h2 className="text-3xl font-semibold text-white">Compliance from day zero</h2>
            <p className="mt-3 text-sm text-slate-200">
              Centralize identity, audit trails, and data governance with pre-configured policies for regulated industries. Demo tenants include SOC2 evidence packages and GDPR data flow maps ready for stakeholders.
            </p>
            <ul className="mt-6 grid gap-3">
              {complianceBadges.map((badge) => (
                <li key={badge} className="flex items-center gap-2 text-sm text-slate-100">
                  <ShieldCheck className="h-4 w-4 text-brand-light" />
                  {badge}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-6 rounded-3xl border border-white/5 bg-slate-900/60 p-8">
            <h3 className="text-lg font-semibold text-white">Leaders shipping responsibly</h3>
            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map((testimonial) => (
                <div key={testimonial.name} className="rounded-2xl border border-white/5 bg-slate-900/70 p-5 text-sm text-slate-300">
                  <p className="text-slate-200">“{testimonial.quote}”</p>
                  <div className="mt-4 text-xs uppercase tracking-wide text-slate-500">
                    <span className="font-semibold text-slate-200">{testimonial.name}</span>
                    <br />
                    {testimonial.role}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="demo" className="rounded-3xl border border-white/5 bg-slate-900/60 p-10 text-center">
          <h2 className="text-3xl font-semibold text-white">Ready to orchestrate your AI fleet?</h2>
          <p className="mt-3 text-slate-300">
            Spin up a dedicated sandbox with pre-built marketing, support, and DevOps agents. Invite teammates, explore guardrails, and deploy to a managed Kubernetes cluster in minutes.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-brand/40 transition hover:bg-brand-dark"
            >
              Create enterprise trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-brand hover:text-white"
            >
              Sign in with SSO
            </Link>
            <a
              href="mailto:hello@agentprovision.com"
              className="inline-flex items-center gap-2 rounded-xl border border-transparent px-5 py-3 text-sm font-semibold text-slate-200 transition hover:text-white"
            >
              Talk to sales
            </a>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/5 bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} AgentProvision Inc. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/policies/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/policies/security" className="hover:text-white">
              Security
            </Link>
            <Link href="/register" className="hover:text-white">
              Request SOC2 report
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
