"use client"

import useSWR from "swr"

import { apiFetch } from "@/lib/api-fetch"
import type { Project, ProjectData } from "@/lib/types"

async function fetcher<T>(url: string): Promise<T> {
  const response = await apiFetch(url)
  return response.json() as Promise<T>
}

export function useProjects() {
  return useSWR("/api/projects", fetcher<Project[]>, {
    revalidateOnFocus: false,
  })
}

export function useProjectData(projectId: string | null) {
  return useSWR(projectId ? `/api/projects/${projectId}` : null, fetcher<ProjectData>, {
    revalidateOnFocus: false,
  })
}


export function useAllProjectsData(projects?: Project[]) {
  const key = projects?.length
    ? `all-projects-data:${projects
        .map((project) => project.id)
        .sort()
        .join(",")}`
    : null

  return useSWR(
    key,
    async () => {
      const responses = await Promise.all(
        (projects ?? []).map(async (project) => {
          const data = await fetcher<ProjectData>(`/api/projects/${project.id}`)
          return [project.id, data] as const
        }),
      )

      return new Map(responses)
    },
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  )
}
