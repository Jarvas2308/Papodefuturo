import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'default' | 'icon'
  children: ReactNode
}

export function Button({
  className,
  variant = 'primary',
  size = 'default',
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border text-sm font-semibold transition-all outline-none',
        'focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' &&
          'border-[var(--color-brand)] bg-[var(--color-brand)] px-4 py-2.5 text-white shadow-[var(--shadow-soft)] hover:bg-[var(--color-brand-strong)]',
        variant === 'secondary' &&
          'border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2.5 text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]',
        variant === 'ghost' &&
          'border-transparent bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]',
        size === 'icon' && 'size-10 px-0 py-0',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
