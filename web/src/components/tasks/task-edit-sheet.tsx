"use client"

import { useEffect, useState } from "react"
import { Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { getProjectSelectOptions } from "@/lib/task-utils"
import type { Project, Task, TaskUpdate } from "@/lib/types"

interface TaskEditSheetProps {
  onClose: () => void
  onDelete: (task: Task) => Promise<void>
  onUpdate: (taskId: string, payload: TaskUpdate) => Promise<void>
  projectNames: Map<string, string>
  projects?: Project[]
  task: Task | null
}

const priorityOptions = [
  { value: "0", label: "None" },
  { value: "1", label: "Low" },
  { value: "3", label: "Medium" },
  { value: "5", label: "High" },
]

export function TaskEditSheet({
  task,
  projects,
  projectNames,
  onClose,
  onUpdate,
  onDelete,
}: TaskEditSheetProps) {
  const projectOptions = getProjectSelectOptions(projects)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [projectId, setProjectId] = useState("")
  const [priority, setPriority] = useState("0")
  const [dueDate, setDueDate] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setContent(task.content ?? "")
      setProjectId(task.projectId)
      setPriority(String(task.priority))
      setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "")
      setError(null)
    }
  }, [task])

  async function handleSave() {
    if (!task || !title.trim()) return

    setError(null)
    setIsSaving(true)

    try {
      await onUpdate(task.id, {
        projectId,
        title: title.trim(),
        content: content.trim() || undefined,
        priority: Number(priority),
        dueDate: dueDate || null,
      })
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!task) return

    setError(null)
    setIsDeleting(true)

    try {
      await onDelete(task)
      onClose()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Sheet open={Boolean(task)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit task</SheetTitle>
          <SheetDescription>
            {task ? (projectNames.get(task.projectId) ?? "Unknown project") : ""}
          </SheetDescription>
        </SheetHeader>

        {task ? (
          <div className="space-y-4 px-4 pb-6">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Title</label>
              <Input
                onChange={(e) => setTitle(e.target.value)}
                value={title}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Notes</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(e) => setContent(e.target.value)}
                value={content}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest text-muted-foreground">Project</label>
                <Select
                  items={projectOptions.map((p) => ({ value: p.id, label: p.name }))}
                  onValueChange={(v) => setProjectId(v ?? "")}
                  value={projectId}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projectOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest text-muted-foreground">Priority</label>
                <Select
                  items={priorityOptions}
                  onValueChange={(v) => setPriority(v ?? "0")}
                  value={priority}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Due date</label>
              <Input
                onChange={(e) => setDueDate(e.target.value)}
                type="date"
                value={dueDate}
              />
            </div>

            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}

            <div className="flex items-center gap-2 pt-2">
              <Button className="flex-1" disabled={isSaving || !title.trim()} onClick={handleSave}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button
                disabled={isDeleting}
                onClick={handleDelete}
                size="icon"
                variant="outline"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
