"use client"

import { useState } from "react"

import { DatePanel } from "@/components/calendar/date-panel"
import { MonthGrid } from "@/components/calendar/month-grid"
import { WeekView } from "@/components/calendar/week-view"
import { ErrorState, PageLoadingState } from "@/components/shared/states"
import { Button } from "@/components/ui/button"
import { parseDidaDate } from "@/lib/date"
import { useAllProjectsData, useProjects } from "@/lib/hooks"
import { useTaskActions } from "@/lib/task-actions"
import { buildProjectNameMap, collectAllTasks } from "@/lib/task-utils"
import type { Task } from "@/lib/types"

export function CalendarPageClient({
  initialDateString,
}: {
  initialDateString?: string
}) {
  const initialDate = parseDidaDate(initialDateString)
  const [view, setView] = useState<"month" | "week">("month")
  const [currentDate, setCurrentDate] = useState(initialDate ?? new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: projects, error: projectsError, isLoading: projectsLoading } = useProjects()
  const { data: projectsData, error: dataError, isLoading: dataLoading } = useAllProjectsData(projects)
  const { completeTask, createTask, deleteTask } = useTaskActions()

  if (projectsError || dataError) {
    return <ErrorState description={(projectsError ?? dataError)?.message ?? "Unable to load the calendar."} />
  }

  if (projectsLoading || dataLoading) {
    return <PageLoadingState />
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
        <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Calendar</p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-5xl leading-[0.92]">See time as a grid, not a list.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Jump between the month surface and a tighter week pass. Click any date to inspect the underlying tasks.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setView("month")}
              type="button"
              variant={view === "month" ? "default" : "outline"}
            >
              Month
            </Button>
            <Button
              onClick={() => setView("week")}
              type="button"
              variant={view === "week" ? "default" : "outline"}
            >
              Week
            </Button>
          </div>
        </div>
      </section>

      {actionError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      {view === "month" ? (
        <MonthGrid
          currentDate={currentDate}
          onDateSelect={setSelectedDate}
          onMonthChange={setCurrentDate}
          selectedDate={selectedDate}
          tasks={allTasks}
        />
      ) : (
        <WeekView
          currentDate={currentDate}
          onDateSelect={setSelectedDate}
          onWeekChange={setCurrentDate}
          tasks={allTasks}
        />
      )}

      <DatePanel
        date={selectedDate}
        onClose={() => setSelectedDate(null)}
        onComplete={handleComplete}
        onCreate={createTask}
        onDelete={deleteTask}
        projectNames={projectNames}
        projects={projects}
        tasks={allTasks}
      />
    </div>
  )
}
