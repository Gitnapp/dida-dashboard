"use client"

import Link from "next/link"
import { ArrowUpRightIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { buildProjectStats } from "@/lib/task-utils"
import type { ProjectData } from "@/lib/types"

interface ProjectSummaryProps {
  projectsData?: Map<string, ProjectData>
}

export function ProjectSummary({ projectsData }: ProjectSummaryProps) {
  const items = projectsData ? Array.from(projectsData.values()) : []

  return (
    <Card className="surface">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
          Project summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Projects will appear here after sync.</p>
        ) : (
          items.map((item) => {
            const stats = buildProjectStats(item)

            return (
              <Link
                key={item.project.id}
                className="block rounded-2xl border border-border/70 bg-background/75 px-4 py-3 transition-colors hover:bg-accent/60"
                href={`/projects/${item.project.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{item.project.name}</p>
                      <ArrowUpRightIcon className="size-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats.completed}/{stats.total} completed · {stats.active} active
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">{stats.percent}%</p>
                </div>
                <Progress className="mt-3 h-2" value={stats.percent} />
              </Link>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
