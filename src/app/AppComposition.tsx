import { useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import {
  createOfficialEventsRuntimeV1,
  createSupabaseOfficialEventsRuntimeV1,
  type OfficialEventsRuntimeAccessStateV1,
  type OfficialEventsRuntimeV1,
} from '../application/context/official-events/runtime'
import {
  createFundamentalsRuntimeV1,
  createSupabaseFundamentalsRuntimeV1,
  type FundamentalsRuntimeAccessStateV1,
  type FundamentalsRuntimeV1,
} from '../application/context/fundamentals/runtime'
import { AuthProvider } from '../auth/AuthProvider'
import {
  OFFICIAL_EVENTS_REAL_UI_MODE,
  createRealOfficialEventsUiDependenciesV1,
} from '../features/official-events/composition'
import { OfficialEventsUiProvider } from '../features/official-events/OfficialEventsUiProvider'
import {
  FUNDAMENTALS_REAL_UI_MODE,
  createRealFundamentalsUiDependenciesV1,
} from '../features/fundamentals/composition'
import { FundamentalsUiProvider } from '../features/fundamentals/FundamentalsUiProvider'
import { createSupabaseBrowserClient } from '../lib/supabaseClient'
import { readCurrentViteSupabaseEnvironment } from '../lib/viteEnv'
import { AppRouter } from './router/AppRouter'

function createOfficialEventsRuntime(): OfficialEventsRuntimeV1 {
  const now = { now: () => new Date().toISOString() }
  const client = createSupabaseBrowserClient(
    readCurrentViteSupabaseEnvironment()
  )

  if (!client || OFFICIAL_EVENTS_REAL_UI_MODE === 'disabled') {
    return createOfficialEventsRuntimeV1({ mode: 'disabled', now })
  }

  return createSupabaseOfficialEventsRuntimeV1({
    mode: 'read-only',
    client,
    getAccessState: async (): Promise<OfficialEventsRuntimeAccessStateV1> => {
      try {
        const { data, error } = await client.auth.getSession()
        if (error) return 'unresolved'
        return data.session ? 'authenticated' : 'unauthenticated'
      } catch {
        return 'unresolved'
      }
    },
    now,
  })
}

function createFundamentalsRuntime(): FundamentalsRuntimeV1 {
  const now = { now: () => new Date().toISOString() }
  const client = createSupabaseBrowserClient(
    readCurrentViteSupabaseEnvironment()
  )

  if (!client || FUNDAMENTALS_REAL_UI_MODE === 'disabled') {
    return createFundamentalsRuntimeV1({ mode: 'disabled', now })
  }

  return createSupabaseFundamentalsRuntimeV1({
    mode: 'read-only',
    client,
    getAccessState: async (): Promise<FundamentalsRuntimeAccessStateV1> => {
      try {
        const { data, error } = await client.auth.getSession()
        if (error) return 'unresolved'
        return data.session ? 'authenticated' : 'unauthenticated'
      } catch {
        return 'unresolved'
      }
    },
    now,
  })
}

export function AppComposition() {
  const [officialEventsDependencies] = useState(() =>
    createRealOfficialEventsUiDependenciesV1(createOfficialEventsRuntime())
  )
  const [fundamentalsDependencies] = useState(() =>
    createRealFundamentalsUiDependenciesV1(createFundamentalsRuntime())
  )

  return (
    <AuthProvider>
      <OfficialEventsUiProvider dependencies={officialEventsDependencies}>
        <FundamentalsUiProvider dependencies={fundamentalsDependencies}>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </FundamentalsUiProvider>
      </OfficialEventsUiProvider>
    </AuthProvider>
  )
}
