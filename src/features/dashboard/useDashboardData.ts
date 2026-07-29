import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { getClosedAssetCurrency } from '../../data/assetUniverse'
import { refreshMarketDataBestEffort } from '../../data/marketDataRefresh'
import {
  createSupabaseRepositories,
  type AppRepositories,
} from '../../data/repositories'
import { buildPortfolioSnapshot } from '../../domain/portfolioSnapshot'
import type { ExchangeRate, EntityId } from '../../domain/models'
import { dashboardMock } from '../../mocks/dashboard'
import { buildDashboardView } from './buildDashboardView'
import type { DashboardView } from './types'

type DashboardDataStatus = 'loading' | 'ready' | 'error'

export type DashboardLoadState = {
  data: DashboardView | null
  status: DashboardDataStatus
  error: string | null
  needsExchangeRate: boolean
  latestUsdBrlRate: ExchangeRate | null
  marketDataWarning: string | null
}

export type DashboardDataState = DashboardLoadState & {
  isDemo: boolean
}

type LoadRealDashboardInput = {
  repositories: AppRepositories
  userId: EntityId
  userMetadata: Record<string, unknown> | null | undefined
  now?: Date
}

export function createInitialDashboardLoadState(
  isDemo: boolean
): DashboardLoadState {
  return {
    data: isDemo ? dashboardMock : null,
    status: isDemo ? 'ready' : 'loading',
    error: null,
    needsExchangeRate: false,
    latestUsdBrlRate: null,
    marketDataWarning: null,
  }
}

export async function loadRealDashboardState({
  repositories,
  userId,
  userMetadata,
  now,
}: LoadRealDashboardInput): Promise<DashboardLoadState> {
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
  const result = buildPortfolioSnapshot({
    assets,
    purchases,
    prices,
    targets,
    rates,
    resolveAssetCurrency: getClosedAssetCurrency,
  })

  if (!result.snapshot) {
    return {
      data: null,
      status: 'ready',
      error: null,
      needsExchangeRate: result.needsExchangeRate,
      latestUsdBrlRate: result.latestUsdBrlRate,
      marketDataWarning: marketDataRefresh.warning,
    }
  }

  return {
    data: buildDashboardView({
      assets,
      purchases,
      snapshot: result.snapshot,
      userMetadata,
      now,
    }),
    status: 'ready',
    error: null,
    needsExchangeRate: false,
    latestUsdBrlRate: result.latestUsdBrlRate,
    marketDataWarning: marketDataRefresh.warning,
  }
}

export function useDashboardData(): DashboardDataState {
  const { status: authStatus, client, user } = useAuth()
  const [state, setState] = useState<DashboardLoadState>(() =>
    createInitialDashboardLoadState(authStatus === 'demo')
  )

  const loadReal = useCallback(async (): Promise<DashboardLoadState | null> => {
    if (authStatus !== 'authenticated' || !client || !user) {
      return null
    }

    return loadRealDashboardState({
      repositories: createSupabaseRepositories(client),
      userId: user.id,
      userMetadata: user.user_metadata,
    })
  }, [authStatus, client, user])

  useEffect(() => {
    if (authStatus !== 'authenticated') {
      return
    }

    let isActive = true

    void loadReal()
      .then((nextState) => {
        if (isActive && nextState) {
          setState(nextState)
        }
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
              : 'Não foi possível carregar o painel real.',
          needsExchangeRate: false,
          latestUsdBrlRate: null,
          marketDataWarning: null,
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
