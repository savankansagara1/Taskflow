import { cn } from '@/utils/cn'
import { getInitials } from '@/utils/format'

interface AvatarProps {
  name: string
  size?: 'xs' | 'sm' | 'md'
  className?: string
}

const sizeClasses = {
  xs: 'w-5 h-5 text-[9px]',
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-label-sm',
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center font-sans font-semibold text-primary uppercase select-none shrink-0',
        sizeClasses[size],
        className
      )}
      title={name}
    >
      {getInitials(name)}
    </div>
  )
}

// ── Stacked avatars (member stack shown in Projects table) ────────────
interface AvatarStackProps {
  names: string[]
  max?: number
  size?: 'xs' | 'sm' | 'md'
}

export function AvatarStack({ names, max = 3, size = 'sm' }: AvatarStackProps) {
  const visible = names.slice(0, max)
  const overflow = names.length - max

  return (
    <div className="flex -space-x-2">
      {visible.map((name, i) => (
        <Avatar
          key={i}
          name={name}
          size={size}
          className="border-surface-container-lowest"
        />
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            'rounded-full bg-surface-container-high border border-surface-container-lowest flex items-center justify-center font-sans font-semibold text-primary',
            sizeClasses[size]
          )}
          title={`${overflow} more`}
        >
          +{overflow}
        </div>
      )}
    </div>
  )
}

