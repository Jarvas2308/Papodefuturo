import { CheckCircle2, Layers3, ListChecks, Scale } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import type { StrategyCategoryAllocation, StrategyValidation } from '../types'
import { countAssets, formatBasisPoints } from '../utils/strategy'

type StrategySummaryCardsProps = {
  allocations: StrategyCategoryAllocation[]
  validation: StrategyValidation
}

export function StrategySummaryCards({
  allocations,
  validation,
}: StrategySummaryCardsProps) {
  const outsideTolerance = allocations.filter(
    (category) => category.status !== 'near'
  ).length
  const cards = [
    {
      label: 'Situação da estratégia',
      value: validation.isValid ? 'Válida' : 'Inválida',
      helper: validation.isValid
        ? 'Todos os totais fecham em 100%'
        : 'Revise as metas antes de aplicar',
      icon: CheckCircle2,
    },
    {
      label: 'Categorias',
      value: String(allocations.length),
      helper: `${outsideTolerance} fora da tolerância de ±0,50 p.p.`,
      icon: Layers3,
    },
    {
      label: 'Ativos monitorados',
      value: String(countAssets(allocations)),
      helper: 'Mesmos ativos da carteira demonstrativa',
      icon: ListChecks,
    },
    {
      label: 'Total das metas',
      value: formatBasisPoints(validation.categoryTotalInBasisPoints),
      helper: 'Meta consolidada das categorias',
      icon: Scale,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <Card key={card.label} className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-muted)]">
                  {card.label}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">
                  {card.value}
                </p>
              </div>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-subtle)] text-[var(--color-brand)]">
                <Icon className="size-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-[var(--color-text-muted)]">
              {card.helper}
            </p>
          </Card>
        )
      })}
    </div>
  )
}
