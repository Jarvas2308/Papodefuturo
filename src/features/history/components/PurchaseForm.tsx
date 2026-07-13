import { useState, type FormEvent } from 'react'
import { CLOSED_ASSET_UNIVERSE } from '../../../data/assetUniverse'
import type { Asset, Purchase } from '../../../domain/models'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import type { PurchaseDraft } from '../useHistoryData'

type PurchaseFormProps = {
  assets: Asset[]
  editingPurchase: Purchase | null
  onCreate(draft: PurchaseDraft): Promise<void>
  onUpdate(purchaseId: string, draft: PurchaseDraft): Promise<void>
  onCancelEdit(): void
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

function formatMinorUnitsForInput(amountInMinorUnits: number): string {
  return (amountInMinorUnits / 100).toFixed(2).replace('.', ',')
}

function PurchaseFormFields({
  assets,
  editingPurchase,
  onCreate,
  onUpdate,
  onCancelEdit,
}: PurchaseFormProps) {
  const isEditing = editingPurchase !== null
  const [assetId, setAssetId] = useState(
    editingPurchase?.assetId ?? assets[0]?.id ?? ''
  )
  const [quantity, setQuantity] = useState(
    editingPurchase ? String(editingPurchase.quantity) : ''
  )
  const [unitPrice, setUnitPrice] = useState(
    editingPurchase
      ? formatMinorUnitsForInput(editingPurchase.unitPrice.amountInMinorUnits)
      : ''
  )
  const [purchasedAt, setPurchasedAt] = useState(
    editingPurchase?.tradeDate ?? new Date().toISOString().slice(0, 10)
  )
  const [notes, setNotes] = useState(editingPurchase?.notes ?? '')
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
      const draft = {
        assetId,
        quantity: parsedQuantity,
        unitPriceInMinorUnits: parsedUnitPrice,
        purchasedAt,
        notes,
      }

      if (editingPurchase) {
        await onUpdate(editingPurchase.id, draft)
        onCancelEdit()
      } else {
        await onCreate(draft)
        setQuantity('')
        setUnitPrice('')
        setNotes('')
      }
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
          {isEditing ? 'Editar compra' : 'Registrar compra'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          {isEditing
            ? 'Atualize os fatos da compra. Os valores derivados serão recalculados a partir do registro salvo.'
            : 'A compra será vinculada à sua conta e usada nos cálculos de carteira, estratégia e próximos aportes.'}
        </p>
        {isEditing ? (
          <p className="mt-3 text-sm font-medium text-[var(--color-text)]">
            Editando a compra de {selectedAsset?.ticker ?? 'ativo selecionado'}.
          </p>
        ) : null}
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
          <div className="flex flex-wrap gap-2">
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
              {isSaving
                ? 'Salvando...'
                : isEditing
                  ? 'Salvar alterações'
                  : 'Registrar compra'}
            </Button>
            {isEditing ? (
              <Button
                type="button"
                variant="secondary"
                disabled={isSaving}
                onClick={onCancelEdit}
              >
                Cancelar edição
              </Button>
            ) : null}
          </div>
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

export function PurchaseForm(props: PurchaseFormProps) {
  return (
    <PurchaseFormFields
      key={props.editingPurchase?.id ?? 'new-purchase'}
      {...props}
    />
  )
}
