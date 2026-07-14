import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../auth/useAuth'
import {
  createSupabaseRepositories,
  type AppRepositories,
} from '../../../data/repositories'
import { refreshMarketDataBestEffort } from '../../../data/marketDataRefresh'
import { getLatestAssetPricesByAsset } from '../../../domain/latestAssetPrices'
import type { CreatePurchaseBatchItem } from '../../../data/repositories/contracts'
import type {
  AllocationTarget as DomainAllocationTarget,
  Asset,
  AssetPrice,
  ExchangeRate,
  EntityId,
  Purchase,
} from '../../../domain/models'
import { convertMoney, getLatestUsdBrlRate } from '../../../domain/models'
import {
  buildRealStrategyPositions,
  buildStrategyFromRealData,
} from '../../strategy/realStrategy'
import { contributionMock } from '../mocks/contributionMock'
import type {
  AllocationTarget,
  ContributionAssetTarget,
  ContributionPosition,
} from '../types'
import { buildGlobalAssetTargets } from '../utils/buildGlobalAssetTargets'
import { getContributionAssetCurrency } from '../utils/confirmedPurchases'

type ContributionDataStatus = 'loading' | 'ready' | 'error'

type ResultPosition = {
  id: string
  ticker: string
  name: string
  categoryLabel: string
}

const CATEGORY_BY_DOMAIN = {
  'brazilian-stock': 'brazilian-stocks',
  'real-estate-fund': 'real-estate-funds',
  'international-etf': 'international',
} as const

const CATEGORY_LABELS = {
  'brazilian-stocks': 'Ações brasileiras',
  'real-estate-funds': 'Fundos imobiliários',
  international: 'Internacional',
} as const

export async function loadRealContributionInputs(
  repositories: AppRepositories,
  userId: EntityId
) {
  const assets = await repositories.assets.ensureClosedUniverse(userId)
  await refreshMarketDataBestEffort(repositories.marketData)
  const [purchases, prices, allocationTargets, rates] = await Promise.all([
    repositories.purchases.list(),
    repositories.assetPrices.list(),
    repositories.allocationTargets.list(),
    repositories.exchangeRates.list(),
  ])

  return { assets, purchases, prices, allocationTargets, rates }
}

export function buildContributionPositions(
  assets: readonly Asset[],
  purchases: readonly Purchase[],
  prices: readonly AssetPrice[],
  rates: readonly ExchangeRate[]
) {
  const realPositions = buildRealStrategyPositions(
    assets,
    purchases,
    prices,
    rates
  )
  const currentValueByAsset = new Map(
    realPositions.positions.map((position) => [
      position.assetId,
      position.currentValueInCents,
    ])
  )
  const eligibleAssets = assets.filter(
    (asset) => asset.status === 'active' && asset.category in CATEGORY_BY_DOMAIN
  )
  const latestPricesByAsset = getLatestAssetPricesByAsset(prices)
  const latestUsdBrlRate = getLatestUsdBrlRate(rates)

  return {
    positions: eligibleAssets.map((asset) => {
      const latestPrice = latestPricesByAsset.get(asset.id)
      const currency = getContributionAssetCurrency(asset)

      if (latestPrice && latestPrice.price.currency !== currency) {
        throw new Error(`Asset price currency mismatch for ${asset.ticker}`)
      }

      const unitPriceInCents = latestPrice
        ? currency === 'BRL'
          ? latestPrice.price.amountInMinorUnits
          : latestUsdBrlRate
            ? convertMoney(latestPrice.price, 'BRL', latestUsdBrlRate)
                .amountInMinorUnits
            : null
        : null

      return {
        assetId: asset.id,
        category:
          CATEGORY_BY_DOMAIN[asset.category as keyof typeof CATEGORY_BY_DOMAIN],
        currentValueInCents: currentValueByAsset.get(asset.id) ?? 0,
        unitPriceInCents,
      }
    }),
    realPositions,
  }
}

export function buildContributionTargets(
  assets: readonly Asset[],
  allocationTargets: readonly DomainAllocationTarget[]
) {
  const strategy = buildStrategyFromRealData(assets, allocationTargets)

  return {
    categoryTargets: strategy.map((category) => ({
      category: category.id,
      targetPercentage: category.targetInBasisPoints / 100,
    })),
    assetTargets: buildGlobalAssetTargets(strategy),
  }
}

export function useContributionData() {
  const { status: authStatus, client, user } = useAuth()
  const [positions, setPositions] = useState<ContributionPosition[]>(() =>
    authStatus === 'demo' ? contributionMock.carteiraAtual : []
  )
  const [assets, setAssets] = useState<Asset[]>([])
  const [resultPositions, setResultPositions] = useState<ResultPosition[]>(
    () => (authStatus === 'demo' ? contributionMock.posicoesVisuais : [])
  )
  const [targets, setTargets] = useState<AllocationTarget[]>(() =>
    authStatus === 'demo' ? contributionMock.metasAlocacao : []
  )
  const [assetTargets, setAssetTargets] = useState<ContributionAssetTarget[]>(
    () => (authStatus === 'demo' ? contributionMock.metasGlobaisPorAtivo : [])
  )
  const [status, setStatus] = useState<ContributionDataStatus>(
    authStatus === 'demo' ? 'ready' : 'loading'
  )
  const [error, setError] = useState<string | null>(null)
  const [needsExchangeRate, setNeedsExchangeRate] = useState(false)
  const [latestUsdBrlRate, setLatestUsdBrlRate] = useState<ExchangeRate | null>(
    null
  )

  const loadReal = useCallback(async () => {
    if (authStatus !== 'authenticated' || !client || !user) {
      return
    }

    const repositories = createSupabaseRepositories(client)
    const { assets, purchases, prices, allocationTargets, rates } =
      await loadRealContributionInputs(repositories, user.id)
    const contributionTargets = buildContributionTargets(
      assets,
      allocationTargets
    )
    const contributionPositions = buildContributionPositions(
      assets,
      purchases,
      prices,
      rates
    )
    const { realPositions } = contributionPositions
    const nextPositions: ContributionPosition[] =
      contributionPositions.positions
    const eligibleAssets = assets.filter(
      (asset) =>
        asset.status === 'active' && asset.category in CATEGORY_BY_DOMAIN
    )
    const nextResultPositions: ResultPosition[] = eligibleAssets.map(
      (asset) => {
        const category =
          CATEGORY_BY_DOMAIN[asset.category as keyof typeof CATEGORY_BY_DOMAIN]

        return {
          id: asset.id,
          ticker: asset.ticker,
          name: asset.name,
          categoryLabel: CATEGORY_LABELS[category],
        }
      }
    )
    const nextTargets: AllocationTarget[] = contributionTargets.categoryTargets
    const nextAssetTargets = contributionTargets.assetTargets

    setPositions(nextPositions)
    setAssets(assets)
    setResultPositions(nextResultPositions)
    setTargets(nextTargets)
    setAssetTargets(nextAssetTargets)
    setNeedsExchangeRate(realPositions.needsExchangeRate)
    setLatestUsdBrlRate(realPositions.latestUsdBrlRate)
    setError(null)
    setStatus('ready')
  }, [authStatus, client, user])

  useEffect(() => {
    if (authStatus !== 'authenticated') {
      return
    }

    let isActive = true

    void Promise.resolve()
      .then(async () => {
        if (!isActive) {
          return
        }

        await loadReal()
      })
      .catch((caughtError) => {
        if (!isActive) {
          return
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'Não foi possível carregar os dados reais do aporte.'
        )
        setStatus('error')
      })

    return () => {
      isActive = false
    }
  }, [authStatus, loadReal])

  async function saveManualUsdBrl(rateScaled: number) {
    if (!client || !user || authStatus !== 'authenticated') {
      throw new Error('Sessão autenticada indisponível.')
    }

    const repositories = createSupabaseRepositories(client)
    await repositories.exchangeRates.saveManualUsdBrl(user.id, rateScaled)
    await loadReal()
  }

  async function registerConfirmedPurchases(
    purchases: readonly CreatePurchaseBatchItem[]
  ) {
    if (authStatus === 'demo') {
      throw new Error(
        'O registro de compras confirmadas exige uma sessão autenticada.'
      )
    }

    if (!client || !user) {
      throw new Error('Sessão autenticada indisponível.')
    }

    const purchasesWithDerivedCurrency = purchases.map((purchase) => {
      const asset = assets.find(
        (candidate) => candidate.id === purchase.assetId
      )

      if (!asset) {
        throw new Error('A compra informada precisa pertencer à sua carteira.')
      }

      return {
        ...purchase,
        currency: getContributionAssetCurrency(asset),
      }
    })

    const repositories = createSupabaseRepositories(client)
    const registeredPurchases = await repositories.purchases.createMany({
      userId: user.id,
      purchases: purchasesWithDerivedCurrency,
    })
    await loadReal()

    return registeredPurchases
  }

  return {
    assets,
    positions,
    resultPositions,
    targets,
    assetTargets,
    status,
    error,
    needsExchangeRate,
    latestUsdBrlRate,
    isDemo: authStatus === 'demo',
    saveManualUsdBrl,
    registerConfirmedPurchases,
  }
}
