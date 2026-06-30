import { useState } from 'react'
import { Card } from '../../../components/ui/Card'
import type { PortfolioFilter, PortfolioMock } from '../types'
import { PositionCards } from './PositionCards'
import { PositionFilters } from './PositionFilters'
import { PositionsTable } from './PositionsTable'

type PortfolioPositionsProps = {
  positions: PortfolioMock['positions']
}

export function PortfolioPositions({ positions }: PortfolioPositionsProps) {
  const [activeFilter, setActiveFilter] = useState<PortfolioFilter>('all')
  const filteredPositions =
    activeFilter === 'all'
      ? positions.items
      : positions.items.filter((position) => position.category === activeFilter)

  return (
    <Card className="overflow-hidden p-0">
      <div className="space-y-6 px-5 py-6 sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-text)]">
              {positions.title}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
              {positions.description}
            </p>
          </div>

          <PositionFilters
            filters={positions.filters}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </div>

        <p
          className="text-sm font-medium text-[var(--color-text-muted)]"
          aria-live="polite"
        >
          {filteredPositions.length}{' '}
          {filteredPositions.length === 1 ? 'ativo exibido' : 'ativos exibidos'}
        </p>

        <PositionsTable positions={filteredPositions} />
        <PositionCards positions={filteredPositions} />
      </div>
    </Card>
  )
}
