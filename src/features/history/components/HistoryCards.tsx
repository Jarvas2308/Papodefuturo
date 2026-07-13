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

type HistoryCardsProps = {
  movements: HistoryMovement[]
  onEditPurchase?: (purchaseId: string) => void
  onCancelPurchase?: (purchaseId: string) => void
  pendingPurchaseId?: string | null
}

function canManagePurchase(movement: HistoryMovement): boolean {
  return movement.type === 'purchase' && movement.status === 'completed'
}

export function HistoryCards({
  movements,
  onEditPurchase,
  onCancelPurchase,
  pendingPurchaseId,
}: HistoryCardsProps) {
  const hasActions = Boolean(onEditPurchase && onCancelPurchase)

  return (
    <ul className="grid gap-4 md:grid-cols-2 xl:hidden">
      {movements.map((movement) => (
        <li
          key={movement.id}
          className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-lg font-semibold text-[var(--color-text)]">
                {movement.ticker}
              </p>
              <p className="mt-1 break-words text-sm text-[var(--color-text-muted)]">
                {movement.assetName}
              </p>
            </div>
            <MovementStatusBadge status={movement.status} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <MovementTypeBadge type={movement.type} />
            <HistoryCategoryBadge category={movement.category} />
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-[var(--color-border)] pt-4 text-sm">
            <div>
              <dt className="text-[var(--color-text-muted)]">Data</dt>
              <dd className="mt-1 font-medium text-[var(--color-text)]">
                {formatHistoryDate(movement.date)}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">Quantidade</dt>
              <dd className="mt-1 font-medium text-[var(--color-text)]">
                {formatHistoryQuantity(movement.quantity)}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">Preço unitário</dt>
              <dd className="mt-1 font-medium text-[var(--color-text)]">
                {formatHistoryCurrency(
                  movement.unitPriceInCents,
                  movement.currency
                )}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">Valor total</dt>
              <dd className="mt-1 font-semibold text-[var(--color-text)]">
                {formatHistoryCurrency(
                  movement.totalValueInCents,
                  movement.currency
                )}
              </dd>
            </div>
          </dl>

          {hasActions && canManagePurchase(movement) ? (
            <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-4">
              <Button
                variant="secondary"
                className="px-3 py-2 text-xs"
                disabled={pendingPurchaseId === movement.id}
                onClick={() => onEditPurchase?.(movement.id)}
              >
                Editar compra
              </Button>
              <Button
                variant="ghost"
                className="px-3 py-2 text-xs text-[var(--color-alert)]"
                disabled={pendingPurchaseId === movement.id}
                onClick={() => onCancelPurchase?.(movement.id)}
              >
                {pendingPurchaseId === movement.id
                  ? 'Cancelando...'
                  : 'Cancelar compra'}
              </Button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
