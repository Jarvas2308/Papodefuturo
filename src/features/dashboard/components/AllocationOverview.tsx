import { Card } from '../../../components/ui/Card'
import type { DashboardMock } from '../types'

type AllocationOverviewProps = {
  allocation: DashboardMock['allocation']
}

export function AllocationOverview({ allocation }: AllocationOverviewProps) {
  return (
    <Card className="h-full">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-text)]">
            {allocation.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            {allocation.description}
          </p>
        </div>

        <div className="space-y-5">
          {allocation.items.map((item) => {
            const toneClass =
              item.tone === 'positive'
                ? 'text-[var(--color-positive)]'
                : item.tone === 'alert'
                  ? 'text-[var(--color-alert)]'
                  : 'text-[var(--color-text-muted)]'

            return (
              <div key={item.id} className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-text)]">
                      {item.category}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      Meta monitorada {item.targetLabel}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[var(--color-text)]">
                      Atual {item.currentLabel}
                    </p>
                    <p className={`mt-1 text-xs font-medium ${toneClass}`}>
                      {item.differenceLabel}
                    </p>
                  </div>
                </div>

                <div
                  className="h-3 rounded-full bg-[var(--color-surface-muted)]"
                  role="progressbar"
                  aria-valuenow={item.current}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Participação atual de ${item.category}`}
                >
                  <div
                    className={`h-full rounded-full ${
                      item.tone === 'positive'
                        ? 'bg-[var(--color-positive)]'
                        : item.tone === 'alert'
                          ? 'bg-[var(--color-alert)]'
                          : 'bg-[var(--color-brand)]'
                    }`}
                    style={{ width: `${item.current}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] px-4 py-4">
          <p className="text-sm leading-6 text-[var(--color-text-muted)]">
            {allocation.note}
          </p>
        </div>
      </div>
    </Card>
  )
}
