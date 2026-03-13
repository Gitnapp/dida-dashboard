"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/calendar", label: "Calendar" },
  { href: "/todos", label: "Todos" },
  { href: "/kanban", label: "Kanban" },
  { href: "/completed", label: "Completed" },
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
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full border border-foreground/15 bg-foreground text-background">
                D
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Dida365
                </p>
                <h1 className="text-2xl leading-none">Quiet control over work.</h1>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground">
              A restrained dashboard for lists, due dates, and momentum.
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <nav className="overflow-x-auto">
              <div className="flex min-w-max items-center gap-2 rounded-full border border-border/70 bg-card/75 p-1.5">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm transition-colors",
                      isActive(pathname, item.href)
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>

            <form action="/api/auth/logout" method="post">
              <Button size="sm" type="submit" variant="outline">
                Log out
              </Button>
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}
