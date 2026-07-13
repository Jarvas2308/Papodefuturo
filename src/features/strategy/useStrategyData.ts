import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { createSupabaseRepositories } from '../../data/repositories'
import type {
  Asset,
  AssetPrice,
  ExchangeRate,
  Purchase,
} from '../../domain/models'
import { strategyCurrentPositions, strategyMock } from './mocks/strategyMock'
import type { StrategyCategory } from './types'
import { cloneStrategy } from './utils/strategy'
import {
  buildRealStrategyPositions,
  buildStrategyFromRealData,
  strategyToAllocationTargets,
} from './realStrategy'

type StrategyDataStatus = 'loading' | 'ready' | 'error'

type RealInputs = {
  assets: Asset[]
  purchases: Purchase[]
  prices: AssetPrice[]
  rates: ExchangeRate[]
}

export type StrategyDataState = {
  strategy: StrategyCategory[] | null
  defaultStrategy: StrategyCategory[] | null
  positions: typeof strategyCurrentPositions
  status: StrategyDataStatus
  error: string | null
  needsExchangeRate: boolean
  latestUsdBrlRate: ExchangeRate | null
  isDemo: boolean
  saveStrategy(strategy: StrategyCategory[]): Promise<void>
  saveManualUsdBrl(rateScaled: number): Promise<void>
}

export function useStrategyData(): StrategyDataState {
  const { status: authStatus, client, user } = useAuth()
  const [strategy, setStrategy] = useState<StrategyCategory[] | null>(() =>
    authStatus === 'demo' ? cloneStrategy(strategyMock) : null
  )
  const [defaultStrategy, setDefaultStrategy] = useState<
    StrategyCategory[] | null
  >(() => (authStatus === 'demo' ? cloneStrategy(strategyMock) : null))
  const [positions, setPositions] = useState(strategyCurrentPositions)
  const [status, setStatus] = useState<StrategyDataStatus>(
    authStatus === 'demo' ? 'ready' : 'loading'
  )
  const [error, setError] = useState<string | null>(null)
  const [needsExchangeRate, setNeedsExchangeRate] = useState(false)
  const [latestUsdBrlRate, setLatestUsdBrlRate] = useState<ExchangeRate | null>(
    null
  )
  const [realInputs, setRealInputs] = useState<RealInputs | null>(null)

  const loadReal = useCallback(async () => {
    if (authStatus !== 'authenticated' || !client || !user) {
      return
    }

    const repositories = createSupabaseRepositories(client)
    const assets = await repositories.assets.ensureClosedUniverse(user.id)
    const [purchases, prices, targets, rates] = await Promise.all([
      repositories.purchases.list(),
      repositories.assetPrices.list(),
      repositories.allocationTargets.list(),
      repositories.exchangeRates.list(),
    ])
    const nextDefaultStrategy = buildStrategyFromRealData(assets, [])
    const nextStrategy = buildStrategyFromRealData(assets, targets)
    const realPositions = buildRealStrategyPositions(
      assets,
      purchases,
      prices,
      rates
    )

    setRealInputs({ assets, purchases, prices, rates })
    setDefaultStrategy(nextDefaultStrategy)
    setStrategy(nextStrategy)
    setPositions(realPositions.positions)
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
      .catch((loadError) => {
        if (!isActive) {
          return
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Não foi possível carregar a estratégia real.'
        )
        setStatus('error')
      })

    return () => {
      isActive = false
    }
  }, [authStatus, loadReal])

  async function saveStrategy(nextStrategy: StrategyCategory[]) {
    if (authStatus === 'demo') {
      setStrategy(cloneStrategy(nextStrategy))
      return
    }

    if (!client || !realInputs) {
      throw new Error('Dados reais da estratégia não estão disponíveis.')
    }

    const repositories = createSupabaseRepositories(client)
    const targets = strategyToAllocationTargets(nextStrategy, realInputs.assets)
    const savedTargets =
      await repositories.allocationTargets.replaceAll(targets)
    setStrategy(buildStrategyFromRealData(realInputs.assets, savedTargets))
  }

  async function saveManualUsdBrl(rateScaled: number) {
    if (authStatus === 'demo') {
      return
    }

    if (!client || !user || !realInputs) {
      throw new Error('Dados reais de câmbio não estão disponíveis.')
    }

    const repositories = createSupabaseRepositories(client)
    await repositories.exchangeRates.saveManualUsdBrl(user.id, rateScaled)
    await loadReal()
  }

  return {
    strategy,
    defaultStrategy,
    positions,
    status,
    error,
    needsExchangeRate,
    latestUsdBrlRate,
    isDemo: authStatus === 'demo',
    saveStrategy,
    saveManualUsdBrl,
  }
}
