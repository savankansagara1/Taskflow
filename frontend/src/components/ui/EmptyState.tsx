import Button from './Button'
import { cn } from '@/utils/cn'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export default function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-8',
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center text-secondary mb-4">
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>
      <h3 className="font-sans text-headline-sm font-medium text-primary mb-2">{title}</h3>
      {description && (
        <p className="font-sans text-body-md text-secondary max-w-xs mb-6">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} size="md">
          {action.label}
        </Button>
      )}
    </div>
  )
}

