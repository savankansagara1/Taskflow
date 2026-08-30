import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: string  // Material Symbol name
  iconPosition?: 'left' | 'right'
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary text-on-primary hover:bg-inverse-surface active:scale-[0.98] disabled:opacity-50',
  secondary:
    'bg-surface-container-lowest border border-outline-variant text-primary hover:bg-surface-container-low active:scale-[0.98] disabled:opacity-50',
  ghost:
    'text-secondary hover:text-primary hover:bg-surface-container-high active:scale-[0.98] disabled:opacity-50',
  danger:
    'bg-error text-on-error hover:opacity-90 active:scale-[0.98] disabled:opacity-50',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-label-sm gap-1.5',
  md: 'h-10 px-4 text-label-md gap-2',
  lg: 'h-11 px-5 text-label-md gap-2',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-sans font-medium rounded transition-all focus:outline-none',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span className="material-symbols-outlined text-[18px]">{icon}</span>
            )}
            {children}
            {icon && iconPosition === 'right' && (
              <span className="material-symbols-outlined text-[18px]">{icon}</span>
            )}
          </>
        )}
      </button>
    )
  }
)
Button.displayName = 'Button'

export default Button

