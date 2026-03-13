import type { ReactNode } from "react"

import { Navbar } from "@/components/layout/navbar"

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
