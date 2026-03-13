"use client"

import { useState } from "react"

import { AddTaskRow } from "@/components/tasks/add-task-row"
import { TaskEditSheet } from "@/components/tasks/task-edit-sheet"
import { TaskFilters } from "@/components/tasks/task-filters"
import { TaskTable } from "@/components/tasks/task-table"
import { EmptyState, ErrorState, PageLoadingState } from "@/components/shared/states"
import { useAllProjectsData, useProjects } from "@/lib/hooks"
import { useTaskActions } from "@/lib/task-actions"
import { buildProjectNameMap, collectAllTasks, sortFilteredTasks } from "@/lib/task-utils"
import type { Task, TaskFiltersState, TaskUpdate } from "@/lib/types"

const defaultFilters: TaskFiltersState = {
  priority: null,
  projectId: null,
  sortBy: "dueDate",
  status: "active",
}

export default function TodosPage() {
  const [filters, setFilters] = useState<TaskFiltersState>(defaultFilters)
  const [actionError, setActionError] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const { data: projects, error: projectsError, isLoading: projectsLoading } = useProjects()
  const { data: projectsData, error: dataError, isLoading: dataLoading } = useAllProjectsData(projects)
  const { completeTask, createTask, deleteTask, updateTask } = useTaskActions()

  if (projectsError || dataError) {
    return <ErrorState description={(projectsError ?? dataError)?.message ?? "Unable to load todos."} />
  }

  if (projectsLoading || dataLoading) {
    return <PageLoadingState />
  }

  if (!projects?.length) {
    return (
      <EmptyState
        description="Create a Dida365 list first. Once the API returns projects, the todo table will populate."
        title="No projects available"
      />
    )
  }

  const projectNames = buildProjectNameMap(projects)
  const allTasks = collectAllTasks(projectsData)

  const filteredTasks = sortFilteredTasks(
    allTasks
      .filter((task) => (filters.projectId ? task.projectId === filters.projectId : true))
      .filter((task) => (filters.priority ? task.priority === filters.priority : true))
      .filter((task) => {
        if (filters.status === "all") {
          return true
        }

        return filters.status === "active" ? task.status === 0 : task.status === 2
      }),
    filters.sortBy,
    projectNames,
  )

  async function handleComplete(task: Task) {
    setActionError(null)

    try {
      await completeTask(task)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to complete task.")
    }
  }

  async function handleCreateTask(payload: { content?: string; projectId: string; title: string }) {
    setActionError(null)

    try {
      await createTask(payload)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create task."
      setActionError(message)
      throw error
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
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Todos</p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-5xl leading-[0.92]">Filter the backlog without leaving the page.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Sort by urgency, switch between active and completed work, and create new tasks inline.
            </p>
          </div>
        </div>
      </section>

      {actionError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <AddTaskRow onCreate={handleCreateTask} projects={projects} />
      <TaskFilters onChange={setFilters} projects={projects} value={filters} />
      <TaskTable
        onComplete={handleComplete}
        onDelete={handleDelete}
        onEdit={setEditingTask}
        projectNames={projectNames}
        tasks={filteredTasks}
      />

      <TaskEditSheet
        onClose={() => setEditingTask(null)}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
        projectNames={projectNames}
        projects={projects}
        task={editingTask}
      />
    </div>
  )
}
