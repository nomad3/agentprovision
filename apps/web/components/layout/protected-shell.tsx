"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { useAuth } from "../providers/auth-provider"

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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        <p>Checking credentials…</p>
      </div>
    )
  }

  if (!token) {
    return null
  }

  return <>{children}</>
}
