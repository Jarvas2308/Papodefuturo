import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../../../components/ui/Card'

type DashboardNextStepProps = {
  title: string
  description: string
  actionLabel: string
  actionTo: string
}

export function DashboardNextStep({
  title,
  description,
  actionLabel,
  actionTo,
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
        <Link
          to={actionTo}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
        >
          {actionLabel}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </Card>
  )
}
