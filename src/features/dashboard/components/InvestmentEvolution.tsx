import { TrendingUp } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import type { DashboardView } from '../types'

type InvestmentEvolutionProps = {
  evolution: DashboardView['investmentEvolution']
}

export function InvestmentEvolution({ evolution }: InvestmentEvolutionProps) {
  const titleId = 'investment-evolution-title'
  const descriptionId = 'investment-evolution-description'
  const chartLabelId = 'investment-evolution-aria-label'
  const chartDescriptionId = 'investment-evolution-aria-description'

  return (
    <Card className="h-full">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2
              id={titleId}
              className="text-xl font-semibold text-[var(--color-text)]"
            >
              {evolution.title}
            </h2>
            <p
              id={descriptionId}
              className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]"
            >
              {evolution.description}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[color:color-mix(in_srgb,var(--color-positive)_12%,white)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-positive)]">
            <TrendingUp className="size-4" aria-hidden="true" />
            {evolution.changeLabel}
          </span>
        </div>

        <div
          role="img"
          aria-labelledby={`${titleId} ${chartLabelId}`}
          aria-describedby={`${descriptionId} ${chartDescriptionId}`}
          className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:p-5"
        >
          <p id={chartLabelId} className="sr-only">
            {evolution.chartAriaLabel}
          </p>
          <p id={chartDescriptionId} className="sr-only">
            {evolution.chartAriaDescription}
          </p>
          <svg
            viewBox="0 0 336 208"
            className="h-auto w-full"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <linearGradient
                id="dashboard-investment-fill"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="var(--color-brand)"
                  stopOpacity="0.20"
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-brand)"
                  stopOpacity="0.02"
                />
              </linearGradient>
            </defs>

            {[176, 136, 96, 56].map((y) => (
              <line
                key={y}
                x1="18"
                x2="318"
                y1={y}
                y2={y}
                stroke="var(--color-border)"
                strokeDasharray="4 6"
                strokeWidth="1"
              />
            ))}

            <path
              d={evolution.areaPath}
              fill="url(#dashboard-investment-fill)"
            />
            <polyline
              fill="none"
              stroke="var(--color-brand)"
              strokeWidth="4"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={evolution.polylinePoints}
            />

            {evolution.points.map((point) => (
              <g key={point.month}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="5.5"
                  fill="var(--color-surface)"
                  stroke="var(--color-brand)"
                  strokeWidth="3"
                />
                <text
                  x={point.x}
                  y="196"
                  textAnchor="middle"
                  fontSize="12"
                  fill="var(--color-text-muted)"
                >
                  {point.month}
                </text>
              </g>
            ))}
          </svg>

          <ul className="mt-4 grid gap-3 text-sm text-[var(--color-text-muted)] sm:grid-cols-3 lg:grid-cols-6">
            {evolution.points.map((point) => (
              <li
                key={point.month}
                className="rounded-[var(--radius-md)] bg-white/70 px-3 py-2"
              >
                <span className="block font-semibold text-[var(--color-text)]">
                  {point.month}
                </span>
                <span className="mt-1 block">{point.valueLabel}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  )
}
