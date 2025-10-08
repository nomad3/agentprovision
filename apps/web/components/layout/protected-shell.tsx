"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/providers/auth-provider"

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !token) {
      router.replace("/login")
    }
  }, [loading, token, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <p>Checking credentials…</p>
      </div>
    )
  }

  if (!token) {
    return null
  }

  return <>{children}</>
}
