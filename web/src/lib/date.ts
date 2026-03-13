import { format, isValid, parseISO, startOfDay } from "date-fns"

function normalizeTimezoneOffset(value: string) {
  return value.replace(/([+-]\d{2})(\d{2})$/, "$1:$2")
}

export function parseDidaDate(value?: string | null) {
  if (!value) {
    return null
  }

  const normalized = normalizeTimezoneOffset(value)
  const parsed = parseISO(normalized)

  return isValid(parsed) ? parsed : null
}

export function toDayKey(date: Date) {
  return format(date, "yyyy-MM-dd")
}

export function getTaskDayKey(value?: string | null) {
  const date = parseDidaDate(value)
  return date ? toDayKey(startOfDay(date)) : null
}

export function formatTaskDate(value?: string | null, pattern = "MMM d") {
  const date = parseDidaDate(value)
  return date ? format(date, pattern) : "No date"
}

export function formatTaskDateTime(value?: string | null) {
  const date = parseDidaDate(value)
  return date ? format(date, "MMM d, HH:mm") : "Unknown time"
}
