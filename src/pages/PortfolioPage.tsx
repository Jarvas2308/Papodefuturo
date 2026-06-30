import { PortfolioAllocation } from '../features/portfolio/components/PortfolioAllocation'
import { PortfolioHeader } from '../features/portfolio/components/PortfolioHeader'
import { PortfolioPositions } from '../features/portfolio/components/PortfolioPositions'
import { PortfolioSummaryCard } from '../features/portfolio/components/PortfolioSummaryCard'
import { portfolioMock } from '../mocks/portfolio'

export function PortfolioPage() {
  return (
    <section className="space-y-6">
      <PortfolioHeader
        disclaimer={portfolioMock.disclaimer}
        header={portfolioMock.header}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {portfolioMock.summary.map((item) => (
          <PortfolioSummaryCard key={item.id} item={item} />
        ))}
      </div>

      <PortfolioAllocation allocation={portfolioMock.allocation} />
      <PortfolioPositions positions={portfolioMock.positions} />
    </section>
  )
}
