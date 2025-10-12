"use client"

import Link from "next/link"
import { useState } from "react"

import { useAuth } from "../../../components/providers/auth-provider"

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
        <h1 className="text-2xl font-semibold text-slate-900">Create your enterprise workspace</h1>
        <p className="text-sm text-slate-500">
          Set up a secure sandbox with pre-populated demo data, connectors, and guardrails.
        </p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label="First name" name="firstName" value={form.firstName} onChange={handleChange} placeholder="Jordan" required />
          <InputField label="Last name" name="lastName" value={form.lastName} onChange={handleChange} placeholder="Rivera" required />
        </div>
        <InputField
          label="Work email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@company.com"
          required
        />
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label="Company" name="company" value={form.company} onChange={handleChange} placeholder="Acme Corp" required />
          <div className="space-y-2">
            <label htmlFor="region" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Preferred region
            </label>
            <select
              id="region"
              name="region"
              value={form.region}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            >
              {cloudRegions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
        </div>
        <InputField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="At least 12 characters"
          required
        />
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
          <p className="font-semibold text-slate-900">Included in your trial:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Pre-configured demo tenants for retail, healthcare, and finance use cases</li>
            <li>Starter LangChain and LangGraph blueprints with evaluation suites</li>
            <li>Observability stack (Prometheus, Grafana, OpenTelemetry) with sample traces</li>
            <li>Cost guardrails, budget policies, and synthetic traffic generators</li>
          </ul>
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-brand/30 transition hover:bg-brand-dark disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? "Provisioning…" : "Provision sandbox workspace"}
        </button>
      </form>
      <p className="text-center text-sm text-slate-500">
        Already have access?{" "}
        <Link href="/login" className="font-medium text-brand hover:text-brand-dark">
          Sign in
        </Link>
      </p>
    </div>
  )
}

function InputField({ label, name, type = "text", value, onChange, placeholder, required }: {
  label: string
  name: string
  type?: string
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
      />
    </div>
  )
}
