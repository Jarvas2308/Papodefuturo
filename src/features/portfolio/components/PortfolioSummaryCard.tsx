import { Landmark, Layers3, TrendingUp, Wallet } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { cn } from '../../../lib/cn'
import type { PortfolioSummaryItem } from '../types'

type PortfolioSummaryCardProps = {
  item: PortfolioSummaryItem
}

const iconMap = {
  wallet: Wallet,
  landmark: Landmark,
  'trending-up': TrendingUp,
  layers: Layers3,
}

export function PortfolioSummaryCard({ item }: PortfolioSummaryCardProps) {
  const Icon = iconMap[item.icon]

  return (
    <Card className="flex h-full flex-col justify-between gap-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--color-text-muted)]">
            {item.label}
          </p>
          <p
            className={cn(
              'mt-3 break-words text-2xl font-semibold tracking-tight sm:text-[1.75rem]',
              item.tone === 'positive'
                ? 'text-[var(--color-positive)]'
                : 'text-[var(--color-text)]'
            )}
          >
            {item.value}
          </p>
        </div>
        <div className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] text-[var(--color-brand-strong)]">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </div>

      <div className="space-y-3">
        {item.badge ? (
          <span className="inline-flex rounded-full bg-[color:color-mix(in_srgb,var(--color-positive)_12%,white)] px-2.5 py-1 text-xs font-semibold text-[var(--color-positive)]">
            {item.badge}
          </span>
        ) : null}
        <p className="text-sm leading-6 text-[var(--color-text-muted)]">
          {item.helper}
        </p>
      </div>
    </Card>
  )
}
