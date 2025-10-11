"use client"

import Link from "next/link"
import { useState } from "react"

import { useAuth } from "../../../components/providers/auth-provider"

const demoTenants = [
  { label: "Global Retail", email: "retail-demo@agentprovision.com", password: "SecurePass!23" },
  { label: "Healthcare Ops", email: "health-demo@agentprovision.com", password: "CareOps!42" },
]

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState("retail-demo@agentprovision.com")
  const [password, setPassword] = useState("SecurePass!23")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await login(email, password)
    } catch (err) {
      setError((err as Error).message || "Unable to sign in")
    } finally {
      setSubmitting(false)
    }
  }

  const applyDemo = (tenantEmail: string, tenantPassword: string) => {
    setEmail(tenantEmail)
    setPassword(tenantPassword)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
        <p className="text-sm text-slate-500">Sign in to orchestrate your agents across every environment.</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/40" />
            Remember me
          </label>
          <Link href="/forgot-password" className="font-medium text-brand hover:text-brand-dark">
            Forgot password?
          </Link>
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-brand/30 transition hover:bg-brand-dark disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? "Signing in…" : "Sign in with credentials"}
        </button>
      </form>
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        <p className="font-semibold text-slate-900">Need demo access?</p>
        <p>Use one of the sandbox tenants highlighted on the landing page.</p>
        <div className="grid gap-2">
          {demoTenants.map((tenant) => (
            <button
              type="button"
              key={tenant.email}
              onClick={() => applyDemo(tenant.email, tenant.password)}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-brand"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{tenant.label}</p>
                <p className="text-[11px] text-slate-500">{tenant.email}</p>
              </div>
              <span className="text-[11px] text-slate-500">{tenant.password}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="text-center text-sm text-slate-500">
        New to AgentProvision?{" "}
        <Link href="/register" className="font-medium text-brand hover:text-brand-dark">
          Create an enterprise workspace
        </Link>
      </p>
    </div>
  )
}
