import { Check, CheckCircle2 } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
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
  onConfirmPurchases?: () => void
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

function formatBasisPoints(value: number) {
  return `${(value / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} p.p.`
}

const stopReasonMessages = {
  'zero-contribution':
    'Informe um valor de aporte para montar o plano técnico.',
  'budget-exhausted': 'O valor disponível foi integralmente distribuído.',
  'no-affordable-unit':
    'O saldo restante não compra uma unidade dos ativos elegíveis.',
  'no-improving-purchase':
    'Nenhuma nova unidade reduziria o desvio total da carteira.',
} as const

export function ContributionResult({
  onConfirmPurchases,
  positions,
  result,
  strategy,
}: ContributionResultProps) {
  const positionsById = new Map(
    positions.map((position) => [position.id, position])
  )
  const isTargetAllocation = result.strategy === 'target-allocation'
  const technicalItemsById = new Map(
    isTargetAllocation
      ? result.technicalImpact.items.map((item) => [item.assetId, item])
      : []
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
              {isTargetAllocation
                ? 'Plano técnico multiativos'
                : 'Simulação concluída'}
            </h2>
            <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
              {strategy === 'target-allocation'
                ? 'Compras unitárias selecionadas somente quando reduzem o desvio total para as metas globais.'
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
        {isTargetAllocation ? (
          <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryMetric
              label="Desvio antes"
              value={formatBasisPoints(
                result.technicalImpact.totalDeviationBeforeInBasisPoints
              )}
            />
            <SummaryMetric
              label="Desvio depois"
              value={formatBasisPoints(
                result.technicalImpact.totalDeviationAfterInBasisPoints
              )}
            />
            <SummaryMetric
              label="Redução técnica"
              tone="positive"
              value={formatBasisPoints(
                result.technicalImpact.totalDeviationReductionInBasisPoints
              )}
            />
            <SummaryMetric
              label="Saldo não alocado"
              value={formatCents(result.saldoNaoAlocadoEmCentavos)}
            />
          </div>
        ) : null}

        {result.distribuicao.length === 0 && isTargetAllocation ? (
          <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm leading-6 text-[var(--color-text-muted)]">
            {stopReasonMessages[result.technicalImpact.stopReason]}
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {result.distribuicao.map((distribution) => {
              const position = positionsById.get(distribution.assetId)
              const technicalItem = technicalItemsById.get(distribution.assetId)

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
                    {technicalItem ? (
                      <dl className="mt-4 grid gap-2 text-sm text-[var(--color-text-muted)]">
                        <TechnicalMetric
                          label="Quantidade sugerida"
                          value={String(technicalItem.suggestedQuantity)}
                        />
                        <TechnicalMetric
                          label="Preço unitário de referência"
                          value={formatCents(technicalItem.unitPriceInCents)}
                        />
                        <TechnicalMetric
                          label="Dif. antes"
                          value={formatBasisPoints(
                            technicalItem.differenceBeforeInBasisPoints
                          )}
                        />
                        <TechnicalMetric
                          label="Dif. depois"
                          value={formatBasisPoints(
                            technicalItem.differenceAfterInBasisPoints
                          )}
                        />
                      </dl>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {isTargetAllocation && result.distribuicao.length > 0 ? (
          <p className="mt-4 text-sm text-[var(--color-text-muted)]">
            {stopReasonMessages[result.technicalImpact.stopReason]}
          </p>
        ) : null}

        <p className="mt-5 text-xs leading-5 text-[var(--color-text-muted)]">
          A simulação é um plano técnico determinístico, não uma recomendação
          financeira. Ela não executa ordens nem movimenta valores. Registre
          apenas os fatos das compras que você realmente realizou.
        </p>
        {onConfirmPurchases && result.distribuicao.length > 0 ? (
          <Button
            className="mt-5"
            variant="secondary"
            onClick={onConfirmPurchases}
          >
            Confirmar compras realizadas
          </Button>
        ) : null}
      </div>
    </Card>
  )
}

function SummaryMetric({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'positive'
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
        {label}
      </p>
      <p
        className={`mt-2 text-lg font-semibold ${
          tone === 'positive'
            ? 'text-[var(--color-positive)]'
            : 'text-[var(--color-text)]'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function TechnicalMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt>{label}</dt>
      <dd className="text-right font-semibold text-[var(--color-text)]">
        {value}
      </dd>
    </div>
  )
}
