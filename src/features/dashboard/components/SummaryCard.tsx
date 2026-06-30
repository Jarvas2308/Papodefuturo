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

  return (
    <Card className="flex h-full flex-col justify-between gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-muted)]">
            {item.label}
          </p>
          <p
            className={`mt-3 text-2xl font-semibold tracking-tight sm:text-[1.75rem] ${
              item.tone === 'positive'
                ? 'text-[var(--color-positive)]'
                : 'text-[var(--color-text)]'
            }`}
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
          <span className="inline-flex rounded-full bg-[color:color-mix(in_srgb,var(--color-positive)_12%,white)] px-2.5 py-1 text-xs font-semibold text-[var(--color-positive)]">
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
