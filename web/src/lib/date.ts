import { format, isValid, parseISO, startOfDay } from "date-fns"

// Dida365 task IDs are MongoDB ObjectIDs: first 4 bytes (8 hex chars) = Unix timestamp in seconds
export function getCreationDateFromId(id: string): Date | null {
  if (id.length < 8) return null
  const timestamp = parseInt(id.substring(0, 8), 16)
  if (isNaN(timestamp) || timestamp <= 0) return null
  const date = new Date(timestamp * 1000)
  return isValid(date) ? date : null
}

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
