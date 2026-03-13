"use client"

import { subDays } from "date-fns"
import { useState } from "react"
import type { DateRange } from "react-day-picker"

import { CompletedList } from "@/components/completed/completed-list"
import { DateRangeFilter } from "@/components/completed/date-range-filter"
import { EmptyState, ErrorState, PageLoadingState } from "@/components/shared/states"
import { useAllProjectsData, useProjects } from "@/lib/hooks"
import { buildProjectNameMap, collectAllTasks, getCompletedTasks, isWithinCompletedRange } from "@/lib/task-utils"

export default function CompletedPage() {
  const [range, setRange] = useState<DateRange | undefined>(() => ({
    from: subDays(new Date(), 29),
    to: new Date(),
  }))
  const { data: projects, error: projectsError, isLoading: projectsLoading } = useProjects()
  const { data: projectsData, error: dataError, isLoading: dataLoading } = useAllProjectsData(projects)

  if (projectsError || dataError) {
    return <ErrorState description={(projectsError ?? dataError)?.message ?? "Unable to load history."} />
  }

  if (projectsLoading || dataLoading) {
    return <PageLoadingState />
  }

  if (!projects?.length) {
    return (
      <EmptyState
        description="Completed tasks require Dida365 project data. No projects were returned."
        title="No project data"
      />
    )
  }

  const allTasks = collectAllTasks(projectsData)
  const completedTasks = getCompletedTasks(allTasks).filter((task) =>
    isWithinCompletedRange(task, range?.from, range?.to),
  )
  const projectNames = buildProjectNameMap(projects)

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Completed</p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-5xl leading-[0.92]">Trace what actually shipped.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Filter completions by date range and review work grouped by the day it closed.
            </p>
          </div>
        </div>
      </section>

      <DateRangeFilter onChange={setRange} value={range} />
      <CompletedList projectNames={projectNames} tasks={completedTasks} />
    </div>
  )
}
