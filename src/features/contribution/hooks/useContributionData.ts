import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../auth/useAuth'
import { createSupabaseRepositories } from '../../../data/repositories'
import type {
  Asset,
  AssetPrice,
  ExchangeRate,
  Purchase,
} from '../../../domain/models'
import {
  buildRealStrategyPositions,
  buildStrategyFromRealData,
} from '../../strategy/realStrategy'
import { contributionMock } from '../mocks/contributionMock'
import type { AllocationTarget, ContributionPosition } from '../types'

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

  return {
    positions: eligibleAssets.map((asset) => ({
      assetId: asset.id,
      category:
        CATEGORY_BY_DOMAIN[asset.category as keyof typeof CATEGORY_BY_DOMAIN],
      currentValueInCents: currentValueByAsset.get(asset.id) ?? 0,
    })),
    realPositions,
  }
}

export function useContributionData() {
  const { status: authStatus, client, user } = useAuth()
  const [positions, setPositions] = useState<ContributionPosition[]>(() =>
    authStatus === 'demo' ? contributionMock.carteiraAtual : []
  )
  const [resultPositions, setResultPositions] = useState<ResultPosition[]>(
    () => (authStatus === 'demo' ? contributionMock.posicoesVisuais : [])
  )
  const [targets, setTargets] = useState<AllocationTarget[]>(() =>
    authStatus === 'demo' ? contributionMock.metasAlocacao : []
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
    const assets = await repositories.assets.ensureClosedUniverse(user.id)
    const [purchases, prices, allocationTargets, rates] = await Promise.all([
      repositories.purchases.list(),
      repositories.assetPrices.list(),
      repositories.allocationTargets.list(),
      repositories.exchangeRates.list(),
    ])
    const strategy = buildStrategyFromRealData(assets, allocationTargets)
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
    const nextTargets: AllocationTarget[] = strategy.map((category) => ({
      category: category.id,
      targetPercentage: category.targetInBasisPoints / 100,
    }))

    setPositions(nextPositions)
    setResultPositions(nextResultPositions)
    setTargets(nextTargets)
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

  return {
    positions,
    resultPositions,
    targets,
    status,
    error,
    needsExchangeRate,
    latestUsdBrlRate,
    isDemo: authStatus === 'demo',
    saveManualUsdBrl,
  }
}
