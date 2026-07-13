import { useMemo, useState } from 'react'
import { HistoryPanel } from '../features/history/components/HistoryPanel'
import { PurchaseForm } from '../features/history/components/PurchaseForm'
import { HistorySummaryCards } from '../features/history/components/HistorySummaryCards'
import type { HistoryFilters } from '../features/history/types'
import { useHistoryData } from '../features/history/useHistoryData'
import {
  calculateHistorySummary,
  emptyHistoryFilters,
  filterHistoryMovements,
} from '../features/history/utils/history'

export function HistoryPage() {
  const historyData = useHistoryData()
  const [filters, setFilters] = useState<HistoryFilters>(emptyHistoryFilters)
  const historySummary = useMemo(
    () => calculateHistorySummary(historyData.movements),
    [historyData.movements]
  )
  const historyMonths = useMemo(
    () =>
      Array.from(
        new Set(
          historyData.movements.map((movement) => movement.date.slice(0, 7))
        )
      ).sort((a, b) => b.localeCompare(a)),
    [historyData.movements]
  )
  const filteredMovements = useMemo(
    () => filterHistoryMovements(historyData.movements, filters),
    [filters, historyData.movements]
  )

  function clearFilters() {
    setFilters({ ...emptyHistoryFilters })
  }

  if (historyData.status === 'loading') {
    return (
      <section className="space-y-6">
        <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5 text-sm text-[var(--color-text-muted)]">
          Carregando seu histórico...
        </p>
      </section>
    )
  }

  if (historyData.status === 'error') {
    return (
      <section className="space-y-6">
        <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5 text-sm font-medium text-[var(--color-text)]">
          {historyData.error ?? 'Não foi possível carregar o histórico.'}
        </p>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      {!historyData.isDemo ? (
        <PurchaseForm
          assets={historyData.assets}
          onSave={historyData.createPurchase}
        />
      ) : null}

      <HistorySummaryCards summary={historySummary} />
      <HistoryPanel
        movements={filteredMovements}
        filters={filters}
        months={historyMonths}
        onFiltersChange={setFilters}
        onClear={clearFilters}
      />
    </section>
  )
}
