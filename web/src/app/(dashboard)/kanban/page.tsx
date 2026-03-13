"use client"

import { useState } from "react"

import { Board } from "@/components/kanban/board"
import { TaskDetailSheet } from "@/components/kanban/task-detail-sheet"
import { EmptyState, ErrorState, PageLoadingState } from "@/components/shared/states"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useProjectData, useProjects } from "@/lib/hooks"
import { useTaskActions } from "@/lib/task-actions"
import type { Task } from "@/lib/types"

export default function KanbanPage() {
  const { data: projects, error: projectsError, isLoading: projectsLoading } = useProjects()
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const { completeTask } = useTaskActions()
  const activeProjectId = selectedProjectId ?? projects?.[0]?.id ?? null

  const {
    data: projectData,
    error: projectError,
    isLoading: projectLoading,
  } = useProjectData(activeProjectId)

  if (projectsError || projectError) {
    return <ErrorState description={(projectsError ?? projectError)?.message ?? "Unable to load kanban."} />
  }

  if (projectsLoading || projectLoading) {
    return <PageLoadingState />
  }

  if (!projects?.length || !activeProjectId || !projectData) {
    return (
      <EmptyState
        description="Once a project with accessible data is available, kanban lanes will render here."
        title="No project selected"
      />
    )
  }

  async function handleComplete(task: Task) {
    setActionError(null)

    try {
      await completeTask(task)
      setSelectedTask(null)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to complete task.")
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Kanban</p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-5xl leading-[0.92]">Read the board without changing it.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Lanes are read-only in v1. Open a card for details and complete it if the work is done.
            </p>
          </div>

          <Select
            items={projects.map((p) => ({ value: p.id, label: p.name }))}
            onValueChange={(nextValue) => setSelectedProjectId(nextValue)}
            value={activeProjectId}
          >
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {actionError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      {projectData.columns.length === 0 ? (
        <EmptyState
          action={{ href: `/projects/${projectData.project.id}`, label: "Open project detail" }}
          description="This project does not expose kanban columns through the Dida365 API. Use the list view instead."
          title="No columns on this project"
        />
      ) : (
        <Board columns={projectData.columns} onSelectTask={setSelectedTask} tasks={projectData.tasks} />
      )}

      <TaskDetailSheet
        onClose={() => setSelectedTask(null)}
        onComplete={handleComplete}
        projectName={projectData.project.name}
        task={selectedTask}
      />
    </div>
  )
}
