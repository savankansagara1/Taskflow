/**
 * Tiny utility to join class names conditionally (avoids adding clsx/classnames dep).
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

