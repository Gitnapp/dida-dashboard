"use client"

import { useTransition } from "react"
import { useSWRConfig } from "swr"

import { apiFetch } from "@/lib/api-fetch"
import type { Project, ProjectCreate, ProjectData } from "@/lib/types"

function projectFetch(url: string, method: string, body?: unknown): Promise<Response> {
  return apiFetch(url, {
    body: body ? JSON.stringify(body) : undefined,
    headers: { "Content-Type": "application/json" },
    method,
  })
}

export function useProjectActions() {
  const { mutate } = useSWRConfig()
  const [isPending, startTransition] = useTransition()

  const updateProjectListCaches = (updateProjects: (projects: Project[]) => Project[]) => {
    void mutate(
      "/api/projects",
      (current?: Project[]) => (current ? updateProjects(current) : current),
      { revalidate: false },
    )
  }

  const updateProjectMapCaches = (
    projectId: string,
    updateProjectData: (projectData: ProjectData) => ProjectData | undefined,
  ) => {
    void mutate(
      `/api/projects/${projectId}`,
      (current?: ProjectData) => (current ? updateProjectData(current) : current),
      { revalidate: false },
    )

    void mutate(
      (key) => typeof key === "string" && key.startsWith("all-projects-data:"),
      (current?: Map<string, ProjectData>) => {
        if (!current) {
          return current
        }

        if (!current.has(projectId)) {
          return current
        }

        const projectData = current.get(projectId)

        if (!projectData) {
          return current
        }

        const next = new Map(current)
        const updated = updateProjectData(projectData)

        if (updated) {
          next.set(projectId, updated)
        } else {
          next.delete(projectId)
        }

        return next
      },
      { revalidate: false },
    )
  }

  const revalidateProjectData = () => {
    startTransition(() => {
      void mutate("/api/projects")
      void mutate((key) => typeof key === "string" && key.startsWith("/api/projects/"))
      void mutate((key) => typeof key === "string" && key.startsWith("all-projects-data:"))
    })
  }

  const createProject = async (payload: ProjectCreate) => {
    const response = await projectFetch("/api/projects", "POST", payload)
    const project = (await response.json()) as Project

    void mutate(
      "/api/projects",
      (current?: Project[]) => (current ? [...current, project] : [project]),
      { revalidate: false },
    )

    revalidateProjectData()

    return project
  }

  const renameProject = async (projectId: string, name: string) => {
    const response = await projectFetch(`/api/projects/${projectId}`, "PUT", { name })
    const project = (await response.json()) as Project

    updateProjectListCaches((projects) =>
      projects.map((currentProject) => (currentProject.id === project.id ? project : currentProject)),
    )
    updateProjectMapCaches(project.id, (projectData) => ({
      ...projectData,
      project,
    }))

    revalidateProjectData()

    return project
  }

  const deleteProject = async (projectId: string) => {
    await projectFetch(`/api/projects/${projectId}`, "DELETE")

    updateProjectListCaches((projects) =>
      projects.filter((currentProject) => currentProject.id !== projectId),
    )
    updateProjectMapCaches(projectId, () => undefined)

    revalidateProjectData()
  }

  return {
    createProject,
    deleteProject,
    isPending,
    renameProject,
  }
}
