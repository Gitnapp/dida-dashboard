"use client"

import { useTransition } from "react"
import { useSWRConfig } from "swr"

import { apiFetch } from "@/lib/api-fetch"
import type { Task, TaskCreate, TaskUpdate } from "@/lib/types"

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

  const revalidateTaskData = () => {
    startTransition(() => {
      void mutate("/api/projects")
      void mutate((key) => typeof key === "string" && key.startsWith("/api/projects/"))
      void mutate((key) => typeof key === "string" && key.startsWith("all-projects-data:"))
    })
  }

  const completeTask = async (task: Pick<Task, "id" | "projectId">) => {
    await taskFetch(`/api/tasks/${task.id}/complete`, "POST", { projectId: task.projectId })
    revalidateTaskData()
  }

  const createTask = async (payload: TaskCreate) => {
    const response = await taskFetch("/api/tasks", "POST", payload)
    const task = (await response.json()) as Task
    revalidateTaskData()
    return task
  }

  const updateTask = async (taskId: string, payload: TaskUpdate) => {
    const response = await taskFetch(`/api/tasks/${taskId}`, "PUT", payload)
    const task = (await response.json()) as Task
    revalidateTaskData()
    return task
  }

  const deleteTask = async (task: Pick<Task, "id" | "projectId">) => {
    await taskFetch(`/api/tasks/${task.id}`, "DELETE", { projectId: task.projectId })
    revalidateTaskData()
  }

  return {
    completeTask,
    createTask,
    deleteTask,
    isPending,
    updateTask,
  }
}
