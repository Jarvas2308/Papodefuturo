import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { createSupabaseRepositories } from '../../data/repositories'
import type { AppRepositories } from '../../data/repositories'
import { refreshMarketDataBestEffort } from '../../data/marketDataRefresh'
import type { EntityId, ExchangeRate } from '../../domain/models'
import {
  getStaleAssetPrices,
  type StaleAssetPrice,
} from '../../domain/priceFreshness'
import { portfolioMock } from '../../mocks/portfolio'
import { buildPortfolioView } from './buildPortfolioView'
import type { PortfolioMock } from './types'

type PortfolioDataStatus = 'loading' | 'ready' | 'error'

export type PortfolioLoadState = {
  data: PortfolioMock | null
  status: PortfolioDataStatus
  error: string | null
  needsExchangeRate: boolean
  latestUsdBrlRate: ExchangeRate | null
  marketDataWarning: string | null
  stalePrices: StaleAssetPrice[]
}

export type PortfolioDataState = PortfolioLoadState & {
  isDemo: boolean
}

export function createInitialPortfolioLoadState(
  isDemo: boolean
): PortfolioLoadState {
  return {
    data: isDemo ? portfolioMock : null,
    status: isDemo ? 'ready' : 'loading',
    error: null,
    needsExchangeRate: false,
    latestUsdBrlRate: null,
    marketDataWarning: null,
    stalePrices: [],
  }
}

export async function loadRealPortfolioState(
  repositories: AppRepositories,
  userId: EntityId
): Promise<PortfolioLoadState> {
  const assets = await repositories.assets.ensureClosedUniverse(userId)
  const marketDataRefresh = await refreshMarketDataBestEffort(
    repositories.marketData
  )
  const [purchases, prices, targets, rates] = await Promise.all([
    repositories.purchases.list(),
    repositories.assetPrices.list(assets),
    repositories.allocationTargets.list(),
    repositories.exchangeRates.list(),
  ])
  const portfolio = buildPortfolioView(
    assets,
    purchases,
    prices,
    targets,
    rates
  )

  return {
    data: portfolio.data,
    status: 'ready',
    error: null,
    needsExchangeRate: portfolio.needsExchangeRate,
    latestUsdBrlRate: portfolio.latestUsdBrlRate,
    marketDataWarning: marketDataRefresh.warning,
    stalePrices: getStaleAssetPrices(assets, prices, new Date()),
  }
}

export function usePortfolioData(): PortfolioDataState {
  const { status: authStatus, client, user } = useAuth()
  const [state, setState] = useState<PortfolioLoadState>(() =>
    createInitialPortfolioLoadState(authStatus === 'demo')
  )

  const loadReal = useCallback(async (): Promise<PortfolioLoadState | null> => {
    if (authStatus !== 'authenticated' || !client || !user) {
      return null
    }

    const repositories = createSupabaseRepositories(client)
    return loadRealPortfolioState(repositories, user.id)
  }, [authStatus, client, user])

  useEffect(() => {
    if (authStatus !== 'authenticated') {
      return
    }

    let isActive = true

    void loadReal()
      .then((nextState) => {
        if (!isActive || !nextState) {
          return
        }

        setState(nextState)
      })
      .catch((error) => {
        if (!isActive) {
          return
        }

        setState({
          data: null,
          status: 'error',
          error:
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar a carteira real.',
          needsExchangeRate: false,
          latestUsdBrlRate: null,
          marketDataWarning: null,
          stalePrices: [],
        })
      })

    return () => {
      isActive = false
    }
  }, [authStatus, loadReal])

  return {
    ...state,
    isDemo: authStatus === 'demo',
  }
}
