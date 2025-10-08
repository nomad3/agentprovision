"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bot, Database, LayoutDashboard, Settings, ShoppingBag, Users } from "lucide-react"

import { useAuth } from "@/components/providers/auth-provider"

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Agents", href: "/agents", icon: Bot },
  { label: "Deployments", href: "/deployments", icon: Database },
  { label: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { label: "Teams", href: "/teams", icon: Users },
  { label: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-950 p-6 lg:block">
      <div className="mb-8 space-y-2">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold">AP</span>
          AgentProvision
        </Link>
        {user ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-400">
            <p className="font-semibold text-white">{user.tenant_name}</p>
            <p className="font-mono text-[10px] text-slate-500">{user.tenant_slug}</p>
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
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-brand/10 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
