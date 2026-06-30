import { Link } from 'react-router-dom'
import { Card } from '../../../components/ui/Card'
import type { DashboardMock } from '../types'

type RecentMovementsProps = {
  recentMovements: DashboardMock['recentMovements']
  disclaimer: string
}

export function RecentMovements({
  recentMovements,
  disclaimer,
}: RecentMovementsProps) {
  return (
    <Card>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-text)]">
              {recentMovements.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
              {recentMovements.description}
            </p>
          </div>
          <span className="inline-flex rounded-full bg-[var(--color-brand-subtle)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-strong)]">
            {disclaimer}
          </span>
        </div>

        <div className="hidden overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] md:block">
          <table className="min-w-full border-collapse">
            <thead className="bg-[var(--color-surface-muted)]">
              <tr>
                {['Data', 'Ativo', 'Tipo', 'Quantidade', 'Valor'].map(
                  (label) => (
                    <th
                      key={label}
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]"
                    >
                      {label}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {recentMovements.items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-[var(--color-border)] text-sm text-[var(--color-text)]"
                >
                  <td className="px-4 py-4">{item.date}</td>
                  <td className="px-4 py-4 font-semibold">{item.asset}</td>
                  <td className="px-4 py-4">{item.type}</td>
                  <td className="px-4 py-4">{item.quantity}</td>
                  <td className="px-4 py-4 font-medium">{item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="grid gap-4 md:hidden">
          {recentMovements.items.map((item) => (
            <li
              key={item.id}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    {item.asset}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                    {item.type}
                  </p>
                </div>
                <p className="text-sm font-medium text-[var(--color-text)]">
                  {item.amount}
                </p>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-[var(--color-text-muted)]">Data</dt>
                  <dd className="mt-1 font-medium text-[var(--color-text)]">
                    {item.date}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--color-text-muted)]">Quantidade</dt>
                  <dd className="mt-1 font-medium text-[var(--color-text)]">
                    {item.quantity}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>

        <Link
          to={recentMovements.actionTo}
          className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] text-sm font-semibold text-[var(--color-brand)] underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
        >
          {recentMovements.actionLabel}
        </Link>
      </div>
    </Card>
  )
}
