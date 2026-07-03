import { RotateCcw, Search } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import type { HistoryFilters as HistoryFiltersState } from '../types'
import {
  historyCategoryLabels,
  historyStatusLabels,
  historyTypeLabels,
} from '../utils/historyLabels'

type HistoryFiltersProps = {
  filters: HistoryFiltersState
  months: string[]
  onChange: (filters: HistoryFiltersState) => void
  onClear: () => void
}

const selectClassName =
  'min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]'

function formatMonth(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, monthNumber - 1, 1)))
}

export function HistoryFilters({
  filters,
  months,
  onChange,
  onClear,
}: HistoryFiltersProps) {
  function updateFilter<Key extends keyof HistoryFiltersState>(
    key: Key,
    value: HistoryFiltersState[Key]
  ) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(15rem,1.4fr)_repeat(4,minmax(8.5rem,1fr))_auto] lg:items-end">
      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          Buscar ativo
        </span>
        <span className="relative block">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={filters.query}
            onChange={(event) => updateFilter('query', event.target.value)}
            placeholder="Ticker ou nome"
            className={`${selectClassName} pl-10`}
          />
        </span>
      </label>
      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          Movimentação
        </span>
        <select
          value={filters.type}
          onChange={(event) =>
            updateFilter(
              'type',
              event.target.value as HistoryFiltersState['type']
            )
          }
          className={selectClassName}
        >
          <option value="all">Todas</option>
          {Object.entries(historyTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          Categoria
        </span>
        <select
          value={filters.category}
          onChange={(event) =>
            updateFilter(
              'category',
              event.target.value as HistoryFiltersState['category']
            )
          }
          className={selectClassName}
        >
          <option value="all">Todas</option>
          {Object.entries(historyCategoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          Período
        </span>
        <select
          value={filters.month}
          onChange={(event) => updateFilter('month', event.target.value)}
          className={selectClassName}
        >
          <option value="all">Todos os meses</option>
          {months.map((month) => (
            <option key={month} value={month}>
              {formatMonth(month)}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          Status
        </span>
        <select
          value={filters.status}
          onChange={(event) =>
            updateFilter(
              'status',
              event.target.value as HistoryFiltersState['status']
            )
          }
          className={selectClassName}
        >
          <option value="all">Todos</option>
          {Object.entries(historyStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <Button
        variant="secondary"
        onClick={onClear}
        className="min-h-11 whitespace-nowrap"
      >
        <RotateCcw className="size-4" aria-hidden="true" /> Limpar
      </Button>
    </div>
  )
}
