import { CLOSED_ASSET_UNIVERSE } from '../../../data/assetUniverse'
import type { CreatePurchaseBatchItem } from '../../../data/repositories/contracts'
import { calculatePurchaseTotalInMinorUnits } from '../../../data/repositories/supabaseRepositories'
import { convertMoney } from '../../../domain/models'
import type { Asset, CurrencyCode, ExchangeRate } from '../../../domain/models'
import type { ContributionDistribution } from '../types'

export type ContributionConfirmationPosition = {
  id: string
  ticker: string
  name: string
  categoryLabel: string
}

export type ContributionConfirmationItem = {
  assetId: string
  ticker: string
  name: string
  categoryLabel: string
  currency: CurrencyCode
  suggestedAmountInBrlMinorUnits: number
  estimatedSuggestedAmountInUsdMinorUnits: number | null
}

export type ContributionPurchaseDraft = {
  assetId: string
  isPerformed: boolean
  quantity: string
  unitPrice: string
  purchasedAt: string
}

export type ContributionPurchaseComparison = {
  totalAmountInMinorUnits: number
  totalAmountInBrlMinorUnits: number
  differenceFromSuggestedInBrlMinorUnits: number
}

export function getContributionAssetCurrency(asset: Asset): CurrencyCode {
  const definition = CLOSED_ASSET_UNIVERSE.find(
    (candidate) => candidate.ticker.toUpperCase() === asset.ticker.toUpperCase()
  )

  if (!definition) {
    throw new Error(`Ativo fora do universo fechado: ${asset.ticker}`)
  }

  return definition.currency
}

export function buildContributionConfirmationItems(
  distribution: readonly ContributionDistribution[],
  positions: readonly ContributionConfirmationPosition[],
  assets: readonly Asset[],
  exchangeRate: ExchangeRate | null
): ContributionConfirmationItem[] {
  const positionsById = new Map(
    positions.map((position) => [position.id, position])
  )
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]))

  return distribution.flatMap((suggestion): ContributionConfirmationItem[] => {
    if (suggestion.valorEmCentavos <= 0) {
      return []
    }

    const position = positionsById.get(suggestion.assetId)
    const asset = assetsById.get(suggestion.assetId)

    if (!position || !asset) {
      throw new Error('Não foi possível identificar o ativo da sugestão.')
    }

    const currency = getContributionAssetCurrency(asset)
    const estimatedSuggestedAmountInUsdMinorUnits =
      currency === 'USD' && exchangeRate
        ? convertMoney(
            {
              amountInMinorUnits: suggestion.valorEmCentavos,
              currency: 'BRL',
            },
            'USD',
            exchangeRate
          ).amountInMinorUnits
        : null

    return [
      {
        assetId: asset.id,
        ticker: position.ticker,
        name: position.name,
        categoryLabel: position.categoryLabel,
        currency,
        suggestedAmountInBrlMinorUnits: suggestion.valorEmCentavos,
        estimatedSuggestedAmountInUsdMinorUnits,
      },
    ]
  })
}

export function createContributionPurchaseDrafts(
  items: readonly ContributionConfirmationItem[],
  purchasedAt: string
): ContributionPurchaseDraft[] {
  return items.map((item) => ({
    assetId: item.assetId,
    isPerformed: false,
    quantity: '',
    unitPrice: '',
    purchasedAt,
  }))
}

export function shouldOfferContributionPurchaseConfirmation(isDemo: boolean) {
  return !isDemo
}

function parsePositiveQuantity(value: string): number | null {
  const normalized = value.trim().replace(',', '.')

  if (!/^\d+(?:\.\d{1,6})?$/.test(normalized)) {
    return null
  }

  const quantity = Number(normalized)
  return Number.isFinite(quantity) && quantity > 0 ? quantity : null
}

function parsePositiveMinorUnits(value: string): number | null {
  const normalized = value.trim().replace(',', '.')

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    return null
  }

  const amountInMinorUnits = Math.round(Number(normalized) * 100)
  return Number.isSafeInteger(amountInMinorUnits) && amountInMinorUnits > 0
    ? amountInMinorUnits
    : null
}

function isValidPurchaseDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}

function getDraftFacts(
  item: ContributionConfirmationItem,
  draft: ContributionPurchaseDraft
) {
  const quantity = parsePositiveQuantity(draft.quantity)
  if (quantity === null) {
    throw new Error(`Informe uma quantidade positiva para ${item.ticker}.`)
  }

  const unitPriceInMinorUnits = parsePositiveMinorUnits(draft.unitPrice)
  if (unitPriceInMinorUnits === null) {
    throw new Error(
      `Informe um preço unitário maior que zero para ${item.ticker}.`
    )
  }

  if (!isValidPurchaseDate(draft.purchasedAt)) {
    throw new Error(`Informe uma data de compra válida para ${item.ticker}.`)
  }

  return {
    quantity,
    unitPriceInMinorUnits,
    purchasedAt: draft.purchasedAt,
  }
}

export function calculateContributionPurchaseComparison(
  item: ContributionConfirmationItem,
  draft: ContributionPurchaseDraft,
  exchangeRate: ExchangeRate | null
): ContributionPurchaseComparison {
  const facts = getDraftFacts(item, draft)
  const totalAmountInMinorUnits = calculatePurchaseTotalInMinorUnits(
    facts.quantity,
    facts.unitPriceInMinorUnits
  )

  if (item.currency === 'USD' && !exchangeRate) {
    throw new Error(
      'Informe a cotação USD/BRL antes de confirmar compras em dólar.'
    )
  }

  const totalAmountInBrlMinorUnits =
    item.currency === 'BRL'
      ? totalAmountInMinorUnits
      : convertMoney(
          {
            amountInMinorUnits: totalAmountInMinorUnits,
            currency: 'USD',
          },
          'BRL',
          exchangeRate!
        ).amountInMinorUnits

  return {
    totalAmountInMinorUnits,
    totalAmountInBrlMinorUnits,
    differenceFromSuggestedInBrlMinorUnits:
      totalAmountInBrlMinorUnits - item.suggestedAmountInBrlMinorUnits,
  }
}

export function buildConfirmedPurchaseBatch(
  items: readonly ContributionConfirmationItem[],
  drafts: readonly ContributionPurchaseDraft[],
  exchangeRate: ExchangeRate | null
): CreatePurchaseBatchItem[] {
  const draftsByAssetId = new Map(drafts.map((draft) => [draft.assetId, draft]))
  const performedItems = items.flatMap((item) => {
    const draft = draftsByAssetId.get(item.assetId)

    if (!draft || !draft.isPerformed) {
      return []
    }

    const facts = getDraftFacts(item, draft)
    calculateContributionPurchaseComparison(item, draft, exchangeRate)

    return [
      {
        assetId: item.assetId,
        quantity: facts.quantity,
        unitPriceInMinorUnits: facts.unitPriceInMinorUnits,
        currency: item.currency,
        purchasedAt: facts.purchasedAt,
      },
    ]
  })

  if (performedItems.length === 0) {
    throw new Error('Selecione pelo menos uma compra realizada para registrar.')
  }

  return performedItems
}
