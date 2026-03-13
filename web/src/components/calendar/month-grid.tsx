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
    <div>
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h2 className="text-lg font-medium">{format(currentDate, "MMMM yyyy")}</h2>
        <div className="flex items-center gap-1">
          <Button
            aria-label="Previous month"
            onClick={() => onMonthChange(subMonths(currentDate, 1))}
            size="icon"
            variant="ghost"
            className="size-8"
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button
            aria-label="Next month"
            onClick={() => onMonthChange(addMonths(currentDate, 1))}
            size="icon"
            variant="ghost"
            className="size-8"
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-border text-xs text-muted-foreground">
        {weekdays.map((day) => (
          <div key={day} className="px-3 py-2 text-center">
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
                "min-h-28 border-b border-r border-border px-2 py-2 text-left transition-colors hover:bg-accent/30",
                !isSameMonth(day, currentDate) && "text-muted-foreground/40",
                isSelected && "bg-accent",
              )}
              onClick={() => onDateSelect(day)}
              type="button"
            >
              <span
                className={cn(
                  "text-sm",
                  isToday(day) && "font-bold text-foreground",
                )}
              >
                {format(day, "d")}
              </span>

              <div className="mt-1 space-y-0.5">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="truncate rounded px-1.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 3 ? (
                  <p className="px-1.5 text-xs text-muted-foreground/60">
                    +{dayTasks.length - 3}
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
