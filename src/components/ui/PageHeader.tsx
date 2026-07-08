import { cn } from '../../lib/cn'

type PageHeaderProps = {
  title: string
  description: string
  compact?: boolean
}

export function PageHeader({
  title,
  description,
  compact = false,
}: PageHeaderProps) {
  return (
    <div className={cn('min-w-0', compact ? 'space-y-1' : 'space-y-2')}>
      <h1
        className={cn(
          'font-semibold tracking-tight text-[var(--color-text)]',
          compact ? 'truncate text-lg sm:text-xl' : 'text-3xl'
        )}
      >
        {title}
      </h1>
      <p
        className={cn(
          'max-w-3xl text-[var(--color-text-muted)]',
          compact
            ? 'line-clamp-2 text-sm leading-5 sm:line-clamp-1 sm:text-base sm:leading-normal'
            : 'text-base leading-7'
        )}
      >
        {description}
      </p>
    </div>
  )
}
