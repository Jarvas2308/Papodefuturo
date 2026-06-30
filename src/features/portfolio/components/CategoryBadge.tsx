import { cn } from '../../../lib/cn'
import type { PortfolioCategory } from '../types'

type CategoryBadgeProps = {
  category: PortfolioCategory
  label: string
}

export function CategoryBadge({ category, label }: CategoryBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold',
        category === 'brazilian-stocks' &&
          'border-[color:color-mix(in_srgb,var(--color-brand)_24%,white)] bg-[var(--color-brand-subtle)] text-[var(--color-brand-strong)]',
        category === 'real-estate-funds' &&
          'border-[color:color-mix(in_srgb,var(--color-positive)_24%,white)] bg-[color:color-mix(in_srgb,var(--color-positive)_10%,white)] text-[var(--color-positive)]',
        category === 'international' &&
          'border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] text-[var(--color-text)]'
      )}
    >
      {label}
    </span>
  )
}
