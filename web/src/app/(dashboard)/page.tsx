"use client"

import { useState } from "react"

import { CalendarMini } from "@/components/dashboard/calendar-mini"
import { OverdueTasks } from "@/components/dashboard/overdue-tasks"
import { ProjectSummary } from "@/components/dashboard/project-summary"
import { RecentCompletions } from "@/components/dashboard/recent-completions"
import { TodayTasks } from "@/components/dashboard/today-tasks"
import { UpcomingTasks } from "@/components/dashboard/upcoming-tasks"
import { ErrorState, PageLoadingState } from "@/components/shared/states"
import { useProjects, useAllProjectsData, useCompletedTasks } from "@/lib/hooks"
import { useTaskActions } from "@/lib/task-actions"
import {
  buildProjectNameMap,
  collectAllTasks,
  getOverdueTasks,
  getRecentCompletions,
  getTodayTasks,
  getUpcomingTasks,
} from "@/lib/task-utils"
import type { Task } from "@/lib/types"

export default function DashboardPage() {
  const { data: projects, error: projectsError, isLoading: projectsLoading } = useProjects()
  const { data: projectsData, error: dataError, isLoading: dataLoading } = useAllProjectsData(projects)
  const { completeTask } = useTaskActions()
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: completedTasks } = useCompletedTasks()

  if (projectsError || dataError) {
    return (
      <ErrorState description={(projectsError ?? dataError)?.message ?? "Unable to load the dashboard."} />
    )
  }

  if (projectsLoading || dataLoading) {
    return <PageLoadingState />
  }

  if (!projects?.length) {
    return (
      <ErrorState
        description="No Dida365 projects were returned. Create a list in Dida365, then refresh."
        title="No projects found"
      />
    )
  }

  const allTasks = collectAllTasks(projectsData)
  const projectNames = buildProjectNameMap(projects)

  async function handleComplete(task: Task) {
    setActionError(null)

    try {
      await completeTask(task)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to complete task.")
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Dashboard</p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-5xl leading-[0.92]">What needs your attention now.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Today, overdue work, near-term commitments, project completion, and recent wins in one view.
            </p>
          </div>
        </div>
      </section>

      {actionError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <TodayTasks onComplete={handleComplete} projectNames={projectNames} tasks={getTodayTasks(allTasks)} />
        <OverdueTasks onComplete={handleComplete} projectNames={projectNames} tasks={getOverdueTasks(allTasks)} />
        <div className="md:col-span-2 xl:col-span-1">
          <CalendarMini tasks={allTasks} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <UpcomingTasks className="xl:col-span-2" onComplete={handleComplete} projectNames={projectNames} tasks={getUpcomingTasks(allTasks)} />
        <ProjectSummary projectsData={projectsData} />
      </div>

      <RecentCompletions
        projectNames={projectNames}
        tasks={getRecentCompletions(completedTasks ?? [])}
      />
    </div>
  )
}
