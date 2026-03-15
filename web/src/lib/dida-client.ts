import { DIDA_BASE_URL } from "@/lib/session"
import type { Project, ProjectCreate, ProjectData, ProjectUpdate, Task, TaskCreate, TaskUpdate } from "@/lib/types"

type JsonValue = Record<string, unknown> | unknown[] | string | number | boolean | null

function readErrorMessage(status: number, payload: JsonValue | undefined) {
  if (payload && typeof payload === "object" && !Array.isArray(payload) && "error" in payload) {
    const errorValue = payload.error
    if (typeof errorValue === "string" && errorValue.length > 0) {
      return errorValue
    }
  }

  switch (status) {
    case 400:
      return "The request sent to Dida365 was invalid."
    case 401:
      return "Your Dida365 session is no longer valid."
    case 403:
      return "Dida365 rejected this action."
    case 404:
      return "The requested Dida365 resource was not found."
    default:
      return "Dida365 returned an unexpected error."
  }
}

export class DidaClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload?: JsonValue,
  ) {
    super(message)
    this.name = "DidaClientError"
  }
}

export class DidaClient {
  constructor(
    private readonly accessToken: string,
    private readonly baseUrl = DIDA_BASE_URL,
  ) {}

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })

    const text = await response.text()
    const payload = text ? (JSON.parse(text) as JsonValue) : undefined

    if (!response.ok) {
      throw new DidaClientError(readErrorMessage(response.status, payload), response.status, payload)
    }

    return payload as T
  }

  async listProjects() {
    return this.request<Project[]>("GET", "/open/v1/project")
  }

  async createProject(project: ProjectCreate) {
    return this.request<Project>("POST", "/open/v1/project", project)
  }

  async updateProject(projectId: string, project: ProjectUpdate) {
    return this.request<Project>("POST", `/open/v1/project/${projectId}`, project)
  }

  async deleteProject(projectId: string) {
    await this.request<void>("DELETE", `/open/v1/project/${projectId}`)
  }

  async getInboxId(): Promise<string | null> {
    try {
      const data = await this.request<{ tasks?: Array<{ projectId?: string }> }>(
        "GET",
        "/open/v1/project/inbox/data",
      )
      const realId = data?.tasks?.find((t) => t.projectId?.startsWith("inbox"))?.projectId
      return realId ?? "inbox"
    } catch {
      return null
    }
  }

  async getProjectData(projectId: string) {
    return this.request<ProjectData>("GET", `/open/v1/project/${projectId}/data`)
  }

  async createTask(task: TaskCreate) {
    return this.request<Task>("POST", "/open/v1/task", task)
  }

  async completeTask(projectId: string, taskId: string) {
    await this.request<void>("POST", `/open/v1/project/${projectId}/task/${taskId}/complete`)
  }

  async updateTask(taskId: string, update: TaskUpdate) {
    return this.request<Task>("POST", `/open/v1/task/${taskId}`, update)
  }

  async deleteTask(projectId: string, taskId: string) {
    await this.request<void>("DELETE", `/open/v1/project/${projectId}/task/${taskId}`)
  }
}
