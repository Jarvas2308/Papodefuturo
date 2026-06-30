import { Check } from 'lucide-react'
import { cn } from '../../../lib/cn'
import type { PortfolioFilter, PortfolioFilterOption } from '../types'

type PositionFiltersProps = {
  filters: PortfolioFilterOption[]
  activeFilter: PortfolioFilter
  onFilterChange: (filter: PortfolioFilter) => void
}

export function PositionFilters({
  filters,
  activeFilter,
  onFilterChange,
}: PositionFiltersProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Filtrar posições por categoria"
    >
      {filters.map((filter) => {
        const isActive = filter.id === activeFilter

        return (
          <button
            key={filter.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onFilterChange(filter.id)}
            className={cn(
              'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition outline-none',
              'focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2',
              isActive
                ? 'border-[var(--color-brand)] bg-[var(--color-brand)] text-white shadow-[var(--shadow-soft)]'
                : 'border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]'
            )}
          >
            {isActive ? <Check className="size-4" aria-hidden="true" /> : null}
            {filter.label}
          </button>
        )
      })}
    </div>
  )
}
