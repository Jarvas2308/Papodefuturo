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
    <Card className="relative overflow-hidden p-0">
      <div
        className="absolute inset-x-0 top-0 h-1 bg-[var(--color-brand)]"
        aria-hidden="true"
      />
      <div className="flex flex-col gap-7 px-6 py-8 sm:px-9 sm:py-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <span className="figure inline-flex items-center gap-2 border border-[var(--color-brand)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-strong)]">
            {disclaimer}
          </span>
          <h2 className="mt-5 text-[2.25rem] leading-[1.05] font-semibold tracking-tight text-[var(--color-text)] sm:text-[2.75rem]">
            {title}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-[var(--color-text-muted)]">
            {description}
          </p>
        </div>
        <Link
          to={actionTo}
          className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-brand)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-brand-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
        >
          {actionLabel}
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>
    </Card>
  )
}
