import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '../../../lib/cn'
import type { PortfolioPosition } from '../types'

type ReturnIndicatorProps = {
  position: PortfolioPosition
  align?: 'left' | 'right'
}

export function ReturnIndicator({
  position,
  align = 'left',
}: ReturnIndicatorProps) {
  const isPositive = position.tone === 'positive'
  const Icon = isPositive ? TrendingUp : TrendingDown

  return (
    <div
      className={cn(
        'space-y-1',
        align === 'right' ? 'text-right' : 'text-left'
      )}
      aria-label={`Resultado ${isPositive ? 'positivo' : 'negativo'} de ${position.resultValue}, equivalente a ${position.resultPercentage}`}
    >
      <p
        className={cn(
          'inline-flex items-center gap-1.5 text-sm font-semibold',
          isPositive
            ? 'text-[var(--color-positive)]'
            : 'text-[var(--color-alert)]'
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
        {position.resultPercentage}
      </p>
      <p className="text-xs font-medium text-[var(--color-text-muted)]">
        {position.resultValue}
      </p>
    </div>
  )
}
