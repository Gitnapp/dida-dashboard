import Link from "next/link"
import { AlertTriangleIcon, InboxIcon, LoaderCircleIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type StateAction = {
  href: string
  label: string
}

interface EmptyStateProps {
  title: string
  description: string
  action?: StateAction
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="surface">
      <CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center">
        <div className="rounded-full border border-border bg-background p-3">
          <InboxIcon className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
        </div>
        {action ? (
          <Link className={buttonVariants({ variant: "outline" })} href={action.href}>
            {action.label}
          </Link>
        ) : null}
      </CardContent>
    </Card>
  )
}

interface ErrorStateProps {
  title?: string
  description: string
}

export function ErrorState({
  title = "Something went wrong",
  description,
}: ErrorStateProps) {
  return (
    <Card className="surface border-destructive/30">
      <CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center">
        <div className="rounded-full border border-destructive/30 bg-destructive/10 p-3 text-destructive">
          <AlertTriangleIcon className="size-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

interface LoadingCardProps {
  title?: string
  rows?: number
}

export function LoadingCard({ title = "Loading", rows = 4 }: LoadingCardProps) {
  return (
    <Card className="surface">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton
            key={`${title}-${index}`}
            className={cn("h-12 w-full rounded-xl", index === 0 && "w-4/5")}
          />
        ))}
      </CardContent>
    </Card>
  )
}

export function PageLoadingState() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <LoadingCard title="Dashboard" rows={4} />
      <LoadingCard title="Upcoming" rows={5} />
      <LoadingCard title="Projects" rows={4} />
    </div>
  )
}

export function InlinePending({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
      <LoaderCircleIcon className="size-3.5 animate-spin" />
      <span>{label}</span>
    </div>
  )
}
