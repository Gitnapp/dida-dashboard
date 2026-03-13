"use client"

import { addWeeks, format, isToday, subWeeks } from "date-fns"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getCompletedTasksForDay, getTasksForDay, getWeekDays } from "@/lib/task-utils"
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
    <div>
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h2 className="text-lg font-medium">Week of {format(currentDate, "MMM d")}</h2>
        <div className="flex items-center gap-1">
          <Button
            aria-label="Previous week"
            onClick={() => onWeekChange(subWeeks(currentDate, 1))}
            size="icon"
            variant="ghost"
            className="size-8"
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button
            aria-label="Next week"
            onClick={() => onWeekChange(addWeeks(currentDate, 1))}
            size="icon"
            variant="ghost"
            className="size-8"
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 divide-x divide-border">
        {weekDays.map((day) => {
          const tasksForDay = getTasksForDay(tasks, day)
          const completedForDay = getCompletedTasksForDay(tasks, day)

          return (
            <button
              key={day.toISOString()}
              className="min-h-[calc(100vh-12rem)] px-3 py-3 text-left transition-colors hover:bg-accent/20"
              onClick={() => onDateSelect(day)}
              type="button"
            >
              <p className="text-xs text-muted-foreground">{format(day, "EEE")}</p>
              <p className={cn("text-2xl", isToday(day) && "font-bold")}>
                {format(day, "d")}
              </p>

              <div className="mt-3 space-y-1.5">
                {tasksForDay.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-md border border-border bg-card px-2.5 py-1.5 text-sm"
                  >
                    <p className="line-clamp-2 leading-snug">{task.title}</p>
                  </div>
                ))}
                {completedForDay.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-md border border-border/50 bg-card/50 px-2.5 py-1.5 text-sm"
                  >
                    <p className="line-clamp-2 leading-snug text-muted-foreground/50 line-through">
                      {task.title}
                    </p>
                  </div>
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
