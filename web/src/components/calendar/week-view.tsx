"use client"

import { addWeeks, format, isToday, subWeeks } from "date-fns"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getAllTasksForDay, getWeekDays } from "@/lib/task-utils"
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
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="text-2xl">Week of {format(currentDate, "MMM d")}</h2>
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
          const allTasks = getAllTasksForDay(tasks, day)

          return (
            <button
              key={day.toISOString()}
              className="min-h-[calc(100vh-12rem)] px-3 py-3 text-left transition-colors hover:bg-accent/20"
              onClick={() => onDateSelect(day)}
              type="button"
            >
              <p className="text-xs text-muted-foreground">{format(day, "EEE")}</p>
              <span
                className={cn(
                  "font-display inline-flex size-10 items-center justify-center rounded-full text-2xl",
                  isToday(day) && "bg-foreground font-bold text-background",
                )}
              >
                {format(day, "d")}
              </span>

              <div className="mt-3 space-y-1.5">
                {allTasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "rounded-md border px-2.5 py-1.5 text-sm",
                      task.status === 2
                        ? "border-border/50 bg-card/50"
                        : "border-border bg-card",
                    )}
                  >
                    <p
                      className={cn(
                        "line-clamp-2 leading-snug",
                        task.status === 2 && "text-muted-foreground/50 line-through",
                      )}
                    >
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
