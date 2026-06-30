import { Info } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { cn } from '../../../lib/cn'
import type { PortfolioMock } from '../types'

type PortfolioAllocationProps = {
  allocation: PortfolioMock['allocation']
}

export function PortfolioAllocation({ allocation }: PortfolioAllocationProps) {
  return (
    <Card>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-text)]">
            {allocation.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
            {allocation.description}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {allocation.items.map((item) => (
            <article
              key={item.id}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">
                    {item.category}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Meta monitorada {item.targetLabel}
                  </p>
                  <p className="mt-2 text-sm font-medium text-[var(--color-text)]">
                    {item.currentValue}
                  </p>
                </div>
                <p className="shrink-0 text-lg font-semibold text-[var(--color-text)]">
                  {item.currentLabel}
                </p>
              </div>

              <div
                className="mt-5 h-3 overflow-hidden rounded-full bg-[var(--color-border)]"
                role="progressbar"
                aria-valuenow={item.current}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuetext={`${item.currentLabel}; ${item.differenceLabel}`}
                aria-label={`Participação atual de ${item.category}; meta monitorada ${item.targetLabel}`}
              >
                <div
                  className={cn(
                    'h-full rounded-full',
                    item.tone === 'alert'
                      ? 'bg-[var(--color-alert)]'
                      : 'bg-[var(--color-brand)]'
                  )}
                  style={{ width: `${item.current}%` }}
                />
              </div>

              <p
                className={cn(
                  'mt-3 text-xs font-semibold',
                  item.tone === 'alert'
                    ? 'text-[var(--color-alert)]'
                    : 'text-[var(--color-text-muted)]'
                )}
              >
                {item.differenceLabel}
              </p>
            </article>
          ))}
        </div>

        <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] px-4 py-4">
          <Info
            className="mt-0.5 size-4 shrink-0 text-[var(--color-brand-strong)]"
            aria-hidden="true"
          />
          <p className="text-sm leading-6 text-[var(--color-text-muted)]">
            {allocation.note}
          </p>
        </div>
      </div>
    </Card>
  )
}
