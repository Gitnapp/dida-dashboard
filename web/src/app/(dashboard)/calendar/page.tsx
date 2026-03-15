"use client"

import { useMemo, useState } from "react"

import { DatePanel } from "@/components/calendar/date-panel"
import { MonthGrid } from "@/components/calendar/month-grid"
import { WeekView } from "@/components/calendar/week-view"
import { ErrorState } from "@/components/shared/states"
import { Skeleton } from "@/components/ui/skeleton"
import { useAllProjectsData, useProjects } from "@/lib/hooks"
import { useTaskActions } from "@/lib/task-actions"
import { buildProjectNameMap, collectAllTasks } from "@/lib/task-utils"
import type { Task } from "@/lib/types"
import { cn } from "@/lib/utils"

function CalendarLoadingState() {
  const weekRows = Array.from({ length: 6 })

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex items-center gap-1 border-b border-border px-6 py-2">
        <Skeleton className="h-8 w-16 rounded-md" />
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <Skeleton className="h-7 w-36" />
          <div className="flex items-center gap-1">
            <Skeleton className="size-8 rounded-md" />
            <Skeleton className="size-8 rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-border text-xs text-muted-foreground">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={`weekday-${index}`} className="px-3 py-2 text-center">
              <Skeleton className="mx-auto h-3 w-10" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {weekRows.flatMap((_, rowIndex) =>
            Array.from({ length: 7 }).map((_, columnIndex) => {
              const cellIndex = rowIndex * 7 + columnIndex

              return (
                <div key={`day-${cellIndex}`} className="min-h-28 border-b border-r border-border px-2 py-2">
                  <Skeleton className="h-4 w-5" />
                  <div className="mt-2 space-y-1.5">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                    {rowIndex < 4 ? <Skeleton className="h-3 w-2/3" /> : null}
                  </div>
                </div>
              )
            }),
          )}
        </div>
      </div>
    </div>
  )
}

export default function CalendarPage() {
  const [view, setView] = useState<"month" | "week">("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: projects, error: projectsError, isLoading: projectsLoading } = useProjects()
  const { data: projectsData, error: dataError, isLoading: dataLoading } = useAllProjectsData(projects)
  const { completeTask, createTask, deleteTask } = useTaskActions()
  const allTasks = useMemo(() => collectAllTasks(projectsData), [projectsData])
  const projectNames = useMemo(() => buildProjectNameMap(projects), [projects])

  if (projectsError || dataError) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <ErrorState description={(projectsError ?? dataError)?.message ?? "Unable to load calendar."} />
      </div>
    )
  }

  if (projectsLoading || dataLoading) {
    return <CalendarLoadingState />
  }

  async function handleComplete(task: Task) {
    setActionError(null)
    try {
      await completeTask(task)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to complete task.")
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {actionError ? (
        <div className="border-b border-destructive/30 bg-destructive/10 px-6 py-2.5 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      {/* View toggle */}
      <div className="flex items-center gap-4 border-b border-border px-6 py-2.5">
        <button
          className={cn(
            "relative py-1 text-sm transition-colors",
            view === "month" ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setView("month")}
          type="button"
        >
          Month
          {view === "month" ? (
            <span className="absolute -bottom-[11px] left-0 right-0 h-px bg-foreground" />
          ) : null}
        </button>
        <button
          className={cn(
            "relative py-1 text-sm transition-colors",
            view === "week" ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setView("week")}
          type="button"
        >
          Week
          {view === "week" ? (
            <span className="absolute -bottom-[11px] left-0 right-0 h-px bg-foreground" />
          ) : null}
        </button>
      </div>

      {/* Grid */}
      <div className="min-h-0 flex-1 overflow-y-auto">
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
      </div>

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
