export const TIMEZONE = "Africa/Dar_es_Salaam"

export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleString("en-GB", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString("en-GB", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleTimeString("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

export function getStartOfDay(date: Date = new Date()): string {
  const d = new Date(date.toLocaleString("en-US", { timeZone: TIMEZONE }))
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export function getEndOfDay(date: Date = new Date()): string {
  const d = new Date(date.toLocaleString("en-US", { timeZone: TIMEZONE }))
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}
