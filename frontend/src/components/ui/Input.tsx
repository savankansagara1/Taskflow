import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  rightElement?: React.ReactNode
  containerClassName?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, rightElement, containerClassName, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={cn('flex flex-col gap-unit', containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="font-sans text-label-md font-medium text-on-surface">
            {label}
          </label>
        )}
        <div
          className={cn(
            'relative flex items-center',
            'border rounded bg-surface-container-lowest transition-colors',
            error
              ? 'border-error focus-within:border-error focus-within:shadow-[0_0_0_1px_#ba1a1a]'
              : 'border-outline-variant input-ring-focus'
          )}
        >
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'flex-1 h-10 px-3 bg-transparent border-none outline-none',
              'font-sans text-body-md text-on-surface placeholder:text-secondary',
              'focus:ring-0',
              rightElement ? 'pr-10' : undefined,
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-0 inset-y-0 flex items-center pr-3">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p className="font-sans text-label-sm text-error">{error}</p>
        )}
        {helperText && !error && (
          <p className="font-sans text-label-sm text-secondary">{helperText}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

// ── Password Input with toggle ────────────────────────────────────────
interface PasswordInputProps extends Omit<InputProps, 'type' | 'rightElement'> {}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>((props, ref) => {
  const [visible, setVisible] = useState(false)

  return (
    <Input
      ref={ref}
      type={visible ? 'text' : 'password'}
      rightElement={
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="text-secondary hover:text-primary transition-colors focus:outline-none"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          <span className="material-symbols-outlined text-[18px]">
            {visible ? 'visibility_off' : 'visibility'}
          </span>
        </button>
      }
      {...props}
    />
  )
})
PasswordInput.displayName = 'PasswordInput'

export default Input
