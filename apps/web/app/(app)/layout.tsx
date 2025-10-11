import type { ReactNode } from "react"

import { ProtectedShell } from "../../components/layout/protected-shell"
import { Sidebar } from "../../components/layout/sidebar"
import { TopNav } from "../../components/layout/top-nav"

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedShell>
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopNav />
          <main className="flex-1 overflow-y-auto bg-slate-50 px-8 py-6">{children}</main>
        </div>
      </div>
    </ProtectedShell>
  )
}
