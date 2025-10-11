"use client"

import { useRouter } from "next/navigation"
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

import { apiRequest } from "@/lib/api-client"

type User = {
  id: string
  email: string
  full_name?: string | null
  tenant_id: string
  tenant_name: string
  tenant_slug: string
}

type AuthContextValue = {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: {
    email: string
    password: string
    full_name?: string
    tenant_name: string
  }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const STORAGE_KEY = "agentprovision-token"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const persistToken = useCallback((value: string | null) => {
    if (typeof window === "undefined") return
    if (value) {
      window.localStorage.setItem(STORAGE_KEY, value)
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const fetchProfile = useCallback(async (activeToken: string) => {
    try {
      const data = await apiRequest<User>("/api/v1/users/me", { token: activeToken })
      setUser(data)
    } catch (error) {
      console.error("Failed to load profile", error)
      setUser(null)
      setToken(null)
      persistToken(null)
    }
  }, [persistToken])

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setToken(stored)
      fetchProfile(stored).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [fetchProfile])

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiRequest<{ access_token: string }>("/api/v1/auth/login", {
        method: "POST",
        body: { email, password },
      })
      setToken(data.access_token)
      persistToken(data.access_token)
      await fetchProfile(data.access_token)
      router.push("/dashboard")
    },
    [fetchProfile, persistToken, router],
  )

  const register = useCallback(
    async (payload: { email: string; password: string; full_name?: string; tenant_name: string }) => {
      const data = await apiRequest<{ access_token: string }>("/api/v1/auth/register", {
        method: "POST",
        body: payload,
      })
      setToken(data.access_token)
      persistToken(data.access_token)
      await fetchProfile(data.access_token)
      router.push("/dashboard")
    },
    [fetchProfile, persistToken, router],
  )

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    persistToken(null)
    router.push("/login")
  }, [persistToken, router])

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
