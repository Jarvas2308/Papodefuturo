import { ArrowRight, BadgeInfo } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../../../components/ui/Card'
import type { PortfolioMock } from '../types'

type PortfolioHeaderProps = {
  disclaimer: string
  header: PortfolioMock['header']
}

export function PortfolioHeader({ disclaimer, header }: PortfolioHeaderProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-col gap-6 px-6 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand-subtle)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-strong)]">
            <BadgeInfo className="size-3.5" aria-hidden="true" />
            {disclaimer}
          </span>
          <div className="mt-4">
            <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-text)]">
              {header.title}
            </h2>
            <p className="mt-2 max-w-3xl text-base leading-7 text-[var(--color-text-muted)]">
              {header.description}
            </p>
          </div>
        </div>

        <Link
          to={header.actionTo}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-brand)] bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:bg-[var(--color-brand-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
        >
          {header.actionLabel}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </Card>
  )
}
