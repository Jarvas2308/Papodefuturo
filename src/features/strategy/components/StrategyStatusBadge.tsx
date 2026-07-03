import { CircleEqual, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '../../../lib/cn'
import type { StrategyAllocationStatus } from '../types'

const statusConfig = {
  below: {
    label: 'Abaixo da meta',
    icon: TrendingDown,
    className: 'text-[var(--color-brand)]',
  },
  near: {
    label: 'Próximo da meta',
    icon: CircleEqual,
    className: 'text-[var(--color-positive)]',
  },
  above: {
    label: 'Acima da meta',
    icon: TrendingUp,
    className: 'text-[var(--color-alert)]',
  },
} satisfies Record<
  StrategyAllocationStatus,
  { label: string; icon: typeof CircleEqual; className: string }
>

export function StrategyStatusBadge({
  status,
}: {
  status: StrategyAllocationStatus
}) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs font-semibold',
        config.className
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {config.label}
    </span>
  )
}
