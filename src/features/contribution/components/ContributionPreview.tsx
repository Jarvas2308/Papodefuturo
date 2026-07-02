import { BadgeInfo, CircleGauge, DatabaseZap, Target } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import type { AllocationTarget, ContributionStrategyType } from '../types'

type ContributionPreviewProps = {
  positionCount: number
  strategy: ContributionStrategyType
  targets: AllocationTarget[]
}

const categoryLabels = {
  'brazilian-stocks': 'Ações brasileiras',
  'real-estate-funds': 'Fundos imobiliários',
  international: 'Internacional',
}

export function ContributionPreview({
  positionCount,
  strategy,
  targets,
}: ContributionPreviewProps) {
  const isTargetAllocation = strategy === 'target-allocation'

  return (
    <Card className="h-full overflow-hidden p-0">
      <div className="bg-[var(--color-brand-subtle)] px-6 py-6 sm:px-7">
        <span className="inline-flex items-center gap-2 rounded-full border border-[color:color-mix(in_srgb,var(--color-brand)_25%,white)] bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-strong)]">
          <BadgeInfo className="size-3.5" aria-hidden="true" />
          Simulação demonstrativa
        </span>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight text-[var(--color-text)]">
          Uma prévia antes de qualquer decisão
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
          {isTargetAllocation
            ? 'A simulação por déficit de categoria prioriza apenas categorias abaixo das metas monitoradas.'
            : 'A simulação proporcional usa o peso atual de cada posição para montar uma distribuição transparente.'}
        </p>
      </div>

      <div className="space-y-5 px-6 py-6 sm:px-7">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
            <CircleGauge
              className="size-5 text-[var(--color-brand-strong)]"
              aria-hidden="true"
            />
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              Estratégia
            </p>
            <p className="mt-1 font-semibold text-[var(--color-text)]">
              {isTargetAllocation
                ? 'Déficit por categoria — demonstrativa'
                : 'Proporcional demonstrativa'}
            </p>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
            <DatabaseZap
              className="size-5 text-[var(--color-brand-strong)]"
              aria-hidden="true"
            />
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              Base atual
            </p>
            <p className="mt-1 font-semibold text-[var(--color-text)]">
              {positionCount} posições simuladas
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <Target
              className="size-4 text-[var(--color-brand-strong)]"
              aria-hidden="true"
            />
            <h3 className="text-sm font-semibold text-[var(--color-text)]">
              Metas disponíveis no contexto
            </h3>
          </div>
          <ul className="mt-3 space-y-2">
            {targets.map((target) => (
              <li
                key={target.category}
                className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-3 text-sm"
              >
                <span className="text-[var(--color-text-muted)]">
                  {categoryLabels[target.category]}
                </span>
                <span className="font-semibold text-[var(--color-text)]">
                  {target.targetPercentage.toLocaleString('pt-BR')}%
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-5 text-[var(--color-text-muted)]">
            {isTargetAllocation
              ? 'Somente déficits positivos de categoria são elegíveis; isto não representa recomendação de ativos.'
              : 'As metas ficam visíveis como contexto; esta estratégia usa somente a proporção atual da carteira.'}
          </p>
        </div>
      </div>
    </Card>
  )
}
