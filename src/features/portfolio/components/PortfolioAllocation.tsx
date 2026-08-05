import { Info } from 'lucide-react'
import { CalibrationGauge } from '../../../components/ui/CalibrationGauge'
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
                  <p className="figure mt-1 text-xs text-[var(--color-text-muted)]">
                    Meta {item.targetLabel}
                  </p>
                  <p className="figure mt-2 text-sm font-medium text-[var(--color-text)]">
                    {item.currentValue}
                  </p>
                </div>
                <p className="figure shrink-0 text-lg font-semibold text-[var(--color-text)]">
                  {item.currentLabel}
                </p>
              </div>

              <div className="mt-5">
                <CalibrationGauge
                  label={item.category}
                  targetPercent={item.target}
                  currentPercent={item.current}
                  alert={item.tone === 'alert'}
                />
              </div>

              <p
                className={cn(
                  'figure mt-3 text-xs font-semibold',
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
