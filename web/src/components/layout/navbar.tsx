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
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6">
      <span className="font-display text-lg">Dida</span>

      <nav className="flex items-center gap-6">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative py-1 text-sm transition-colors",
              isActive(pathname, item.href)
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
            {isActive(pathname, item.href) ? (
              <span className="absolute -bottom-[19px] left-0 right-0 h-px bg-foreground" />
            ) : null}
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
