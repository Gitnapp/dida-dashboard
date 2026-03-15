"use client"

import { format } from "date-fns"
import { useState } from "react"
import { Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { TaskItem } from "@/components/tasks/task-item"
import { getAllTasksForDay, getDueDateStatus, getProjectSelectOptions } from "@/lib/task-utils"
import type { Project, Task } from "@/lib/types"

interface DatePanelProps {
  date: Date | null
  onClose: () => void
  onComplete: (task: Task) => void | Promise<void>
  onCreate: (payload: { title: string; projectId: string; dueDate: string }) => Promise<unknown>
  onDelete: (task: Task) => Promise<void>
  projectNames: Map<string, string>
  projects?: Project[]
  tasks: Task[]
}

export function DatePanel({
  date,
  tasks,
  projectNames,
  projects,
  onClose,
  onComplete,
  onCreate,
  onDelete,
}: DatePanelProps) {
  const allTasksForDay = date ? getAllTasksForDay(tasks, date) : []
  const projectOptions = getProjectSelectOptions(projects)
  const [title, setTitle] = useState("")
  const [projectId, setProjectId] = useState(projects?.[0]?.id ?? "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(event: { preventDefault: () => void }) {
    event.preventDefault()

    if (!title.trim() || !projectId || !date) return

    setError(null)
    setIsSubmitting(true)

    try {
      await onCreate({
        title: title.trim(),
        projectId,
        dueDate: format(date, "yyyy-MM-dd'T'HH:mm:ssxxx"),
      })
      setTitle("")
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create task.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(task: Task) {
    setError(null)
    setDeletingId(task.id)

    try {
      await onDelete(task)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete task.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Sheet open={Boolean(date)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">{date ? format(date, "EEEE, MMMM d") : "No date selected"}</SheetTitle>
          <SheetDescription>
            {allTasksForDay.length} task{allTasksForDay.length !== 1 ? "s" : ""} on this date.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="px-4 pb-4">
          <form className="mb-4 flex gap-2" onSubmit={handleCreate}>
            <Input
              className="flex-1"
              onChange={(event) => setTitle(event.target.value)}
              placeholder="New task title"
              value={title}
            />
            <Select
              items={projectOptions.map((p) => ({ value: p.id, label: p.name }))}
              onValueChange={(v) => setProjectId(v ?? "")}
              value={projectId}
            >
              <SelectTrigger className="w-32 shrink-0">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                {projectOptions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button disabled={isSubmitting || !title.trim()} size="sm" type="submit">
              {isSubmitting ? "..." : "Add"}
            </Button>
          </form>

          {error ? (
            <p className="mb-3 text-sm text-destructive">{error}</p>
          ) : null}

          <div className="space-y-2">
            {allTasksForDay.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks on this date.</p>
            ) : (
              allTasksForDay.map((task) => (
                <div key={task.id} className="group/task relative">
                  <TaskItem
                    onComplete={task.status !== 2 ? onComplete : undefined}
                    projectName={projectNames.get(task.projectId)}
                    showProject
                    statusLabel={getDueDateStatus(task) ?? undefined}
                    task={task}
                  />
                  {task.status !== 2 ? (
                    <button
                      className="absolute right-2 top-2 rounded-md p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover/task:opacity-100 disabled:opacity-50"
                      disabled={deletingId === task.id}
                      onClick={() => handleDelete(task)}
                      type="button"
                    >
                      <Trash2Icon className="size-3.5" />
                    </button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
