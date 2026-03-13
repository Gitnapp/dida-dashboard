"use client"

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getTasksForDay } from "@/lib/task-utils"
import type { Task } from "@/lib/types"
import { cn } from "@/lib/utils"

interface MonthGridProps {
  currentDate: Date
  onDateSelect: (date: Date) => void
  onMonthChange: (date: Date) => void
  selectedDate: Date | null
  tasks: Task[]
}

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function MonthGrid({
  currentDate,
  tasks,
  selectedDate,
  onDateSelect,
  onMonthChange,
}: MonthGridProps) {
  const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
  const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start, end })

  return (
    <div className="surface overflow-hidden rounded-[1.75rem] border">
      <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
            Month view
          </p>
          <h2 className="text-3xl leading-none">{format(currentDate, "MMMM yyyy")}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            aria-label="Previous month"
            onClick={() => onMonthChange(subMonths(currentDate, 1))}
            size="icon-sm"
            variant="outline"
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            aria-label="Next month"
            onClick={() => onMonthChange(addMonths(currentDate, 1))}
            size="icon-sm"
            variant="outline"
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-border/70 bg-muted/50 px-3 py-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
        {weekdays.map((day) => (
          <div key={day} className="px-2 py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayTasks = getTasksForDay(tasks, day)
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false

          return (
            <button
              key={day.toISOString()}
              className={cn(
                "min-h-32 border-b border-r border-border/70 px-3 py-3 text-left transition-colors hover:bg-accent/50",
                !isSameMonth(day, currentDate) && "bg-muted/30 text-muted-foreground",
                isSelected && "bg-foreground text-background hover:bg-foreground/95",
              )}
              onClick={() => onDateSelect(day)}
              type="button"
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-sm font-medium",
                    isToday(day) && !isSelected && "underline decoration-foreground/50 decoration-2 underline-offset-4",
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayTasks.length ? (
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px]",
                      isSelected
                        ? "border-background/30 text-background/80"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {dayTasks.length}
                  </span>
                ) : null}
              </div>

              <div className="mt-3 space-y-1.5">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "line-clamp-1 rounded-full border px-2 py-1 text-xs",
                      isSelected
                        ? "border-background/20 bg-background/8 text-background"
                        : "border-border/70 bg-background/65",
                    )}
                  >
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 3 ? (
                  <p className={cn("text-xs", isSelected ? "text-background/75" : "text-muted-foreground")}>
                    +{dayTasks.length - 3} more
                  </p>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
