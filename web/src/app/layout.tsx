import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Dida Dashboard",
  description: "A black-and-white Dida365 control surface for tasks and time.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
