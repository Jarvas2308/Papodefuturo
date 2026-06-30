import type { PortfolioPosition } from '../types'
import { CategoryBadge } from './CategoryBadge'
import { ReturnIndicator } from './ReturnIndicator'

type PositionsTableProps = {
  positions: PortfolioPosition[]
}

export function PositionsTable({ positions }: PositionsTableProps) {
  return (
    <div className="hidden overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] xl:block">
      <table className="w-full table-fixed border-collapse">
        <caption className="sr-only">
          Posições demonstrativas da carteira conforme o filtro selecionado
        </caption>
        <thead className="bg-[var(--color-surface-muted)]">
          <tr>
            <th
              scope="col"
              className="w-[17%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]"
            >
              Ativo
            </th>
            <th
              scope="col"
              className="w-[15%] px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]"
            >
              Categoria
            </th>
            {[
              'Quantidade',
              'Preço médio',
              'Valor investido',
              'Valor atual',
              'Participação',
              'Rentabilidade',
            ].map((label) => (
              <th
                key={label}
                scope="col"
                className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {positions.map((position) => (
            <tr
              key={position.id}
              className="border-t border-[var(--color-border)] align-top transition hover:bg-[var(--color-surface-muted)]"
            >
              <th scope="row" className="px-4 py-4 text-left">
                <span className="block text-sm font-semibold text-[var(--color-text)]">
                  {position.ticker}
                </span>
                <span className="mt-1 block text-xs font-normal leading-5 text-[var(--color-text-muted)]">
                  {position.name}
                </span>
                <span className="mt-1 block text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  {position.market} · {position.currency}
                </span>
              </th>
              <td className="px-3 py-4">
                <CategoryBadge
                  category={position.category}
                  label={position.categoryLabel}
                />
              </td>
              <td className="px-3 py-4 text-right text-sm font-medium text-[var(--color-text)]">
                {position.quantity}
              </td>
              <td className="px-3 py-4 text-right">
                <span className="block text-sm font-medium text-[var(--color-text)]">
                  {position.averagePrice}
                </span>
                <span className="mt-1 block text-xs text-[var(--color-text-muted)]">
                  Cotação demo {position.currentQuote}
                </span>
              </td>
              <td className="px-3 py-4 text-right text-sm font-medium text-[var(--color-text)]">
                {position.investedValue}
              </td>
              <td className="px-3 py-4 text-right text-sm font-semibold text-[var(--color-text)]">
                {position.currentValue}
              </td>
              <td className="px-3 py-4 text-right text-sm font-medium text-[var(--color-text)]">
                {position.participation}
              </td>
              <td className="px-3 py-4">
                <ReturnIndicator position={position} align="right" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
