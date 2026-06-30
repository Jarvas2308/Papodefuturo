import { Card } from '../../../components/ui/Card'
import type { DashboardMock } from '../types'

type InformationStatusProps = {
  informationStatus: DashboardMock['informationStatus']
}

export function InformationStatus({
  informationStatus,
}: InformationStatusProps) {
  return (
    <Card>
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-text)]">
            {informationStatus.title}
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {informationStatus.items.map((item) => (
            <div
              key={item.id}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-4"
            >
              <p className="text-sm font-semibold text-[var(--color-text)]">
                {item.label}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
