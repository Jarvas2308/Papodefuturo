import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../../../components/ui/Card'

type DashboardWelcomeProps = {
  disclaimer: string
  title: string
  description: string
  actionLabel: string
  actionTo: string
}

export function DashboardWelcome({
  disclaimer,
  title,
  description,
  actionLabel,
  actionTo,
}: DashboardWelcomeProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-col gap-6 px-6 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full bg-[var(--color-brand-subtle)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-strong)]">
            {disclaimer}
          </span>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
            {title}
          </h2>
          <p className="mt-3 text-base leading-7 text-[var(--color-text-muted)]">
            {description}
          </p>
        </div>
        <Link
          to={actionTo}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-brand)] bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:bg-[var(--color-brand-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
        >
          {actionLabel}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </Card>
  )
}
