import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import {
  createSupabaseRepositories,
  type AppRepositories,
} from '../../data/repositories'
import { settingsMock } from './mocks/settingsMock'
import type { UserSettings } from './types'

type SettingsDataStatus = 'loading' | 'ready' | 'error'

export type SettingsDataState = {
  settings: UserSettings | null
  status: SettingsDataStatus
  error: string | null
  isDemo: boolean
  saveSettings(settings: UserSettings): Promise<void>
}

async function loadRealSettings(
  repositories: AppRepositories,
  userId: string,
  email: string
): Promise<UserSettings> {
  const [profile, preferences] = await Promise.all([
    repositories.profile.get(userId),
    repositories.userPreferences.get(userId),
  ])

  return {
    profile: { displayName: profile.displayName, email },
    display: {
      currency: preferences.currency,
      locale: 'pt-BR',
      percentageDecimals: preferences.percentageDecimals,
      compactView: preferences.compactView,
    },
    planning: {
      defaultContributionStrategy: preferences.defaultContributionStrategy,
      contributionReminderEnabled: preferences.contributionReminderEnabled,
      contributionReminderDay: preferences.contributionReminderDay,
    },
  }
}

export function useSettingsData(): SettingsDataState {
  const { status: authStatus, client, user } = useAuth()
  const [settings, setSettings] = useState<UserSettings | null>(() =>
    authStatus === 'demo' ? settingsMock : null
  )
  const [status, setStatus] = useState<SettingsDataStatus>(
    authStatus === 'demo' ? 'ready' : 'loading'
  )
  const [error, setError] = useState<string | null>(null)

  const loadReal = useCallback(async () => {
    if (authStatus !== 'authenticated' || !client || !user) {
      return
    }

    const repositories = createSupabaseRepositories(client)
    const nextSettings = await loadRealSettings(
      repositories,
      user.id,
      user.email ?? ''
    )

    setSettings(nextSettings)
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
            : 'Não foi possível carregar as configurações.'
        )
        setStatus('error')
      })

    return () => {
      isActive = false
    }
  }, [authStatus, loadReal])

  async function saveSettings(nextSettings: UserSettings) {
    if (authStatus === 'demo') {
      setSettings(nextSettings)
      return
    }

    if (!client || !user) {
      throw new Error('Sessão indisponível para salvar as configurações.')
    }

    const repositories = createSupabaseRepositories(client)
    // scoreWeightInBasisPoints ainda nao tem tela propria (Sprint 16) -
    // preserva o valor atual em vez de sobrescrever com um default toda
    // vez que o usuario salva qualquer outra preferencia.
    const currentPreferences = await repositories.userPreferences.get(user.id)
    const [profile, preferences] = await Promise.all([
      repositories.profile.update(user.id, {
        displayName: nextSettings.profile.displayName,
      }),
      repositories.userPreferences.update(user.id, {
        currency: nextSettings.display.currency,
        percentageDecimals: nextSettings.display.percentageDecimals,
        compactView: nextSettings.display.compactView,
        defaultContributionStrategy:
          nextSettings.planning.defaultContributionStrategy,
        contributionReminderEnabled:
          nextSettings.planning.contributionReminderEnabled,
        contributionReminderDay: nextSettings.planning.contributionReminderDay,
        scoreWeightInBasisPoints: currentPreferences.scoreWeightInBasisPoints,
      }),
    ])

    setSettings({
      profile: { displayName: profile.displayName, email: user.email ?? '' },
      display: {
        currency: preferences.currency,
        locale: 'pt-BR',
        percentageDecimals: preferences.percentageDecimals,
        compactView: preferences.compactView,
      },
      planning: {
        defaultContributionStrategy: preferences.defaultContributionStrategy,
        contributionReminderEnabled: preferences.contributionReminderEnabled,
        contributionReminderDay: preferences.contributionReminderDay,
      },
    })
  }

  return {
    settings,
    status,
    error,
    isDemo: authStatus === 'demo',
    saveSettings,
  }
}
