import { DatabaseZap } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import type {
  HistoryFilters as HistoryFiltersState,
  HistoryMovement,
} from '../types'
import { HistoryCards } from './HistoryCards'
import { HistoryEmptyState } from './HistoryEmptyState'
import { HistoryFilters } from './HistoryFilters'
import { HistoryTable } from './HistoryTable'

type HistoryPanelProps = {
  movements: HistoryMovement[]
  filters: HistoryFiltersState
  months: string[]
  onFiltersChange: (filters: HistoryFiltersState) => void
  onClear: () => void
}

export function HistoryPanel({
  movements,
  filters,
  months,
  onFiltersChange,
  onClear,
}: HistoryPanelProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-text)]">
              Movimentações
            </h2>
            <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
              Consulte compras, vendas e proventos simulados da carteira.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--color-brand-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--color-brand-strong)]">
            <DatabaseZap className="size-3.5" aria-hidden="true" />
            Sem persistência real
          </span>
        </div>
        <div className="mt-5">
          <HistoryFilters
            filters={filters}
            months={months}
            onChange={onFiltersChange}
            onClear={onClear}
          />
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {movements.length > 0 ? (
          <>
            <p
              className="mb-4 text-sm text-[var(--color-text-muted)]"
              aria-live="polite"
            >
              {movements.length}{' '}
              {movements.length === 1
                ? 'movimentação encontrada'
                : 'movimentações encontradas'}
            </p>
            <HistoryTable movements={movements} />
            <HistoryCards movements={movements} />
          </>
        ) : (
          <HistoryEmptyState onClear={onClear} />
        )}
      </div>
    </Card>
  )
}
