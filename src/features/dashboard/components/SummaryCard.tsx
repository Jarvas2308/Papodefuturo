import { CalendarClock, Landmark, TrendingUp, Wallet } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import type { DashboardSummaryItem } from '../types'

type SummaryCardProps = {
  item: DashboardSummaryItem
}

const iconMap = {
  wallet: Wallet,
  landmark: Landmark,
  'trending-up': TrendingUp,
  calendar: CalendarClock,
}

export function SummaryCard({ item }: SummaryCardProps) {
  const Icon = iconMap[item.icon]
  const valueToneClass =
    item.tone === 'positive'
      ? 'text-[var(--color-positive)]'
      : item.tone === 'negative'
        ? 'text-[var(--color-alert)]'
        : 'text-[var(--color-text)]'
  const badgeToneClass =
    item.tone === 'negative'
      ? 'bg-[color:color-mix(in_srgb,var(--color-alert)_12%,white)] text-[var(--color-alert)]'
      : 'bg-[color:color-mix(in_srgb,var(--color-positive)_12%,white)] text-[var(--color-positive)]'

  return (
    <Card className="flex h-full flex-col justify-between gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-muted)]">
            {item.label}
          </p>
          <p
            className={`mt-3 text-2xl font-semibold tracking-tight sm:text-[1.75rem] ${valueToneClass}`}
          >
            {item.value}
          </p>
        </div>
        <div className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] text-[var(--color-brand-strong)]">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </div>
      <div className="space-y-2">
        {item.badge ? (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeToneClass}`}
          >
            {item.badge}
          </span>
        ) : null}
        {item.detail ? (
          <p className="text-sm font-medium text-[var(--color-text)]">
            {item.detail}
          </p>
        ) : null}
        <p className="text-sm leading-6 text-[var(--color-text-muted)]">
          {item.helper}
        </p>
      </div>
    </Card>
  )
}
