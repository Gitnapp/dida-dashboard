import { DIDA_BASE_URL } from "@/lib/session"
import type { Project, ProjectCreate, ProjectData, ProjectUpdate, Task, TaskCreate, TaskUpdate } from "@/lib/types"

type JsonValue = Record<string, unknown> | unknown[] | string | number | boolean | null

const PRIVATE_API_BASE = "https://api.dida365.com/api/v2"
const PRIVATE_HEADERS = {
  "Content-Type": "application/json",
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:95.0) Gecko/20100101 Firefox/95.0",
  "x-device": JSON.stringify({
    platform: "web",
    os: "OS X",
    device: "Firefox 95.0",
    name: "dida365-dashboard",
    version: 4531,
    channel: "website",
    campaign: "",
    websocket: "",
  }),
}

let cachedCliToken: string | null | undefined

async function loadCliToken(): Promise<string | null> {
  if (cachedCliToken !== undefined) {
    return cachedCliToken
  }

  try {
    const { readFile } = await import("fs/promises")
    const { join } = await import("path")
    const { homedir } = await import("os")

    const raw = JSON.parse(
      await readFile(join(homedir(), ".dida365", "token.json"), "utf-8"),
    ) as { token?: string }

    cachedCliToken = raw.token ?? null
  } catch {
    cachedCliToken = null
  }

  return cachedCliToken
}

async function privateRequest<T>(path: string, fallbackToken?: string): Promise<T | null> {
  const cliToken = await loadCliToken()

  // Try CLI session cookie first
  if (cliToken) {
    const response = await fetch(`${PRIVATE_API_BASE}${path}`, {
      headers: { ...PRIVATE_HEADERS, Cookie: `t=${cliToken}` },
      cache: "no-store",
    })
    if (response.ok) {
      const text = await response.text()
      return text ? (JSON.parse(text) as T) : null
    }
  }

  if (!fallbackToken) return null

  // Try OAuth token as Bearer (works when Dida365 accepts it on private endpoints)
  const bearerResponse = await fetch(`${PRIVATE_API_BASE}${path}`, {
    headers: { ...PRIVATE_HEADERS, Authorization: `Bearer ${fallbackToken}` },
    cache: "no-store",
  })
  if (bearerResponse.ok) {
    const text = await bearerResponse.text()
    return text ? (JSON.parse(text) as T) : null
  }

  // Last resort: try OAuth token as session cookie
  const cookieResponse = await fetch(`${PRIVATE_API_BASE}${path}`, {
    headers: { ...PRIVATE_HEADERS, Cookie: `t=${fallbackToken}` },
    cache: "no-store",
  })
  if (!cookieResponse.ok) return null
  const text = await cookieResponse.text()
  return text ? (JSON.parse(text) as T) : null
}

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
    // Manual override via environment variable
    const envInboxId = process.env.DIDA_INBOX_ID
    if (envInboxId) return envInboxId

    // Try CLI session token against the private API (works locally)
    const privateData = await privateRequest<{ inboxId?: string }>("/batch/check/0")
    if (privateData?.inboxId) return privateData.inboxId

    // Use the open API "inbox" alias to discover the real inbox ID from task data.
    // Falls back to the literal "inbox" ID if the inbox is empty.
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

  async getCompletedTasks(from: string, to: string, limit = 100): Promise<Task[]> {
    const params = new URLSearchParams({ from, to, limit: String(limit) })
    const data = await privateRequest<Task[]>(`/project/all/completed?${params}`)
    return data ?? []
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
