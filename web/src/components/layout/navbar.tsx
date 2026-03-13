"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Projects" },
  { href: "/calendar", label: "Calendar" },
]

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === href
  }

  return pathname.startsWith(href)
}

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
      <span className="text-sm font-medium tracking-wide">Dida</span>

      <nav className="flex items-center gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              isActive(pathname, item.href)
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <form action="/api/auth/logout" method="post">
        <Button className="h-7 text-xs" size="sm" type="submit" variant="ghost">
          Log out
        </Button>
      </form>
    </header>
  )
}
