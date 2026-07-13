import { ExchangeRateSetup } from '../features/strategy/components/ExchangeRateSetup'
import { StrategyEditor } from '../features/strategy/components/StrategyEditor'
import { useStrategyData } from '../features/strategy/useStrategyData'

export function StrategyPage() {
  const strategyData = useStrategyData()

  if (strategyData.status === 'loading') {
    return (
      <section className="space-y-6">
        <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5 text-sm text-[var(--color-text-muted)]">
          Carregando sua estratégia...
        </p>
      </section>
    )
  }

  if (strategyData.status === 'error') {
    return (
      <section className="space-y-6">
        <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5 text-sm font-medium text-[var(--color-text)]">
          {strategyData.error ?? 'Não foi possível carregar a estratégia.'}
        </p>
      </section>
    )
  }

  if (strategyData.needsExchangeRate) {
    return (
      <section className="space-y-6">
        <ExchangeRateSetup onSave={strategyData.saveManualUsdBrl} />
      </section>
    )
  }

  if (!strategyData.strategy || !strategyData.defaultStrategy) {
    return null
  }

  return (
    <section className="space-y-6">
      {strategyData.latestUsdBrlRate ? (
        <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
          Posições internacionais convertidas para BRL pela última cotação
          USD/BRL salva em{' '}
          {new Date(strategyData.latestUsdBrlRate.pricedAt).toLocaleString(
            'pt-BR'
          )}
          .
        </p>
      ) : null}

      <StrategyEditor
        key={JSON.stringify(strategyData.strategy)}
        initialStrategy={strategyData.strategy}
        defaultStrategy={strategyData.defaultStrategy}
        positions={strategyData.positions}
        isDemo={strategyData.isDemo}
        onSave={strategyData.saveStrategy}
      />

      <p className="text-xs leading-5 text-[var(--color-text-muted)]">
        Esta visualização não classifica ativos como bons ou ruins e não
        representa recomendação, plano de compra ou execução financeira.
      </p>
    </section>
  )
}
