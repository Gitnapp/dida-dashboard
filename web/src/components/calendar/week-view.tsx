"use client"

import { addWeeks, format, isToday, subWeeks } from "date-fns"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getTasksForDay, getWeekDays } from "@/lib/task-utils"
import type { Task } from "@/lib/types"
import { cn } from "@/lib/utils"

interface WeekViewProps {
  currentDate: Date
  onDateSelect: (date: Date) => void
  onWeekChange: (date: Date) => void
  tasks: Task[]
}

export function WeekView({
  currentDate,
  tasks,
  onDateSelect,
  onWeekChange,
}: WeekViewProps) {
  const weekDays = getWeekDays(currentDate)

  return (
    <div className="surface overflow-hidden rounded-[1.75rem] border">
      <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
            Week view
          </p>
          <h2 className="text-3xl leading-none">{format(currentDate, "'Week of' MMM d")}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            aria-label="Previous week"
            onClick={() => onWeekChange(subWeeks(currentDate, 1))}
            size="icon-sm"
            variant="outline"
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            aria-label="Next week"
            onClick={() => onWeekChange(addWeeks(currentDate, 1))}
            size="icon-sm"
            variant="outline"
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>

      <div className="grid gap-px bg-border/70 lg:grid-cols-7">
        {weekDays.map((day) => {
          const tasksForDay = getTasksForDay(tasks, day)

          return (
            <button
              key={day.toISOString()}
              className="min-h-72 bg-background px-4 py-4 text-left transition-colors hover:bg-accent/40"
              onClick={() => onDateSelect(day)}
              type="button"
            >
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  {format(day, "EEE")}
                </p>
                <p className={cn("text-3xl leading-none", isToday(day) && "underline underline-offset-8")}>
                  {format(day, "d")}
                </p>
              </div>

              <div className="mt-5 space-y-2">
                {tasksForDay.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nothing due.</p>
                ) : (
                  tasksForDay.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-2xl border border-border/70 bg-card px-3 py-2 text-sm"
                    >
                      <p className="line-clamp-2 leading-5">{task.title}</p>
                    </div>
                  ))
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
