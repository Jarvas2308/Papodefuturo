import { ArrowDownToLine, Coins, ListChecks, Repeat2 } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import type { HistorySummary } from '../types'
import { formatHistoryCurrency } from '../utils/history'

export function HistorySummaryCards({ summary }: { summary: HistorySummary }) {
  const cards = [
    {
      label: 'Movimentações',
      value: String(summary.movementCount),
      helper: 'Registros demonstrativos',
      icon: ListChecks,
    },
    {
      label: 'Compras',
      value: String(summary.purchaseCount),
      helper: 'Ordens simuladas no período',
      icon: ArrowDownToLine,
    },
    {
      label: 'Proventos recebidos',
      value: formatHistoryCurrency(summary.proceedsInCents, 'BRL'),
      helper: 'Dividendos e rendimentos concluídos',
      icon: Coins,
    },
    {
      label: 'Volume movimentado',
      value: formatHistoryCurrency(summary.brlVolumeInCents, 'BRL'),
      helper: `Além de ${formatHistoryCurrency(summary.usdVolumeInCents, 'USD')}`,
      icon: Repeat2,
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
