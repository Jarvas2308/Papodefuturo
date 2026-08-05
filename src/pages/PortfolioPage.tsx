import { Card } from '../components/ui/Card'
import { PortfolioAllocation } from '../features/portfolio/components/PortfolioAllocation'
import { PortfolioHeader } from '../features/portfolio/components/PortfolioHeader'
import { PortfolioPositions } from '../features/portfolio/components/PortfolioPositions'
import { PortfolioSummaryCard } from '../features/portfolio/components/PortfolioSummaryCard'
import { usePortfolioData } from '../features/portfolio/usePortfolioData'

export function PortfolioPage() {
  const {
    data,
    status,
    error,
    needsExchangeRate,
    latestUsdBrlRate,
    marketDataWarning,
    stalePrices,
  } = usePortfolioData()

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

  if (status === 'loading') {
    return (
      <Card>
        <p role="status" className="text-sm text-[var(--color-text-muted)]">
          Carregando sua carteira...
        </p>
      </Card>
    )
  }

  if (needsExchangeRate) {
    return (
      <Card>
        <p role="status" className="text-sm text-[var(--color-text-muted)]">
          Sua carteira possui posição internacional confirmada. Aguardando a
          próxima atualização automática da cotação USD/BRL para calcular
          patrimônio, rentabilidade e participações em BRL.
        </p>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  return (
    <section className="space-y-6">
      <PortfolioHeader disclaimer={data.disclaimer} header={data.header} />

      {marketDataWarning ? (
        <p
          role="status"
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-muted)]"
        >
          {marketDataWarning}
        </p>
      ) : null}

      {stalePrices.length > 0 ? (
        <p
          role="status"
          className="rounded-[var(--radius-md)] border border-[color:color-mix(in_srgb,var(--color-alert)_35%,var(--color-border))] bg-[color:color-mix(in_srgb,var(--color-alert)_6%,white)] px-4 py-3 text-sm text-[var(--color-text)]"
        >
          Cotação desatualizada para{' '}
          {stalePrices.map((item) => item.ticker).join(', ')}
          {' — '}
          {stalePrices.length === 1
            ? `${stalePrices[0]!.daysStale} dias sem atualização automática.`
            : 'sem atualização automática há vários dias.'}{' '}
          Valores exibidos usam o último preço disponível.
        </p>
      ) : null}

      {latestUsdBrlRate ? (
        <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
          Posições internacionais convertidas para BRL pela taxa USD/BRL salva
          em {new Date(latestUsdBrlRate.pricedAt).toLocaleString('pt-BR')}.
        </p>
      ) : null}

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
