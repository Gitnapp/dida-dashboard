"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { formatTaskDate, formatTaskDateTime } from "@/lib/date"
import { formatPriority, getPriorityTone } from "@/lib/task-utils"
import type { Task } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TaskItemProps {
  task: Task
  projectName?: string
  showProject?: boolean
  showDueDate?: boolean
  showCompletedTime?: boolean
  statusLabel?: string
  compact?: boolean
  onComplete?: (task: Task) => void | Promise<void>
}

export function TaskItem({
  task,
  projectName,
  showProject = false,
  showDueDate = true,
  showCompletedTime = false,
  statusLabel,
  compact = false,
  onComplete,
}: TaskItemProps) {
  const isCompleted = task.status === 2
  const priority = formatPriority(task.priority)
  const showBadge = task.priority > 0

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border border-border/70 bg-background/75 px-2.5 py-2",
        compact && "rounded-lg px-2 py-1.5",
      )}
    >
      <div className="pt-0.5">
        {onComplete && !isCompleted ? (
          <Checkbox defaultChecked={false} onCheckedChange={() => onComplete(task)} />
        ) : (
          <div
            className={cn(
              "mt-1 size-2 rounded-full bg-muted-foreground/30",
              isCompleted && "bg-[var(--success)]",
              !isCompleted && task.priority === 5 && "bg-destructive",
            )}
          />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <p
          className={cn(
            "line-clamp-1 text-sm leading-5",
            isCompleted && "text-muted-foreground line-through",
            compact && "text-[13px]",
          )}
        >
          {task.title}
        </p>

        {task.content ? (
          <p className="line-clamp-1 break-all text-xs leading-4 text-muted-foreground">{task.content}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-2 text-xs leading-4 text-muted-foreground">
          {showProject && projectName ? <span>{projectName}</span> : null}
          {showDueDate && task.dueDate ? <span>Due {formatTaskDate(task.dueDate)}</span> : null}
          {showCompletedTime && task.completedTime ? (
            <span>Done {formatTaskDateTime(task.completedTime)}</span>
          ) : null}
          {statusLabel ? (
            <span
              className={cn(
                "font-medium",
                statusLabel === "已完成" && "text-muted-foreground/60",
                statusLabel.startsWith("逾期") && "text-destructive",
                statusLabel === "今天到期" && "text-orange-400",
              )}
            >
              {statusLabel}
            </span>
          ) : null}
        </div>
      </div>

      {showBadge ? (
        <Badge className="rounded-full" variant={getPriorityTone(task.priority)}>
          {priority}
        </Badge>
      ) : null}
    </div>
  )
}
