import { Check, CheckCircle2 } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import type { PortfolioPosition } from '../../portfolio/types'
import type {
  ContributionResult as ContributionResultData,
  ContributionStrategyType,
} from '../types'

type ResultPosition = Pick<
  PortfolioPosition,
  'id' | 'ticker' | 'name' | 'categoryLabel'
>

type ContributionResultProps = {
  positions: ResultPosition[]
  result: ContributionResultData
  strategy: ContributionStrategyType
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function formatCents(valueInCents: number) {
  return currencyFormatter.format(valueInCents / 100)
}

export function ContributionResult({
  positions,
  result,
  strategy,
}: ContributionResultProps) {
  const positionsById = new Map(
    positions.map((position) => [position.id, position])
  )

  return (
    <Card
      className="overflow-hidden p-0"
      aria-live="polite"
      aria-labelledby="contribution-result-title"
    >
      <div className="flex flex-col gap-4 border-b border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-positive)_8%,white)] px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--color-positive)_14%,white)] text-[var(--color-positive)]">
            <CheckCircle2 className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="contribution-result-title"
              className="text-xl font-semibold text-[var(--color-text)]"
            >
              Simulação concluída
            </h2>
            <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
              {strategy === 'target-allocation'
                ? 'Distribuição calculada pelos déficits das categorias monitoradas.'
                : 'Distribuição proporcional calculada pelo peso atual das posições.'}
            </p>
          </div>
        </div>
        <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--color-positive)] shadow-[var(--shadow-soft)]">
          <Check className="mr-1.5 inline size-4" aria-hidden="true" />
          Total validado: {formatCents(result.totalDistribuidoEmCentavos)}
        </div>
      </div>

      <div className="px-6 py-6 sm:px-7">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {result.distribuicao.map((distribution) => {
            const position = positionsById.get(distribution.assetId)

            return (
              <article
                key={distribution.assetId}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-semibold text-[var(--color-text)]">
                      {position?.ticker ?? distribution.assetId}
                    </p>
                    <p className="mt-1 truncate text-sm text-[var(--color-text-muted)]">
                      {position?.name ?? 'Ativo da carteira'}
                    </p>
                  </div>
                  <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
                    {position?.categoryLabel ?? 'Carteira'}
                  </span>
                </div>
                <div className="mt-6 border-t border-[var(--color-border)] pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                    Valor alocado
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-brand-strong)]">
                    {formatCents(distribution.valorEmCentavos)}
                  </p>
                </div>
              </article>
            )
          })}
        </div>

        <p className="mt-5 text-xs leading-5 text-[var(--color-text-muted)]">
          A simulação não executa ordens nem movimenta valores. Registre as
          compras realizadas no Histórico para atualizar a carteira real.
        </p>
      </div>
    </Card>
  )
}
