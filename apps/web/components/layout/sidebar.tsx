"use client"

import { Bot, Database, LayoutDashboard, LifeBuoy, PlugZap, Settings, ShoppingBag, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { useAuth } from "../providers/auth-provider"

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Agents", href: "/agents", icon: Bot },
  { label: "Deployments", href: "/deployments", icon: Database },
  { label: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { label: "Integrations", href: "/integrations", icon: PlugZap },
  { label: "Teams", href: "/teams", icon: Users },
  { label: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white px-6 py-8 lg:flex lg:flex-col lg:justify-between">
      <div className="space-y-8">
        <div className="space-y-2">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white">AP</span>
            AgentProvision
          </Link>
          {user ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
              <p className="text-sm font-semibold text-slate-900">{user.tenant_name}</p>
              <p className="font-mono text-[11px] text-slate-400">{user.tenant_slug}</p>
            </div>
          ) : null}
        </div>
        <nav className="space-y-1">
          {navItems.map(({ icon: Icon, label, href }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand/10 text-brand-dark"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <div className="flex items-center gap-2 text-slate-800">
          <LifeBuoy className="h-4 w-4" />
          Need help?
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Email <a href="mailto:support@agentprovision.com" className="font-medium text-brand">support@agentprovision.com</a> or open a ticket from the console.
        </p>
      </div>
    </aside>
  )
}
