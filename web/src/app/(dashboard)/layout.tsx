import type { ReactNode } from "react"

import { Navbar } from "@/components/layout/navbar"

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </>
  )
}
