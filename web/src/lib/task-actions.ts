"use client"

import { useTransition } from "react"
import { useSWRConfig } from "swr"

import { apiFetch } from "@/lib/api-fetch"
import type { ProjectData, Task, TaskCreate, TaskUpdate } from "@/lib/types"

function taskFetch(url: string, method: string, body?: unknown): Promise<Response> {
  return apiFetch(url, {
    body: body ? JSON.stringify(body) : undefined,
    headers: { "Content-Type": "application/json" },
    method,
  })
}

export function useTaskActions() {
  const { mutate } = useSWRConfig()
  const [isPending, startTransition] = useTransition()

  const updateProjectTaskCaches = (projectId: string, updateTasks: (tasks: Task[]) => Task[]) => {
    void mutate(
      `/api/projects/${projectId}`,
      (current?: ProjectData) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          tasks: updateTasks(current.tasks),
        }
      },
      { revalidate: false },
    )

    void mutate(
      (key) => typeof key === "string" && key.startsWith("all-projects-data:"),
      (current?: Map<string, ProjectData>) => {
        if (!current?.has(projectId)) {
          return current
        }

        const projectData = current.get(projectId)

        if (!projectData) {
          return current
        }

        const next = new Map(current)
        next.set(projectId, {
          ...projectData,
          tasks: updateTasks(projectData.tasks),
        })

        return next
      },
      { revalidate: false },
    )
  }

  const revalidateTaskData = (projectId?: string) => {
    startTransition(() => {
      void mutate("/api/projects")
      void mutate("/api/completed")
      if (projectId) {
        void mutate(`/api/projects/${projectId}`)
      } else {
        void mutate((key) => typeof key === "string" && key.startsWith("/api/projects/"))
      }
      void mutate((key) => typeof key === "string" && key.startsWith("all-projects-data:"))
    })
  }

  const completeTask = async (task: Pick<Task, "id" | "projectId">) => {
    await taskFetch(`/api/tasks/${task.id}/complete`, "POST", { projectId: task.projectId })

    updateProjectTaskCaches(task.projectId, (tasks) =>
      tasks.map((currentTask) =>
        currentTask.id === task.id
          ? {
              ...currentTask,
              completedTime: currentTask.completedTime ?? new Date().toISOString(),
              status: 2,
            }
          : currentTask,
      ),
    )

    revalidateTaskData(task.projectId)
  }

  const createTask = async (payload: TaskCreate) => {
    const response = await taskFetch("/api/tasks", "POST", payload)
    const task = (await response.json()) as Task

    updateProjectTaskCaches(task.projectId, (tasks) => [task, ...tasks])
    revalidateTaskData(task.projectId)

    return task
  }

  const updateTask = async (taskId: string, payload: TaskUpdate) => {
    const response = await taskFetch(`/api/tasks/${taskId}`, "PUT", payload)
    const task = (await response.json()) as Task

    updateProjectTaskCaches(task.projectId, (tasks) =>
      tasks.map((currentTask) => (currentTask.id === task.id ? task : currentTask)),
    )
    revalidateTaskData(task.projectId)

    return task
  }

  const deleteTask = async (task: Pick<Task, "id" | "projectId">) => {
    await taskFetch(`/api/tasks/${task.id}`, "DELETE", { projectId: task.projectId })

    updateProjectTaskCaches(task.projectId, (tasks) =>
      tasks.filter((currentTask) => currentTask.id !== task.id),
    )
    revalidateTaskData(task.projectId)
  }

  return {
    completeTask,
    createTask,
    deleteTask,
    isPending,
    updateTask,
  }
}
