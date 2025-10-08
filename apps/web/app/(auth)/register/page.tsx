"use client"

import { useState } from "react"
import Link from "next/link"

import { useAuth } from "@/components/providers/auth-provider"

const cloudRegions = ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"]

export default function RegisterPage() {
  const { register } = useAuth()
  const [form, setForm] = useState({
    firstName: "Jordan",
    lastName: "Rivera",
    email: "new-admin@agentprovision.com",
    company: "Innovation Labs",
    region: cloudRegions[0],
    password: "ChangeMe123!",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await register({
        email: form.email,
        password: form.password,
        tenant_name: form.company,
        full_name: `${form.firstName} ${form.lastName}`.trim(),
      })
    } catch (err) {
      setError((err as Error).message || "Unable to create workspace")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-white">Create your enterprise workspace</h1>
        <p className="text-sm text-slate-400">
          Set up a secure sandbox with pre-populated demo data, connectors, and guardrails.
        </p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="firstName" className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              First name
            </label>
            <input
              id="firstName"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand focus:outline-none"
              placeholder="Jordan"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="lastName" className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Last name
            </label>
            <input
              id="lastName"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand focus:outline-none"
              placeholder="Rivera"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Work email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand focus:outline-none"
            placeholder="you@company.com"
            required
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="company" className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Company
            </label>
            <input
              id="company"
              name="company"
              value={form.company}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand focus:outline-none"
              placeholder="Acme Corp"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="region" className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Preferred region
            </label>
            <select
              id="region"
              name="region"
              value={form.region}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-brand focus:outline-none"
            >
              {cloudRegions.map((region) => (
                <option key={region} value={region} className="bg-slate-950">
                  {region}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand focus:outline-none"
            placeholder="At least 12 characters"
            required
          />
        </div>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <div className="rounded-2xl border border-white/5 bg-slate-900/70 p-4 text-xs text-slate-300">
          <p className="font-semibold text-slate-200">Included in your trial:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Pre-configured demo tenants for retail, healthcare, and finance use cases</li>
            <li>Starter LangChain and LangGraph blueprints with evaluation suites</li>
            <li>Observability stack (Prometheus, Grafana, OpenTelemetry) with sample traces</li>
            <li>Cost guardrails, budget policies, and synthetic traffic generators</li>
          </ul>
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? "Provisioning…" : "Provision sandbox workspace"}
        </button>
      </form>
      <p className="text-center text-sm text-slate-400">
        Already have access?{" "}
        <Link href="/login" className="text-brand-light hover:text-brand">
          Sign in
        </Link>
      </p>
    </div>
  )
}
