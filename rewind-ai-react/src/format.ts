import { projectColors } from './data'
import type { ProjectStatus } from './types'

export function errorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : 'Something went wrong. Please try again.'
}

/** "react, ts" -> ["react", "ts"] (the backend trims and de-duplicates again). */
export function parseTags(input: string): string[] {
  return input.split(',').map((t) => t.trim()).filter(Boolean)
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  if (days < 30) {
    const weeks = Math.round(days / 7)
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`
  }
  return new Date(then).toLocaleDateString()
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString()
}

export function titleCase(text: string): string {
  return text ? text[0].toUpperCase() + text.slice(1) : text
}

/** Project cards keep their look: first letter + a colour that is stable per project id. */
export function projectInitial(title: string): string {
  return (title.trim()[0] ?? '?').toUpperCase()
}

export function projectColor(id: number): string {
  return projectColors[Math.abs(id) % projectColors.length]
}

export const projectStatuses: { value: ProjectStatus; label: string }[] = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
]

export function statusLabel(status: ProjectStatus): string {
  return projectStatuses.find((s) => s.value === status)?.label ?? status
}
