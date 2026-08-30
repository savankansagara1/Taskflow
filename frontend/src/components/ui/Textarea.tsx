import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  containerClassName?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, containerClassName, className, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={cn('flex flex-col gap-unit', containerClassName)}>
        {label && (
          <label htmlFor={textareaId} className="font-sans text-label-md font-medium text-on-surface">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full p-3 bg-surface-container-lowest rounded border transition-colors outline-none',
            'font-sans text-body-md text-on-surface placeholder:text-secondary',
            'resize-y min-h-[80px]',
            error
              ? 'border-error focus:border-error focus:shadow-[0_0_0_1px_#ba1a1a]'
              : 'border-outline-variant input-focus',
            className
          )}
          {...props}
        />
        {error && <p className="font-sans text-label-sm text-error">{error}</p>}
        {helperText && !error && (
          <p className="font-sans text-label-sm text-secondary">{helperText}</p>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export default Textarea

