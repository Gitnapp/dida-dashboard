"use client"

import { formatTaskDate } from "@/lib/date"
import { formatPriority, getPriorityTone } from "@/lib/task-utils"
import type { Task } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

interface TaskCardProps {
  onSelect: (task: Task) => void
  task: Task
}

export function TaskCard({ task, onSelect }: TaskCardProps) {
  return (
    <button
      className="w-full rounded-xl border border-border/70 bg-background px-2.5 py-2 text-left transition-colors hover:bg-accent/50"
      onClick={() => onSelect(task)}
      type="button"
    >
      <div className="space-y-1.5">
        <div className="space-y-0.5">
          <p className="line-clamp-2 text-sm leading-5">{task.title}</p>
          {task.content ? (
            <p className="line-clamp-1 break-all text-xs leading-4 text-muted-foreground">{task.content}</p>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-2">
          <Badge variant={getPriorityTone(task.priority)}>{formatPriority(task.priority)}</Badge>
          <span className="text-xs text-muted-foreground">
            {task.dueDate ? formatTaskDate(task.dueDate) : "No date"}
          </span>
        </div>
      </div>
    </button>
  )
}
