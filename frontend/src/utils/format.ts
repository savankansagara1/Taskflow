import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from 'date-fns'

/**
 * Format a date string for display (e.g. "Oct 24, 2023")
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy')
  } catch {
    return dateStr
  }
}

/**
 * Format a relative timestamp (e.g. "2 hours ago")
 */
export function formatRelative(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true })
  } catch {
    return dateStr
  }
}

/**
 * Format a due date with special labels for today/tomorrow
 */
export function formatDueDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const date = parseISO(dateStr)
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'MMM d, yyyy')
  } catch {
    return dateStr
  }
}

/**
 * Check if a task is overdue
 */
export function isOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false
  try {
    return parseISO(dateStr) < new Date()
  } catch {
    return false
  }
}

/**
 * Generate a synthetic task key from project_id and task_id (e.g. TF-42)
 */
export function getTaskKey(taskId: number): string {
  return `TF-${taskId}`
}

/**
 * Get initials from a username
 */
export function getInitials(name: string): string {
  return name
    .split(/[\s._-]+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * Truncate text with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 1) + '…'
}

