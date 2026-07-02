import {
  ArrowDownLeft,
  ArrowUpRight,
  Ban,
  CheckCircle2,
  Clock3,
  Coins,
  Landmark,
  Plus,
} from 'lucide-react'
import { cn } from '../../../lib/cn'
import type {
  HistoryCategory,
  HistoryMovementStatus,
  HistoryMovementType,
} from '../types'
import {
  historyCategoryLabels,
  historyStatusLabels,
  historyTypeLabels,
} from '../utils/historyLabels'

const typeConfig = {
  purchase: {
    icon: ArrowDownLeft,
    className: 'text-[var(--color-brand)]',
  },
  sale: {
    icon: ArrowUpRight,
    className: 'text-[var(--color-alert)]',
  },
  dividend: {
    icon: Coins,
    className: 'text-[var(--color-positive)]',
  },
  income: {
    icon: Landmark,
    className: 'text-[var(--color-positive)]',
  },
  contribution: {
    icon: Plus,
    className: 'text-[var(--color-brand-strong)]',
  },
} satisfies Record<
  HistoryMovementType,
  { icon: typeof Plus; className: string }
>

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    className: 'text-[var(--color-positive)]',
  },
  pending: {
    icon: Clock3,
    className: 'text-[var(--color-brand)]',
  },
  cancelled: {
    icon: Ban,
    className: 'text-[var(--color-alert)]',
  },
} satisfies Record<
  HistoryMovementStatus,
  { icon: typeof Ban; className: string }
>

export function MovementTypeBadge({ type }: { type: HistoryMovementType }) {
  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-sm font-semibold',
        config.className
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      {historyTypeLabels[type]}
    </span>
  )
}

export function MovementStatusBadge({
  status,
}: {
  status: HistoryMovementStatus
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
      {historyStatusLabels[status]}
    </span>
  )
}

export function HistoryCategoryBadge({
  category,
}: {
  category: HistoryCategory
}) {
  return (
    <span className="inline-flex rounded-full bg-[var(--color-brand-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--color-brand-strong)]">
      {historyCategoryLabels[category]}
    </span>
  )
}
