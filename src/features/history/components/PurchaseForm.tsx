import { useState, type FormEvent } from 'react'
import { CLOSED_ASSET_UNIVERSE } from '../../../data/assetUniverse'
import type { Asset } from '../../../domain/models'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import type { PurchaseDraft } from '../useHistoryData'

type PurchaseFormProps = {
  assets: Asset[]
  onSave(draft: PurchaseDraft): Promise<void>
}

function parseQuantity(value: string): number | null {
  const normalized = value.trim().replace(',', '.')
  if (!/^\d+(?:\.\d{1,6})?$/.test(normalized)) {
    return null
  }

  const quantity = Number(normalized)
  return Number.isFinite(quantity) && quantity > 0 ? quantity : null
}

function parseMoneyToMinorUnits(value: string): number | null {
  const normalized = value.trim().replace(',', '.')
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    return null
  }

  const amount = Math.round(Number(normalized) * 100)
  return Number.isSafeInteger(amount) && amount >= 0 ? amount : null
}

function getCurrency(asset: Asset | undefined) {
  return CLOSED_ASSET_UNIVERSE.find(
    (definition) =>
      definition.ticker.toUpperCase() === asset?.ticker.toUpperCase()
  )?.currency
}

export function PurchaseForm({ assets, onSave }: PurchaseFormProps) {
  const [assetId, setAssetId] = useState(assets[0]?.id ?? '')
  const [quantity, setQuantity] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [purchasedAt, setPurchasedAt] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [notes, setNotes] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const selectedAsset = assets.find((asset) => asset.id === assetId)
  const currency = getCurrency(selectedAsset)
  const parsedQuantity = parseQuantity(quantity)
  const parsedUnitPrice = parseMoneyToMinorUnits(unitPrice)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (
      !assetId ||
      parsedQuantity === null ||
      parsedUnitPrice === null ||
      !purchasedAt ||
      isSaving
    ) {
      setFeedback('Revise o ativo, a quantidade, o preço unitário e a data.')
      return
    }

    setIsSaving(true)
    setFeedback('')

    try {
      await onSave({
        assetId,
        quantity: parsedQuantity,
        unitPriceInMinorUnits: parsedUnitPrice,
        purchasedAt,
        notes,
      })
      setQuantity('')
      setUnitPrice('')
      setNotes('')
      setFeedback('Compra registrada com sucesso na sua carteira.')
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : 'Não foi possível registrar a compra.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="space-y-5 p-5 sm:p-6">
      <div>
        <p className="text-sm font-semibold text-[var(--color-primary)]">
          Persistência real
        </p>
        <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
          Registrar compra
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          A compra será vinculada à sua conta e usada nos cálculos de carteira,
          estratégia e próximos aportes.
        </p>
      </div>

      <form
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"
        onSubmit={handleSubmit}
      >
        <label className="text-sm font-medium text-[var(--color-text)] xl:col-span-2">
          Ativo
          <select
            className="mt-2 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)]"
            value={assetId}
            onChange={(event) => setAssetId(event.target.value)}
          >
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.ticker} — {asset.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-[var(--color-text)]">
          Quantidade
          <input
            className="mt-2 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)]"
            inputMode="decimal"
            placeholder="10"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </label>

        <label className="text-sm font-medium text-[var(--color-text)]">
          Preço unitário {currency ? `(${currency})` : ''}
          <input
            className="mt-2 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)]"
            inputMode="decimal"
            placeholder="35,90"
            value={unitPrice}
            onChange={(event) => setUnitPrice(event.target.value)}
          />
        </label>

        <label className="text-sm font-medium text-[var(--color-text)]">
          Data
          <input
            className="mt-2 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)]"
            type="date"
            value={purchasedAt}
            onChange={(event) => setPurchasedAt(event.target.value)}
          />
        </label>

        <label className="text-sm font-medium text-[var(--color-text)] md:col-span-2 xl:col-span-4">
          Observação opcional
          <input
            className="mt-2 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)]"
            maxLength={500}
            placeholder="Ex.: aporte mensal de julho"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>

        <div className="flex items-end">
          <Button
            type="submit"
            disabled={
              !assetId ||
              parsedQuantity === null ||
              parsedUnitPrice === null ||
              !purchasedAt ||
              isSaving
            }
          >
            {isSaving ? 'Salvando...' : 'Registrar compra'}
          </Button>
        </div>
      </form>

      {feedback ? (
        <p
          className="text-sm font-medium text-[var(--color-text)]"
          aria-live="polite"
        >
          {feedback}
        </p>
      ) : null}
    </Card>
  )
}
