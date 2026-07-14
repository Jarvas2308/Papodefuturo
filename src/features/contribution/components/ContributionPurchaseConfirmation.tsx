import { useMemo, useState } from 'react'
import { CheckCircle2, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import type { CreatePurchaseBatchItem } from '../../../data/repositories/contracts'
import type { Asset, ExchangeRate } from '../../../domain/models'
import { ExchangeRateSetup } from '../../strategy/components/ExchangeRateSetup'
import type { ContributionResult } from '../types'
import {
  buildConfirmedPurchaseBatch,
  buildContributionConfirmationItems,
  calculateContributionPurchaseComparison,
  createContributionPurchaseDrafts,
  type ContributionConfirmationPosition,
  type ContributionPurchaseDraft,
} from '../utils/confirmedPurchases'

type ContributionPurchaseConfirmationProps = {
  assets: readonly Asset[]
  exchangeRate: ExchangeRate | null
  onRegister(purchases: readonly CreatePurchaseBatchItem[]): Promise<unknown>
  onSaveExchangeRate(rateScaled: number): Promise<void>
  positions: readonly ContributionConfirmationPosition[]
  result: ContributionResult
}

function formatMoney(amountInMinorUnits: number, currency: 'BRL' | 'USD') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(amountInMinorUnits / 100)
}

function formatDifference(amountInMinorUnits: number) {
  const prefix = amountInMinorUnits > 0 ? '+' : ''
  return `${prefix}${formatMoney(amountInMinorUnits, 'BRL')}`
}

function getCurrentDate() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${now.getFullYear()}-${month}-${day}`
}

export function ContributionPurchaseConfirmation({
  assets,
  exchangeRate,
  onRegister,
  onSaveExchangeRate,
  positions,
  result,
}: ContributionPurchaseConfirmationProps) {
  const items = useMemo(
    () =>
      buildContributionConfirmationItems(
        result.distribuicao,
        positions,
        assets,
        exchangeRate
      ),
    [assets, exchangeRate, positions, result.distribuicao]
  )
  const [drafts, setDrafts] = useState(() =>
    createContributionPurchaseDrafts(items, getCurrentDate())
  )
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [registeredCount, setRegisteredCount] = useState<number | null>(null)
  const hasUsdItem = items.some((item) => item.currency === 'USD')
  const hasPerformedPurchase = drafts.some((draft) => draft.isPerformed)

  function updateDraft(
    assetId: string,
    update: Partial<ContributionPurchaseDraft>
  ) {
    setFeedback(null)
    setDrafts((current) =>
      current.map((draft) =>
        draft.assetId === assetId ? { ...draft, ...update } : draft
      )
    )
  }

  async function registerPurchases() {
    if (isSaving || registeredCount !== null) {
      return
    }

    setFeedback(null)

    try {
      const purchases = buildConfirmedPurchaseBatch(items, drafts, exchangeRate)
      setIsSaving(true)
      await onRegister(purchases)
      setRegisteredCount(purchases.length)
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : 'Não foi possível registrar as compras confirmadas.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (hasUsdItem && !exchangeRate) {
    return (
      <ExchangeRateSetup
        description="Sua simulação inclui ativos em USD. Informe a taxa USD/BRL para comparar os valores realizados com o orçamento sugerido em BRL."
        onSave={onSaveExchangeRate}
      />
    )
  }

  return (
    <Card className="space-y-6 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--color-primary)]">
            Compras realizadas
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
            Confirmar compras realizadas
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
            Informe o que você realmente comprou. A sugestão de aporte é um
            orçamento técnico e não representa uma ordem executada.
          </p>
        </div>
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand-strong)]">
          <ShoppingCart className="size-5" aria-hidden="true" />
        </div>
      </div>

      {registeredCount !== null ? (
        <div
          className="rounded-[var(--radius-md)] border border-[var(--color-positive)] bg-[color:color-mix(in_srgb,var(--color-positive)_8%,white)] p-4"
          aria-live="polite"
        >
          <p className="flex items-center gap-2 text-sm font-semibold text-[var(--color-positive)]">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            {registeredCount}{' '}
            {registeredCount === 1
              ? 'compra registrada'
              : 'compras registradas'}
            {' com sucesso.'}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            Os fatos registrados passam a compor os cálculos da sua carteira.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              className="text-sm font-semibold text-[var(--color-brand-strong)] underline underline-offset-4"
              to="/historico"
            >
              Ver Histórico
            </Link>
            <Link
              className="text-sm font-semibold text-[var(--color-brand-strong)] underline underline-offset-4"
              to="/carteira"
            >
              Ver Minha Carteira
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((item) => {
              const draft = drafts.find(
                (candidate) => candidate.assetId === item.assetId
              )
              const comparison = draft?.isPerformed
                ? (() => {
                    try {
                      return calculateContributionPurchaseComparison(
                        item,
                        draft,
                        exchangeRate
                      )
                    } catch {
                      return null
                    }
                  })()
                : null
              const itemId = `contribution-purchase-${item.assetId}`

              if (!draft) {
                return null
              }

              return (
                <article
                  key={item.assetId}
                  className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-[var(--color-text)]">
                        {item.ticker}
                      </p>
                      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        {item.name} · {item.categoryLabel}
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
                      <input
                        checked={!draft.isPerformed}
                        className="size-4 accent-[var(--color-brand)]"
                        disabled={isSaving}
                        type="checkbox"
                        onChange={(event) =>
                          updateDraft(item.assetId, {
                            isPerformed: !event.target.checked,
                          })
                        }
                      />
                      Não realizada
                    </label>
                  </div>

                  <div className="mt-4 grid gap-3 border-y border-[var(--color-border)] py-4 text-sm sm:grid-cols-2 xl:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                        Valor sugerido
                      </p>
                      <p className="mt-1 font-semibold text-[var(--color-text)]">
                        {formatMoney(
                          item.suggestedAmountInBrlMinorUnits,
                          'BRL'
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                        Moeda nativa
                      </p>
                      <p className="mt-1 font-semibold text-[var(--color-text)]">
                        {item.currency}
                      </p>
                    </div>
                    {item.estimatedSuggestedAmountInUsdMinorUnits !== null ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                          Equivalente estimado
                        </p>
                        <p className="mt-1 font-semibold text-[var(--color-text)]">
                          {formatMoney(
                            item.estimatedSuggestedAmountInUsdMinorUnits,
                            'USD'
                          )}{' '}
                          em USD
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <label className="text-sm font-medium text-[var(--color-text)]">
                      Quantidade comprada
                      <input
                        id={`${itemId}-quantity`}
                        className="mt-2 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:bg-[var(--color-surface-muted)]"
                        disabled={!draft.isPerformed || isSaving}
                        inputMode="decimal"
                        placeholder="0"
                        value={draft.quantity}
                        onChange={(event) =>
                          updateDraft(item.assetId, {
                            quantity: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="text-sm font-medium text-[var(--color-text)]">
                      Preço unitário pago ({item.currency})
                      <input
                        id={`${itemId}-price`}
                        className="mt-2 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:bg-[var(--color-surface-muted)]"
                        disabled={!draft.isPerformed || isSaving}
                        inputMode="decimal"
                        placeholder="0,00"
                        value={draft.unitPrice}
                        onChange={(event) =>
                          updateDraft(item.assetId, {
                            unitPrice: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="text-sm font-medium text-[var(--color-text)]">
                      Data da compra
                      <input
                        id={`${itemId}-date`}
                        className="mt-2 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:bg-[var(--color-surface-muted)]"
                        disabled={!draft.isPerformed || isSaving}
                        type="date"
                        value={draft.purchasedAt}
                        onChange={(event) =>
                          updateDraft(item.assetId, {
                            purchasedAt: event.target.value,
                          })
                        }
                      />
                    </label>
                  </div>

                  {draft.isPerformed ? (
                    <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                      <p className="text-[var(--color-text-muted)]">
                        Total realizado:{' '}
                        <span className="font-semibold text-[var(--color-text)]">
                          {comparison
                            ? formatMoney(
                                comparison.totalAmountInMinorUnits,
                                item.currency
                              )
                            : 'Preencha quantidade e preço'}
                        </span>
                      </p>
                      <p className="text-[var(--color-text-muted)]">
                        Diferença para o sugerido:{' '}
                        <span className="font-semibold text-[var(--color-text)]">
                          {comparison
                            ? formatDifference(
                                comparison.differenceFromSuggestedInBrlMinorUnits
                              )
                            : 'Disponível após preencher os valores'}
                        </span>
                      </p>
                      {comparison && item.currency === 'USD' ? (
                        <p className="text-[var(--color-text-muted)] sm:col-span-2">
                          Total convertido para comparação:{' '}
                          <span className="font-semibold text-[var(--color-text)]">
                            {formatMoney(
                              comparison.totalAmountInBrlMinorUnits,
                              'BRL'
                            )}
                          </span>
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-[var(--color-text-muted)]">
                      Este item não será registrado como compra.
                    </p>
                  )}
                </article>
              )
            })}
          </div>

          <div className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-[var(--color-text-muted)]">
              {hasPerformedPurchase
                ? 'Os valores realizados podem ser maiores ou menores que a sugestão.'
                : 'Marque pelo menos uma compra realizada para registrá-la.'}
            </p>
            <Button
              disabled={!hasPerformedPurchase || isSaving}
              onClick={() => void registerPurchases()}
            >
              {isSaving
                ? 'Registrando compras...'
                : 'Registrar compras confirmadas'}
            </Button>
          </div>
        </>
      )}

      {feedback ? (
        <p
          className="text-sm font-medium text-[var(--color-alert)]"
          role="alert"
        >
          {feedback}
        </p>
      ) : null}
    </Card>
  )
}
