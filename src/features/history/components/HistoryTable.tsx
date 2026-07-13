import type { HistoryMovement } from '../types'
import { Button } from '../../../components/ui/Button'
import {
  formatHistoryCurrency,
  formatHistoryDate,
  formatHistoryQuantity,
} from '../utils/history'
import {
  HistoryCategoryBadge,
  MovementStatusBadge,
  MovementTypeBadge,
} from './HistoryBadges'

type HistoryTableProps = {
  movements: HistoryMovement[]
  isDemo: boolean
  onEditPurchase?: (purchaseId: string) => void
  onCancelPurchase?: (purchaseId: string) => void
  pendingPurchaseId?: string | null
}

function canManagePurchase(movement: HistoryMovement): boolean {
  return movement.type === 'purchase' && movement.status === 'completed'
}

export function HistoryTable({
  movements,
  isDemo,
  onEditPurchase,
  onCancelPurchase,
  pendingPurchaseId,
}: HistoryTableProps) {
  const hasActions = Boolean(onEditPurchase && onCancelPurchase)

  return (
    <div className="hidden overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] xl:block">
      <table className="w-full border-collapse">
        <caption className="sr-only">
          {isDemo
            ? 'Movimentações demonstrativas conforme os filtros selecionados'
            : 'Movimentações da sua conta conforme os filtros selecionados'}
        </caption>
        <thead className="bg-[var(--color-surface-muted)]">
          <tr>
            {[
              'Data',
              'Movimentação',
              'Ativo',
              'Categoria',
              'Quantidade',
              'Preço unitário',
              'Valor total',
              'Status',
              ...(hasActions ? ['Ações'] : []),
            ].map((label) => (
              <th
                key={label}
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {movements.map((movement) => (
            <tr
              key={movement.id}
              className="border-t border-[var(--color-border)] transition hover:bg-[var(--color-surface-muted)]"
            >
              <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-[var(--color-text)]">
                {formatHistoryDate(movement.date)}
              </td>
              <td className="px-4 py-4">
                <MovementTypeBadge type={movement.type} />
              </td>
              <th scope="row" className="px-4 py-4 text-left">
                <span className="block text-sm font-semibold text-[var(--color-text)]">
                  {movement.ticker}
                </span>
                <span className="mt-1 block max-w-40 text-xs font-normal leading-5 text-[var(--color-text-muted)]">
                  {movement.assetName}
                </span>
              </th>
              <td className="px-4 py-4">
                <HistoryCategoryBadge category={movement.category} />
              </td>
              <td className="px-4 py-4 text-right text-sm text-[var(--color-text)]">
                {formatHistoryQuantity(movement.quantity)}
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-[var(--color-text)]">
                {formatHistoryCurrency(
                  movement.unitPriceInCents,
                  movement.currency
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-semibold text-[var(--color-text)]">
                {formatHistoryCurrency(
                  movement.totalValueInCents,
                  movement.currency
                )}
              </td>
              <td className="px-4 py-4">
                <MovementStatusBadge status={movement.status} />
              </td>
              {hasActions ? (
                <td className="px-4 py-4">
                  {canManagePurchase(movement) ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        className="px-2 py-1.5 text-xs"
                        disabled={pendingPurchaseId === movement.id}
                        onClick={() => onEditPurchase?.(movement.id)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        className="px-2 py-1.5 text-xs text-[var(--color-alert)]"
                        disabled={pendingPurchaseId === movement.id}
                        onClick={() => onCancelPurchase?.(movement.id)}
                      >
                        {pendingPurchaseId === movement.id
                          ? 'Cancelando...'
                          : 'Cancelar compra'}
                      </Button>
                    </div>
                  ) : (
                    <span className="text-sm text-[var(--color-text-muted)]">
                      —
                    </span>
                  )}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
