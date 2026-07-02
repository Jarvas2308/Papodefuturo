import { useState } from 'react'
import { HistoryPanel } from '../features/history/components/HistoryPanel'
import { HistorySummaryCards } from '../features/history/components/HistorySummaryCards'
import { historyMovements } from '../features/history/mocks/historyMock'
import type { HistoryFilters } from '../features/history/types'
import {
  calculateHistorySummary,
  emptyHistoryFilters,
  filterHistoryMovements,
} from '../features/history/utils/history'

const historySummary = calculateHistorySummary(historyMovements)
const historyMonths = Array.from(
  new Set(historyMovements.map((movement) => movement.date.slice(0, 7)))
).sort((a, b) => b.localeCompare(a))

export function HistoryPage() {
  const [filters, setFilters] = useState<HistoryFilters>(emptyHistoryFilters)
  const filteredMovements = filterHistoryMovements(historyMovements, filters)

  function clearFilters() {
    setFilters({ ...emptyHistoryFilters })
  }

  return (
    <section className="space-y-6">
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
