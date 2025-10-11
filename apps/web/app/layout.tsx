import type { Metadata } from "next"
import { Inter } from "next/font/google"
import type { ReactNode } from "react"
import "./globals.css"

import { AuthProvider } from "../components/providers/auth-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AgentProvision | Operate AI Agents with Confidence",
  description: "Deploy, orchestrate, and monitor AI agents with enterprise-grade controls designed for business leaders and platform teams.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-slate-50 text-slate-900 antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
