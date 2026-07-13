import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { createSupabaseRepositories } from '../../data/repositories'
import { portfolioMock } from '../../mocks/portfolio'
import type { PortfolioMock } from './types'
import { buildPortfolioView } from './buildPortfolioView'

type PortfolioDataStatus = 'loading' | 'ready' | 'error'

type PortfolioDataState = {
  data: PortfolioMock | null
  status: PortfolioDataStatus
  error: string | null
}

export function usePortfolioData(): PortfolioDataState {
  const { status: authStatus, client, user } = useAuth()
  const [state, setState] = useState<PortfolioDataState>(() => ({
    data: authStatus === 'demo' ? portfolioMock : null,
    status: authStatus === 'demo' ? 'ready' : 'loading',
    error: null,
  }))

  useEffect(() => {
    if (authStatus === 'demo') {
      setState({ data: portfolioMock, status: 'ready', error: null })
      return
    }

    if (authStatus !== 'authenticated') {
      setState({ data: null, status: 'loading', error: null })
      return
    }

    if (!client || !user) {
      setState({
        data: null,
        status: 'error',
        error: 'Sessão autenticada sem cliente Supabase disponível.',
      })
      return
    }

    let isActive = true
    const repositories = createSupabaseRepositories(client)

    setState({ data: null, status: 'loading', error: null })

    void (async () => {
      try {
        const assets = await repositories.assets.ensureClosedUniverse(user.id)
        const [purchases, prices, targets] = await Promise.all([
          repositories.purchases.list(),
          repositories.assetPrices.list(),
          repositories.allocationTargets.list(),
        ])

        if (!isActive) {
          return
        }

        setState({
          data: buildPortfolioView(assets, purchases, prices, targets),
          status: 'ready',
          error: null,
        })
      } catch (error) {
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
        })
      }
    })()

    return () => {
      isActive = false
    }
  }, [authStatus, client, user])

  return state
}
