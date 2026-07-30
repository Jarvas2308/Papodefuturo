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
        <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5 text-sm text-[var(--color-text-muted)]">
          Sua estratégia possui posição internacional confirmada. Aguardando a
          próxima atualização automática da cotação USD/BRL para calcular
          posições em BRL.
        </p>
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

      {/*
        Sem `key` derivada do conteúdo: `saveStrategy` atualiza a estratégia do
        hook, e uma key por conteúdo remontava o editor exatamente no instante
        do salvamento, descartando o estado local — inclusive a mensagem
        "Estratégia salva com sucesso na sua conta", que nunca chegava a
        aparecer. O editor já é montado depois do carregamento (as guardas de
        `loading` e de estratégia nula estão acima) e mantém a própria cópia
        aplicada a partir daí.
      */}
      <StrategyEditor
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
