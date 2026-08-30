import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface Option {
  value: string | number
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options?: Option[]
  containerClassName?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, containerClassName, className, id, children, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={cn('flex flex-col gap-unit', containerClassName)}>
        {label && (
          <label htmlFor={selectId} className="font-sans text-label-md font-medium text-on-surface">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full h-10 pl-3 pr-8 bg-surface-container-lowest rounded border transition-colors outline-none appearance-none',
              'font-sans text-body-md text-on-surface',
              error
                ? 'border-error focus:border-error focus:shadow-[0_0_0_1px_#ba1a1a]'
                : 'border-outline-variant input-focus',
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <span className="material-symbols-outlined text-[18px] text-secondary pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
            expand_more
          </span>
        </div>
        {error && <p className="font-sans text-label-sm text-error">{error}</p>}
        {helperText && !error && (
          <p className="font-sans text-label-sm text-secondary">{helperText}</p>
        )}
      </div>
    )
  }
)
Select.displayName = 'Select'

export default Select

