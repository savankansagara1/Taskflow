import { cn } from '@/utils/cn'
import type { TaskStatus, TaskPriority } from '@/types/api'

// ── Status Badge ──────────────────────────────────────────────────────
interface StatusBadgeProps {
  status: TaskStatus | string
  className?: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  TODO: {
    label: 'To Do',
    className: 'bg-surface-container-high text-on-surface',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'bg-surface-container-highest text-primary',
  },
  DONE: {
    label: 'Done',
    className: 'bg-primary text-on-primary',
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    className: 'bg-surface-container text-on-surface',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full font-sans text-label-sm whitespace-nowrap',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}

// ── Priority Indicator ────────────────────────────────────────────────
interface PriorityBadgeProps {
  priority: TaskPriority | string
  className?: string
}

const priorityConfig: Record<string, { label: string; icon: string; className: string }> = {
  HIGH: {
    label: 'High',
    icon: 'keyboard_double_arrow_up',
    className: 'text-primary',
  },
  MEDIUM: {
    label: 'Medium',
    icon: 'keyboard_arrow_up',
    className: 'text-secondary',
  },
  LOW: {
    label: 'Low',
    icon: 'keyboard_arrow_down',
    className: 'text-outline',
  },
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority] ?? {
    label: priority,
    icon: 'remove',
    className: 'text-secondary',
  }

  return (
    <span className={cn('inline-flex items-center gap-1', config.className, className)}>
      <span
        className="material-symbols-outlined text-[16px] fill"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {config.icon}
      </span>
      <span className="font-sans text-body-md">{config.label}</span>
    </span>
  )
}

// ── Task ID Badge (monospaced) ─────────────────────────────────────────
interface TaskIdBadgeProps {
  taskId: number
  className?: string
}

export function TaskIdBadge({ taskId, className }: TaskIdBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded font-mono text-code',
        'bg-surface-container-high text-on-surface border border-outline-variant',
        className
      )}
    >
      TF-{taskId}
    </span>
  )
}

