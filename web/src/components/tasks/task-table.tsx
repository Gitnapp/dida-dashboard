"use client"

import { PencilIcon, Trash2Icon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatTaskDate, formatTaskDateTime } from "@/lib/date"
import { formatPriority, getPriorityTone } from "@/lib/task-utils"
import type { Task } from "@/lib/types"

interface TaskTableProps {
  hideProject?: boolean
  onComplete: (task: Task) => void | Promise<void>
  onDelete?: (task: Task) => void | Promise<void>
  onEdit?: (task: Task) => void
  projectNames: Map<string, string>
  tasks: Task[]
}

export function TaskTable({
  tasks,
  projectNames,
  onComplete,
  onDelete,
  onEdit,
  hideProject = false,
}: TaskTableProps) {
  const colCount = (hideProject ? 5 : 6) + (onEdit || onDelete ? 1 : 0)

  return (
    <div className="surface overflow-hidden rounded-[1.6rem] border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Done</TableHead>
            <TableHead>Task</TableHead>
            {!hideProject ? <TableHead>Project</TableHead> : null}
            <TableHead>Priority</TableHead>
            <TableHead>Due</TableHead>
            <TableHead>Completed</TableHead>
            {onEdit || onDelete ? <TableHead className="w-20" /> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell className="py-8 text-center text-muted-foreground" colSpan={colCount}>
                No tasks match the current filters.
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => (
              <TableRow key={task.id} className="group/row">
                <TableCell>
                  {task.status === 0 ? (
                    <Checkbox defaultChecked={false} onCheckedChange={() => onComplete(task)} />
                  ) : (
                    <span className="text-xs text-muted-foreground">Done</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="max-w-lg space-y-1">
                    <p className="line-clamp-2 text-sm">{task.title}</p>
                    {task.content ? (
                      <p className="line-clamp-2 break-all text-xs text-muted-foreground">{task.content}</p>
                    ) : null}
                  </div>
                </TableCell>
                {!hideProject ? <TableCell>{projectNames.get(task.projectId) ?? "Unknown"}</TableCell> : null}
                <TableCell>
                  <Badge variant={getPriorityTone(task.priority)}>{formatPriority(task.priority)}</Badge>
                </TableCell>
                <TableCell>{task.dueDate ? formatTaskDate(task.dueDate) : "No date"}</TableCell>
                <TableCell>
                  {task.completedTime ? formatTaskDateTime(task.completedTime) : "—"}
                </TableCell>
                {onEdit || onDelete ? (
                  <TableCell>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/row:opacity-100">
                      {onEdit ? (
                        <Button
                          className="size-7"
                          onClick={() => onEdit(task)}
                          size="icon"
                          variant="ghost"
                        >
                          <PencilIcon className="size-3.5" />
                        </Button>
                      ) : null}
                      {onDelete ? (
                        <Button
                          className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => onDelete(task)}
                          size="icon"
                          variant="ghost"
                        >
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
