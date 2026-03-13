export interface Task {
  id: string
  projectId: string
  title: string
  content?: string
  status: number
  priority: number
  dueDate?: string
  completedTime?: string
  createdTime?: string
  sortOrder: number
  columnId?: string
  startDate?: string
  isAllDay?: boolean
}

export interface TaskCreate {
  title: string
  projectId: string
  content?: string
  dueDate?: string
}

export interface TaskUpdate {
  title?: string
  projectId: string
  content?: string
  dueDate?: string | null
  priority?: number
}

export interface Project {
  id: string
  name: string
  color?: string
  sortOrder: number
  closed: boolean
  kind: string
}

export interface ProjectCreate {
  name: string
  color?: string
  kind?: "TASK" | "NOTE"
  viewMode?: "list" | "kanban" | "timeline"
}

export interface ProjectUpdate {
  name?: string
  color?: string
  viewMode?: "list" | "kanban" | "timeline"
  sortOrder?: number
  kind?: string
  closed?: boolean
}

export interface Column {
  id: string
  projectId: string
  name: string
  sortOrder: number
}

export interface ProjectData {
  project: Project
  tasks: Task[]
  columns: Column[]
}

export interface SessionData {
  accessToken: string
  tokenExpiry: number
  baseUrl: string
}

export interface TaskFiltersState {
  projectId: string | null
  priority: number | null
  status: "active" | "completed" | "all"
  sortBy: "dueDate" | "priority" | "project"
}
