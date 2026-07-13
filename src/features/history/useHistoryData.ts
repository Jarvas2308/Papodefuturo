import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { CLOSED_ASSET_UNIVERSE } from '../../data/assetUniverse'
import { createSupabaseRepositories } from '../../data/repositories'
import type { Asset, CurrencyCode, Purchase } from '../../domain/models'
import { historyMovements } from './mocks/historyMock'
import type {
  HistoryCategory,
  HistoryMovement,
  HistoryMovementStatus,
} from './types'

type HistoryDataStatus = 'loading' | 'ready' | 'error'

export type PurchaseDraft = {
  assetId: string
  quantity: number
  unitPriceInMinorUnits: number
  purchasedAt: string
  notes?: string
}

const CATEGORY_BY_DOMAIN: Record<string, HistoryCategory> = {
  'brazilian-stock': 'brazilian-stocks',
  'real-estate-fund': 'real-estate-funds',
  'international-etf': 'international',
  'fixed-income': 'cash',
  cash: 'cash',
}

function getAssetCurrency(asset: Asset): CurrencyCode {
  const definition = CLOSED_ASSET_UNIVERSE.find(
    (candidate) => candidate.ticker.toUpperCase() === asset.ticker.toUpperCase()
  )

  if (!definition) {
    throw new Error(`Ativo fora do universo fechado: ${asset.ticker}`)
  }

  return definition.currency
}

function mapPurchaseStatus(status: Purchase['status']): HistoryMovementStatus {
  if (status === 'planned') {
    return 'pending'
  }

  if (status === 'cancelled') {
    return 'cancelled'
  }

  return 'completed'
}

function mapPurchasesToHistory(
  purchases: readonly Purchase[],
  assets: readonly Asset[]
): HistoryMovement[] {
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]))

  return purchases.flatMap((purchase): HistoryMovement[] => {
    const asset = assetsById.get(purchase.assetId)
    if (!asset) {
      return []
    }

    return [
      {
        id: purchase.id,
        date: purchase.tradeDate,
        type: 'purchase',
        assetId: asset.id,
        ticker: asset.ticker,
        assetName: asset.name,
        category: CATEGORY_BY_DOMAIN[asset.category] ?? 'cash',
        quantity: purchase.quantity,
        unitPriceInCents: purchase.unitPrice.amountInMinorUnits,
        totalValueInCents: purchase.totalAmount.amountInMinorUnits,
        currency: purchase.totalAmount.currency,
        status: mapPurchaseStatus(purchase.status),
      },
    ]
  })
}

export function useHistoryData() {
  const { status: authStatus, client, user } = useAuth()
  const [assets, setAssets] = useState<Asset[]>([])
  const [movements, setMovements] = useState<HistoryMovement[]>(() =>
    authStatus === 'demo' ? historyMovements : []
  )
  const [status, setStatus] = useState<HistoryDataStatus>(
    authStatus === 'demo' ? 'ready' : 'loading'
  )
  const [error, setError] = useState<string | null>(null)

  const loadReal = useCallback(async () => {
    if (authStatus !== 'authenticated' || !client || !user) {
      return
    }

    const repositories = createSupabaseRepositories(client)
    const nextAssets = await repositories.assets.ensureClosedUniverse(user.id)
    const purchases = await repositories.purchases.list()

    setAssets(nextAssets)
    setMovements(mapPurchasesToHistory(purchases, nextAssets))
    setError(null)
    setStatus('ready')
  }, [authStatus, client, user])

  useEffect(() => {
    if (authStatus === 'demo') {
      setAssets([])
      setMovements(historyMovements)
      setError(null)
      setStatus('ready')
      return
    }

    if (authStatus !== 'authenticated') {
      setStatus('loading')
      return
    }

    let isActive = true
    setStatus('loading')
    setError(null)

    void loadReal().catch((caughtError) => {
      if (!isActive) {
        return
      }

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Não foi possível carregar o histórico real.'
      )
      setStatus('error')
    })

    return () => {
      isActive = false
    }
  }, [authStatus, loadReal])

  async function createPurchase(draft: PurchaseDraft) {
    if (authStatus === 'demo') {
      throw new Error('O registro real de compras exige uma sessão autenticada.')
    }

    if (!client || !user) {
      throw new Error('Sessão autenticada indisponível.')
    }

    const asset = assets.find((candidate) => candidate.id === draft.assetId)
    if (!asset) {
      throw new Error('Selecione um ativo válido.')
    }

    const repositories = createSupabaseRepositories(client)
    await repositories.purchases.create({
      userId: user.id,
      assetId: asset.id,
      quantity: draft.quantity,
      unitPriceInMinorUnits: draft.unitPriceInMinorUnits,
      currency: getAssetCurrency(asset),
      purchasedAt: draft.purchasedAt,
      notes: draft.notes,
    })
    await loadReal()
  }

  return {
    assets,
    movements,
    status,
    error,
    isDemo: authStatus === 'demo',
    createPurchase,
  }
}
