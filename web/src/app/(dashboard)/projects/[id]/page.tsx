"use client"

import { useState } from "react"
import { useParams } from "next/navigation"

import { Board } from "@/components/kanban/board"
import { TaskDetailSheet } from "@/components/kanban/task-detail-sheet"
import { AddTaskRow } from "@/components/tasks/add-task-row"
import { TaskFilters } from "@/components/tasks/task-filters"
import { TaskTable } from "@/components/tasks/task-table"
import { ErrorState, PageLoadingState } from "@/components/shared/states"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useProjectData } from "@/lib/hooks"
import { useTaskActions } from "@/lib/task-actions"
import { buildProjectStats, sortFilteredTasks } from "@/lib/task-utils"
import type { Task, TaskFiltersState } from "@/lib/types"

const defaultFilters: TaskFiltersState = {
  priority: null,
  projectId: null,
  sortBy: "dueDate",
  status: "active",
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>()
  const { data, error, isLoading } = useProjectData(params.id)
  const { completeTask, createTask } = useTaskActions()
  const [filters, setFilters] = useState<TaskFiltersState>(defaultFilters)
  const [actionError, setActionError] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  if (error) {
    return <ErrorState description={error.message} title="Unable to load project" />
  }

  if (isLoading || !data) {
    return <PageLoadingState />
  }

  const stats = buildProjectStats(data)
  const projectNameMap = new Map([[data.project.id, data.project.name]])
  const filteredTasks = sortFilteredTasks(
    data.tasks
      .filter((task) => (filters.priority ? task.priority === filters.priority : true))
      .filter((task) => {
        if (filters.status === "all") {
          return true
        }

        return filters.status === "active" ? task.status === 0 : task.status === 2
      }),
    filters.sortBy,
  )

  async function handleComplete(task: Task) {
    setActionError(null)

    try {
      await completeTask(task)
    } catch (completionError) {
      setActionError(
        completionError instanceof Error ? completionError.message : "Unable to complete task.",
      )
    }
  }

  async function handleCreateTask(payload: { content?: string; projectId: string; title: string }) {
    setActionError(null)

    try {
      await createTask(payload)
    } catch (creationError) {
      const message = creationError instanceof Error ? creationError.message : "Unable to create task."
      setActionError(message)
      throw creationError
    }
  }

  return (
    <div className="space-y-6">
      <section className="surface rounded-[1.8rem] border px-6 py-6">
        <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Project detail</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h2 className="text-5xl leading-[0.92]">{data.project.name}</h2>
            <p className="text-sm text-muted-foreground">
              {stats.total} total · {stats.active} active · {stats.completed} completed
            </p>
          </div>
          <div className="w-full max-w-sm space-y-2">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-muted-foreground">
              <span>Completion</span>
              <span>{stats.percent}%</span>
            </div>
            <Progress className="h-2" value={stats.percent} />
          </div>
        </div>
      </section>

      {actionError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <AddTaskRow defaultProjectId={data.project.id} onCreate={handleCreateTask} projects={[data.project]} />

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="board">Board</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4" value="tasks">
          <TaskFilters hideProjectFilter onChange={setFilters} value={filters} />
          <TaskTable hideProject onComplete={handleComplete} projectNames={projectNameMap} tasks={filteredTasks} />
        </TabsContent>

        <TabsContent value="board">
          {data.columns.length === 0 ? (
            <ErrorState
              description="This project does not expose kanban columns, so only the task list view is available."
              title="No board available"
            />
          ) : (
            <>
              <Board columns={data.columns} onSelectTask={setSelectedTask} tasks={data.tasks} />
              <TaskDetailSheet
                onClose={() => setSelectedTask(null)}
                onComplete={handleComplete}
                projectName={data.project.name}
                task={selectedTask}
              />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
