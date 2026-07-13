import { Card } from '../components/ui/Card'
import { PortfolioAllocation } from '../features/portfolio/components/PortfolioAllocation'
import { PortfolioHeader } from '../features/portfolio/components/PortfolioHeader'
import { PortfolioPositions } from '../features/portfolio/components/PortfolioPositions'
import { PortfolioSummaryCard } from '../features/portfolio/components/PortfolioSummaryCard'
import { usePortfolioData } from '../features/portfolio/usePortfolioData'

export function PortfolioPage() {
  const { data, status, error } = usePortfolioData()

  if (status === 'error') {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          Não foi possível carregar a carteira
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          {error ?? 'Tente novamente após atualizar a página.'}
        </p>
      </Card>
    )
  }

  if (status === 'loading' || !data) {
    return (
      <Card>
        <p
          role="status"
          className="text-sm text-[var(--color-text-muted)]"
        >
          Carregando sua carteira...
        </p>
      </Card>
    )
  }

  return (
    <section className="space-y-6">
      <PortfolioHeader disclaimer={data.disclaimer} header={data.header} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.summary.map((item) => (
          <PortfolioSummaryCard key={item.id} item={item} />
        ))}
      </div>

      <PortfolioAllocation allocation={data.allocation} />
      <PortfolioPositions positions={data.positions} />
    </section>
  )
}
