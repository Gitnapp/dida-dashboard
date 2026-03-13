"use client"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { formatTaskDate, formatTaskDateTime } from "@/lib/date"
import { formatPriority } from "@/lib/task-utils"
import type { Task } from "@/lib/types"

interface TaskDetailSheetProps {
  onClose: () => void
  onComplete: (task: Task) => void | Promise<void>
  projectName?: string
  task: Task | null
}

export function TaskDetailSheet({
  task,
  projectName,
  onClose,
  onComplete,
}: TaskDetailSheetProps) {
  return (
    <Sheet open={Boolean(task)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{task?.title ?? "Task details"}</SheetTitle>
          <SheetDescription>
            {projectName ?? "Unknown project"} · {task ? formatPriority(task.priority) : "No priority"}
          </SheetDescription>
        </SheetHeader>

        {task ? (
          <div className="space-y-6 px-4 pb-6">
            <dl className="grid grid-cols-1 gap-4 rounded-[1.4rem] border border-border/70 bg-card/70 p-4 text-sm">
              <div className="space-y-1">
                <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Due</dt>
                <dd>{task.dueDate ? formatTaskDate(task.dueDate, "PPP") : "No due date"}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Completed</dt>
                <dd>{task.completedTime ? formatTaskDateTime(task.completedTime) : "Not completed"}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Notes</dt>
                <dd className="text-muted-foreground">{task.content || "No additional notes."}</dd>
              </div>
            </dl>

            {task.status === 0 ? (
              <Button className="w-full" onClick={() => onComplete(task)}>
                Complete task
              </Button>
            ) : null}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
