import { useMemo, useState } from 'react'
import { HistoryPanel } from '../features/history/components/HistoryPanel'
import { PurchaseForm } from '../features/history/components/PurchaseForm'
import { HistorySummaryCards } from '../features/history/components/HistorySummaryCards'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import type { HistoryFilters } from '../features/history/types'
import { useHistoryData } from '../features/history/useHistoryData'
import {
  calculateHistorySummary,
  emptyHistoryFilters,
  filterHistoryMovements,
} from '../features/history/utils/history'

export function HistoryPage() {
  const historyData = useHistoryData()
  const [filters, setFilters] = useState<HistoryFilters>(emptyHistoryFilters)
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(
    null
  )
  const [purchaseToCancelId, setPurchaseToCancelId] = useState<string | null>(
    null
  )
  const [pendingPurchaseId, setPendingPurchaseId] = useState<string | null>(
    null
  )
  const [feedback, setFeedback] = useState<string | null>(null)
  const historySummary = useMemo(
    () => calculateHistorySummary(historyData.movements),
    [historyData.movements]
  )
  const historyMonths = useMemo(
    () =>
      Array.from(
        new Set(
          historyData.movements.map((movement) => movement.date.slice(0, 7))
        )
      ).sort((a, b) => b.localeCompare(a)),
    [historyData.movements]
  )
  const filteredMovements = useMemo(
    () => filterHistoryMovements(historyData.movements, filters),
    [filters, historyData.movements]
  )
  const editingPurchase = historyData.purchases.find(
    (purchase) => purchase.id === editingPurchaseId
  )
  const purchaseToCancel = historyData.purchases.find(
    (purchase) => purchase.id === purchaseToCancelId
  )
  const cancellationAsset = historyData.assets.find(
    (asset) => asset.id === purchaseToCancel?.assetId
  )

  function clearFilters() {
    setFilters({ ...emptyHistoryFilters })
  }

  async function handleCreatePurchase(
    draft: Parameters<typeof historyData.createPurchase>[0]
  ) {
    await historyData.createPurchase(draft)
    setFeedback('Compra registrada com sucesso na sua conta.')
  }

  async function handleUpdatePurchase(
    purchaseId: string,
    draft: Parameters<typeof historyData.updatePurchase>[1]
  ) {
    await historyData.updatePurchase(purchaseId, draft)
    setFeedback(
      'Compra atualizada com sucesso. Os valores derivados foram recalculados.'
    )
  }

  function startEditPurchase(purchaseId: string) {
    setFeedback(null)
    setEditingPurchaseId(purchaseId)
  }

  function requestCancellation(purchaseId: string) {
    setFeedback(null)
    setPurchaseToCancelId(purchaseId)
  }

  async function confirmCancellation() {
    if (!purchaseToCancel) {
      return
    }

    setPendingPurchaseId(purchaseToCancel.id)

    try {
      await historyData.cancelPurchase(purchaseToCancel.id)
      setPurchaseToCancelId(null)
      setEditingPurchaseId((current) =>
        current === purchaseToCancel.id ? null : current
      )
      setFeedback(
        'Compra cancelada. Ela continua no Histórico, mas não compõe a posição atual.'
      )
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : 'Não foi possível cancelar a compra.'
      )
    } finally {
      setPendingPurchaseId(null)
    }
  }

  if (historyData.status === 'loading') {
    return (
      <section className="space-y-6">
        <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5 text-sm text-[var(--color-text-muted)]">
          Carregando seu histórico...
        </p>
      </section>
    )
  }

  if (historyData.status === 'error') {
    return (
      <section className="space-y-6">
        <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5 text-sm font-medium text-[var(--color-text)]">
          {historyData.error ?? 'Não foi possível carregar o histórico.'}
        </p>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      {!historyData.isDemo ? (
        <PurchaseForm
          assets={historyData.assets}
          editingPurchase={editingPurchase ?? null}
          onCreate={handleCreatePurchase}
          onUpdate={handleUpdatePurchase}
          onCancelEdit={() => setEditingPurchaseId(null)}
        />
      ) : null}

      {purchaseToCancel ? (
        <Card
          className="space-y-4 border-[var(--color-alert)] p-5 sm:p-6"
          role="alertdialog"
          aria-labelledby="cancel-purchase-title"
          aria-describedby="cancel-purchase-description"
        >
          <div>
            <p className="text-sm font-semibold text-[var(--color-alert)]">
              Confirmar cancelamento
            </p>
            <h2
              id="cancel-purchase-title"
              className="mt-2 text-xl font-semibold text-[var(--color-text)]"
            >
              Cancelar compra de {cancellationAsset?.ticker ?? 'ativo'}?
            </h2>
            <p
              id="cancel-purchase-description"
              className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]"
            >
              A compra não será excluída. Ela continuará visível no Histórico
              como cancelada e deixará de compor a posição atual da carteira.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={pendingPurchaseId !== null}
              onClick={() => setPurchaseToCancelId(null)}
            >
              Voltar
            </Button>
            <Button
              disabled={pendingPurchaseId !== null}
              onClick={confirmCancellation}
            >
              {pendingPurchaseId ? 'Cancelando...' : 'Confirmar cancelamento'}
            </Button>
          </div>
        </Card>
      ) : null}

      {feedback ? (
        <p
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-text)]"
          aria-live="polite"
        >
          {feedback}
        </p>
      ) : null}

      <HistorySummaryCards summary={historySummary} />
      <HistoryPanel
        movements={filteredMovements}
        isDemo={historyData.isDemo}
        filters={filters}
        months={historyMonths}
        onFiltersChange={setFilters}
        onClear={clearFilters}
        onEditPurchase={historyData.isDemo ? undefined : startEditPurchase}
        onCancelPurchase={historyData.isDemo ? undefined : requestCancellation}
        pendingPurchaseId={pendingPurchaseId}
      />
    </section>
  )
}
