import { Card } from '../../../components/ui/Card'

type DashboardNextStepProps = {
  title: string
  description: string
}

export function DashboardNextStep({
  title,
  description,
}: DashboardNextStepProps) {
  return (
    <Card>
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">
            {title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
            {description}
          </p>
        </div>
      </div>
    </Card>
  )
}
