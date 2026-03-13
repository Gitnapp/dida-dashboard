import {
  addDays,
  compareAsc,
  compareDesc,
  endOfDay,
  endOfWeek,
  format,
  isSameDay,
  isWithinInterval,
  startOfDay,
  startOfWeek,
} from "date-fns"

import { getTaskDayKey, parseDidaDate } from "@/lib/date"
import type { Project, ProjectData, Task } from "@/lib/types"

export function collectAllTasks(projectsData?: Map<string, ProjectData>) {
  if (!projectsData) {
    return [] as Task[]
  }

  const tasks: Task[] = []

  for (const projectData of projectsData.values()) {
    tasks.push(...projectData.tasks)
  }

  return tasks
}

export function buildProjectNameMap(projects?: Project[]) {
  return new Map((projects ?? []).map((project) => [project.id, project.name] as const))
}

export function getActiveTasks(tasks: Task[]) {
  return tasks.filter((task) => task.status === 0)
}

export function getCompletedTasks(tasks: Task[]) {
  return tasks.filter((task) => task.status === 2)
}

export function getTodayTasks(tasks: Task[], now = new Date()) {
  const start = startOfDay(now)
  const end = endOfDay(now)

  return getActiveTasks(tasks)
    .filter((task) => {
      const dueDate = parseDidaDate(task.dueDate)
      return dueDate ? isWithinInterval(dueDate, { start, end }) : false
    })
    .sort(comparePriorityThenDate)
}

export function getOverdueTasks(tasks: Task[], now = new Date()) {
  const todayStart = startOfDay(now)

  return getActiveTasks(tasks)
    .filter((task) => {
      const dueDate = parseDidaDate(task.dueDate)
      return dueDate ? compareAsc(dueDate, todayStart) === -1 : false
    })
    .sort((left, right) => {
      const leftDate = parseDidaDate(left.dueDate)
      const rightDate = parseDidaDate(right.dueDate)

      if (!leftDate || !rightDate) {
        return comparePriorityThenDate(left, right)
      }

      return compareAsc(leftDate, rightDate)
    })
}

export function getUpcomingTasks(tasks: Task[], days = 7, now = new Date()) {
  const start = startOfDay(addDays(now, 1))
  const end = endOfDay(addDays(now, days))

  return getActiveTasks(tasks)
    .filter((task) => {
      const dueDate = parseDidaDate(task.dueDate)
      return dueDate ? isWithinInterval(dueDate, { start, end }) : false
    })
    .sort(comparePriorityThenDate)
}

export function getRecentCompletions(tasks: Task[], limit = 10) {
  return getCompletedTasks(tasks)
    .filter((task) => parseDidaDate(task.completedTime))
    .sort((left, right) => {
      const leftDate = parseDidaDate(left.completedTime)
      const rightDate = parseDidaDate(right.completedTime)

      if (!leftDate || !rightDate) {
        return 0
      }

      return compareDesc(leftDate, rightDate)
    })
    .slice(0, limit)
}

export function getTasksForDay(tasks: Task[], day: Date) {
  return getActiveTasks(tasks)
    .filter((task) => {
      const dueDate = parseDidaDate(task.dueDate)
      return dueDate ? isSameDay(dueDate, day) : false
    })
    .sort(comparePriorityThenDate)
}

export function groupTasksByDueDate(tasks: Task[]) {
  const groups = new Map<string, Task[]>()

  for (const task of tasks) {
    const key = getTaskDayKey(task.dueDate)

    if (!key) {
      continue
    }

    const entry = groups.get(key) ?? []
    entry.push(task)
    groups.set(key, entry)
  }

  return Array.from(groups.entries())
    .sort(([left], [right]) => compareAsc(new Date(left), new Date(right)))
    .map(([key, entry]) => ({
      key,
      label: format(new Date(key), "EEE, MMM d"),
      tasks: entry.sort(comparePriorityThenDate),
    }))
}

export function groupTasksByCompletionDate(tasks: Task[]) {
  const groups = new Map<string, Task[]>()

  for (const task of tasks) {
    const key = getTaskDayKey(task.completedTime)

    if (!key) {
      continue
    }

    const entry = groups.get(key) ?? []
    entry.push(task)
    groups.set(key, entry)
  }

  return Array.from(groups.entries())
    .sort(([left], [right]) => compareDesc(new Date(left), new Date(right)))
    .map(([key, entry]) => ({
      key,
      label: format(new Date(key), "EEEE, MMM d"),
      tasks: entry.sort((leftTask, rightTask) => {
        const leftDate = parseDidaDate(leftTask.completedTime)
        const rightDate = parseDidaDate(rightTask.completedTime)

        if (!leftDate || !rightDate) {
          return 0
        }

        return compareDesc(leftDate, rightDate)
      }),
    }))
}

export function getCalendarDots(tasks: Task[]) {
  const activeTasks = getActiveTasks(tasks)
  const dots = new Set<string>()

  for (const task of activeTasks) {
    const key = getTaskDayKey(task.dueDate)
    if (key) {
      dots.add(key)
    }
  }

  return dots
}

export function getWeekDays(anchorDate: Date) {
  const start = startOfWeek(anchorDate, { weekStartsOn: 1 })
  const end = endOfWeek(anchorDate, { weekStartsOn: 1 })
  const days: Date[] = []
  let cursor = start

  while (compareAsc(cursor, end) <= 0) {
    days.push(cursor)
    cursor = addDays(cursor, 1)
  }

  return days
}

export function formatPriority(priority: number) {
  switch (priority) {
    case 5:
      return "High"
    case 3:
      return "Medium"
    case 1:
      return "Low"
    default:
      return "None"
  }
}

export function getPriorityTone(priority: number) {
  switch (priority) {
    case 5:
      return "destructive" as const
    case 3:
      return "default" as const
    case 1:
      return "secondary" as const
    default:
      return "outline" as const
  }
}

export function buildProjectStats(projectData: ProjectData) {
  const total = projectData.tasks.length
  const completed = projectData.tasks.filter((task) => task.status === 2).length
  const active = total - completed
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)

  return {
    active,
    completed,
    percent,
    total,
  }
}

export function getRangeLabel(from?: Date, to?: Date) {
  if (!from && !to) {
    return "Any time"
  }

  if (from && to) {
    return `${format(from, "MMM d")} – ${format(to, "MMM d")}`
  }

  const date = from ?? to
  return date ? format(date, "MMM d") : "Any time"
}

export function isWithinCompletedRange(task: Task, from?: Date, to?: Date) {
  const completedAt = parseDidaDate(task.completedTime)

  if (!completedAt) {
    return false
  }

  if (from && completedAt < startOfDay(from)) {
    return false
  }

  if (to && completedAt > endOfDay(to)) {
    return false
  }

  return true
}

export function getProjectSelectOptions(projects?: Project[]) {
  return (projects ?? []).toSorted((left, right) => left.name.localeCompare(right.name))
}

export function sortFilteredTasks(
  tasks: Task[],
  sortBy: "dueDate" | "priority" | "project",
  projectNames?: Map<string, string>,
) {
  return tasks.toSorted((left, right) => {
    switch (sortBy) {
      case "priority":
        return right.priority - left.priority || left.title.localeCompare(right.title)
      case "project":
        if (!projectNames) return left.title.localeCompare(right.title)
        return (projectNames.get(left.projectId) ?? "").localeCompare(
          projectNames.get(right.projectId) ?? "",
        )
      case "dueDate":
      default: {
        const leftDate = parseDidaDate(left.dueDate)
        const rightDate = parseDidaDate(right.dueDate)

        if (!leftDate && !rightDate) return left.title.localeCompare(right.title)
        if (!leftDate) return 1
        if (!rightDate) return -1

        return leftDate.getTime() - rightDate.getTime()
      }
    }
  })
}

function comparePriorityThenDate(left: Task, right: Task) {
  if (left.priority !== right.priority) {
    return right.priority - left.priority
  }

  const leftDate = parseDidaDate(left.dueDate)
  const rightDate = parseDidaDate(right.dueDate)

  if (!leftDate && !rightDate) {
    return left.title.localeCompare(right.title)
  }

  if (!leftDate) {
    return 1
  }

  if (!rightDate) {
    return -1
  }

  const dateComparison = compareAsc(leftDate, rightDate)
  if (dateComparison !== 0) {
    return dateComparison
  }

  return left.title.localeCompare(right.title)
}
