"use client"

import { Bell, LogOut, Search } from "lucide-react"

import { useAuth } from "@/components/providers/auth-provider"

export function TopNav() {
  const { user, logout } = useAuth()
  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("")
    : "AP"

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950 px-6">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-brand focus:outline-none"
          placeholder="Search agents, deployments, teams"
        />
      </div>
      <div className="flex items-center gap-6">
        <button className="relative rounded-full border border-slate-800 bg-slate-900 p-2 text-slate-300 hover:text-white" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1 top-1 inline-flex h-2 w-2 rounded-full bg-brand" />
        </button>
        <div className="flex items-center gap-3 text-xs">
          <div className="text-right">
            <div className="font-medium text-white">{user?.full_name ?? user?.email ?? "Workspace Admin"}</div>
            <div className="text-slate-500">{user?.tenant_name ?? "AgentProvision"}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-sm font-semibold text-white">
              {initials}
            </div>
            <button
              onClick={logout}
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-brand hover:text-white"
            >
              <LogOut className="mr-1 inline h-3 w-3" /> Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
