import type { PortfolioPosition } from '../types'
import { CategoryBadge } from './CategoryBadge'
import { ReturnIndicator } from './ReturnIndicator'

type PositionCardsProps = {
  positions: PortfolioPosition[]
}

export function PositionCards({ positions }: PositionCardsProps) {
  return (
    <ul className="grid gap-4 md:grid-cols-2 xl:hidden">
      {positions.map((position) => (
        <li
          key={position.id}
          className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-lg font-semibold text-[var(--color-text)]">
                {position.ticker}
              </p>
              <p className="mt-1 break-words text-sm leading-5 text-[var(--color-text-muted)]">
                {position.name}
              </p>
              <p className="mt-1 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                {position.market} · {position.currency}
              </p>
            </div>
            <ReturnIndicator position={position} align="right" />
          </div>

          <div className="mt-4">
            <CategoryBadge
              category={position.category}
              label={position.categoryLabel}
            />
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-[var(--color-border)] pt-4 text-sm">
            <div>
              <dt className="text-[var(--color-text-muted)]">Valor atual</dt>
              <dd className="mt-1 font-semibold text-[var(--color-text)]">
                {position.currentValue}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">
                Valor investido
              </dt>
              <dd className="mt-1 font-medium text-[var(--color-text)]">
                {position.investedValue}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">Participação</dt>
              <dd className="mt-1 font-medium text-[var(--color-text)]">
                {position.participation}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">Quantidade</dt>
              <dd className="mt-1 font-medium text-[var(--color-text)]">
                {position.quantity}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">Preço médio</dt>
              <dd className="mt-1 font-medium text-[var(--color-text)]">
                {position.averagePrice}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">
                Cotação demonstrativa
              </dt>
              <dd className="mt-1 font-medium text-[var(--color-text)]">
                {position.currentQuote}
              </dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  )
}
