"use client"

import { useState } from "react"
import { FolderPenIcon, FolderPlusIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { TaskEditSheet } from "@/components/tasks/task-edit-sheet"
import { ErrorState } from "@/components/shared/states"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { formatTaskDate } from "@/lib/date"
import { useProjectData, useProjects } from "@/lib/hooks"
import { useProjectActions } from "@/lib/project-actions"
import { useTaskActions } from "@/lib/task-actions"
import { buildProjectNameMap, getActiveTasks, getCompletedTasks, sortFilteredTasks } from "@/lib/task-utils"
import type { Task, TaskUpdate } from "@/lib/types"
import { cn } from "@/lib/utils"

function ProjectsLoadingState() {
  return (
    <div className="flex h-full min-h-0">
      <aside className="w-64 shrink-0 overflow-hidden border-r border-border">
        <div className="space-y-2 p-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={`project-nav-${index}`} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-6 py-6">
            <div className="mb-6 space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-28" />
            </div>

            <div className="mb-6 flex items-center gap-2">
              <Skeleton className="h-10 flex-1 rounded-md" />
              <Skeleton className="h-9 w-16 rounded-md" />
            </div>

            <div className="divide-y divide-border">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={`active-task-${index}`} className="flex items-center gap-3 px-1 py-3">
                  <Skeleton className="size-4 rounded-sm" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-full max-w-xl" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="size-2 rounded-full" />
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Skeleton className="mb-3 h-3 w-20" />
              <div className="divide-y divide-border/50">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={`completed-task-${index}`} className="flex items-center gap-3 px-1 py-2.5">
                    <div className="size-4 shrink-0" />
                    <Skeleton className="h-4 w-full max-w-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState("")
  const [newProjectName, setNewProjectName] = useState("")
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [editingProjectName, setEditingProjectName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const { data: projects, error: projectsError, isLoading: projectsLoading } = useProjects()
  const activeProjectId = selectedProjectId ?? projects?.[0]?.id ?? null
  const { data: projectData, error: projectError, isLoading: projectLoading } = useProjectData(activeProjectId)
  const {
    createProject,
    deleteProject,
    isPending: isProjectPending,
    renameProject,
  } = useProjectActions()
  const { completeTask, createTask, updateTask, deleteTask } = useTaskActions()

  if (projectsError || projectError) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <ErrorState description={(projectsError ?? projectError)?.message ?? "Unable to load."} />
      </div>
    )
  }

  if (projectsLoading) {
    return <ProjectsLoadingState />
  }

  const activeTasks = projectData ? sortFilteredTasks(getActiveTasks(projectData.tasks), "dueDate") : []
  const completedTasks = projectData ? getCompletedTasks(projectData.tasks).slice(0, 20) : []

  async function handleComplete(task: Task) {
    setActionError(null)
    try {
      await completeTask(task)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to complete task.")
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim() || !activeProjectId) return

    setIsCreating(true)
    setActionError(null)
    try {
      await createTask({ title: newTitle.trim(), projectId: activeProjectId })
      setNewTitle("")
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to create task.")
    } finally {
      setIsCreating(false)
    }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault()
    if (!newProjectName.trim()) return

    setActionError(null)

    try {
      const project = await createProject({ name: newProjectName.trim() })
      setNewProjectName("")
      setSelectedProjectId(project.id)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to create project.")
    }
  }

  async function handleRenameProject(projectId: string) {
    if (!editingProjectName.trim()) {
      setEditingProjectId(null)
      setEditingProjectName("")
      return
    }

    setActionError(null)

    try {
      await renameProject(projectId, editingProjectName.trim())
      setEditingProjectId(null)
      setEditingProjectName("")
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to rename project.")
    }
  }

  async function handleDeleteProject(projectId: string) {
    setActionError(null)

    try {
      await deleteProject(projectId)

      if (selectedProjectId === projectId) {
        setSelectedProjectId(null)
      }

      if (editingProjectId === projectId) {
        setEditingProjectId(null)
        setEditingProjectName("")
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to delete project.")
    }
  }

  async function handleUpdate(taskId: string, payload: TaskUpdate) {
    setActionError(null)
    try {
      await updateTask(taskId, payload)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to update task.")
    }
  }

  async function handleDelete(task: Task) {
    setActionError(null)
    try {
      await deleteTask(task)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to delete task.")
    }
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="grid-hairline w-72 shrink-0 overflow-y-auto border-r border-border">
        <div className="space-y-3 p-3">
          <form className="space-y-2 rounded-lg border border-border/80 bg-background/60 p-2.5" onSubmit={handleCreateProject}>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              <FolderPlusIcon className="size-3.5" />
              <span>New project</span>
            </div>
            <Input
              className="h-9"
              disabled={isProjectPending}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              value={newProjectName}
            />
            <Button className="w-full" disabled={isProjectPending || !newProjectName.trim()} size="sm" type="submit">
              {isProjectPending ? "Creating..." : "Add project"}
            </Button>
          </form>

          <div className="space-y-1">
            {projects?.map((project) => {
              const isSelected = project.id === activeProjectId
              const isEditing = project.id === editingProjectId
              const isInbox = project.id.startsWith("inbox")

              return (
                <div
                  key={project.id}
                  className={cn(
                    "group/project rounded-lg transition-colors",
                    isSelected
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
                  )}
                >
                  <div className="flex items-center gap-1 px-2 py-1.5">
                    {isEditing ? (
                      <form
                        className="flex min-w-0 flex-1 items-center gap-1"
                        onSubmit={(e) => {
                          e.preventDefault()
                          void handleRenameProject(project.id)
                        }}
                      >
                        <Input
                          autoFocus
                          className="h-8 flex-1 bg-background text-foreground"
                          disabled={isProjectPending}
                          onBlur={() => {
                            void handleRenameProject(project.id)
                          }}
                          onChange={(e) => setEditingProjectName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              setEditingProjectId(null)
                              setEditingProjectName("")
                            }
                          }}
                          value={editingProjectName}
                        />
                      </form>
                    ) : (
                      <button
                        className="flex min-w-0 flex-1 items-center rounded-md px-2 py-1 text-left text-sm"
                        onClick={() => setSelectedProjectId(project.id)}
                        type="button"
                      >
                        <span className="truncate">{project.name}</span>
                      </button>
                    )}

                    {!isInbox ? (
                      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/project:opacity-100">
                        <Button
                          disabled={isProjectPending}
                          onClick={() => {
                            setEditingProjectId(project.id)
                            setEditingProjectName(project.name)
                          }}
                          size="icon-xs"
                          type="button"
                          variant="ghost"
                        >
                          <FolderPenIcon className="size-3.5" />
                        </Button>
                        <Button
                          disabled={isProjectPending}
                          onClick={() => {
                            void handleDeleteProject(project.id)
                          }}
                          size="icon-xs"
                          type="button"
                          variant="ghost"
                        >
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>

          {!projects?.length ? (
            <p className="px-1 text-sm text-muted-foreground">No projects yet. Create your first one above.</p>
          ) : null}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {actionError ? (
          <div className="border-b border-destructive/30 bg-destructive/10 px-6 py-2.5 text-sm text-destructive">
            {actionError}
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-8 py-8">
            {/* Project header */}
            {projectData ? (
              <div className="mb-8">
                <h2 className="text-3xl">{projectData.project.name}</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {activeTasks.length} active{completedTasks.length > 0 ? ` · ${completedTasks.length} completed` : ""}
                </p>
              </div>
            ) : !projects?.length ? (
              <div className="flex min-h-[40vh] items-center justify-center">
                <p className="text-sm text-muted-foreground">Create a project from the left sidebar to get started.</p>
              </div>
            ) : projectLoading ? (
              <div className="mb-6">
                <div className="h-8 w-48 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-4 w-32 animate-pulse rounded bg-muted" />
              </div>
            ) : null}

            {/* Add task */}
            <form className="mb-6 flex items-center gap-2" onSubmit={handleCreate}>
              <div className="relative flex-1">
                <PlusIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  disabled={isCreating || !activeProjectId}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={activeProjectId ? "Add a task…" : "Create a project first"}
                  value={newTitle}
                />
              </div>
              <Button disabled={isCreating || !newTitle.trim() || !activeProjectId} size="sm" type="submit">
                Add
              </Button>
            </form>

            {/* Active tasks */}
            {activeProjectId ? (
              <>
                <div className="divide-y divide-border">
                  {activeTasks.map((task) => (
                    <button
                      key={task.id}
                      className="flex w-full items-center gap-3 px-1 py-3 text-left transition-colors hover:bg-accent/30"
                      onClick={() => setEditingTask(task)}
                      type="button"
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                      >
                        <Checkbox
                          checked={false}
                          onCheckedChange={() => handleComplete(task)}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{task.title}</p>
                        {task.dueDate ? (
                          <p className="text-xs text-muted-foreground">{formatTaskDate(task.dueDate)}</p>
                        ) : null}
                      </div>
                      {task.priority >= 3 ? (
                        <span
                          className={cn(
                            "size-2 shrink-0 rounded-full",
                            task.priority === 5 ? "bg-destructive" : "bg-muted-foreground/50",
                          )}
                        />
                      ) : null}
                    </button>
                  ))}
                </div>

                {/* Completed tasks */}
                {completedTasks.length > 0 ? (
                  <div className="mt-8">
                    <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
                      Completed
                    </p>
                    <div className="divide-y divide-border/50">
                      {completedTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 px-1 py-2.5"
                        >
                          <div className="size-4 shrink-0" />
                          <p className="truncate text-sm text-muted-foreground line-through">
                            {task.title}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Edit sheet */}
      <TaskEditSheet
        onClose={() => setEditingTask(null)}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
        projectNames={buildProjectNameMap(projects)}
        projects={projects}
        task={editingTask}
      />
    </div>
  )
}
