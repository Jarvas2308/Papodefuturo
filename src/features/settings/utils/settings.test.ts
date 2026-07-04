import { describe, expect, it } from 'vitest'
import { settingsMock } from '../mocks/settingsMock'
import type { UserSettings } from '../types'
import {
  areSettingsEqual,
  cloneSettings,
  countEnabledNotifications,
  normalizeSettings,
  restoreDefaultSettings,
  validateSettings,
} from './settings'

function settingsWith(update: (settings: UserSettings) => void): UserSettings {
  const settings = cloneSettings(settingsMock)
  update(settings)
  return settings
}

describe('settings utilities', () => {
  it('accepts the default mock', () => {
    expect(validateSettings(settingsMock).isValid).toBe(true)
  })

  it('rejects an empty display name', () => {
    const settings = settingsWith((current) => {
      current.profile.displayName = '  '
    })

    expect(validateSettings(settings).errors.displayName).toBe(
      'Informe um nome de exibição.'
    )
  })

  it('rejects a short display name', () => {
    const settings = settingsWith((current) => {
      current.profile.displayName = 'L'
    })

    expect(validateSettings(settings).errors.displayName).toContain(
      'pelo menos 2 caracteres'
    )
  })

  it('rejects an invalid email', () => {
    const settings = settingsWith((current) => {
      current.profile.email = 'email-invalido'
    })

    expect(validateSettings(settings).errors.email).toBe(
      'Informe um e-mail válido.'
    )
  })

  it('normalizes surrounding spaces and email casing', () => {
    const settings = settingsWith((current) => {
      current.profile.displayName = '  Luis Fernando  '
      current.profile.email = '  LUIS@EXEMPLO.COM  '
    })

    expect(normalizeSettings(settings).profile).toEqual({
      displayName: 'Luis Fernando',
      email: 'luis@exemplo.com',
    })
  })

  it.each([1, 28])('accepts reminder day %i', (day) => {
    const settings = settingsWith((current) => {
      current.planning.contributionReminderDay = day
    })

    expect(validateSettings(settings).isValid).toBe(true)
  })

  it.each([0, 29])('rejects reminder day %i', (day) => {
    const settings = settingsWith((current) => {
      current.planning.contributionReminderDay = day
    })

    expect(validateSettings(settings).errors.contributionReminderDay).toContain(
      'entre 1 e 28'
    )
  })

  it('ignores reminder day while the reminder is disabled', () => {
    const settings = settingsWith((current) => {
      current.planning.contributionReminderEnabled = false
      current.planning.contributionReminderDay = 0
    })

    expect(validateSettings(settings).isValid).toBe(true)
  })

  it.each(['proportional', 'target-allocation'] as const)(
    'accepts the %s contribution strategy',
    (strategy) => {
      const settings = settingsWith((current) => {
        current.planning.defaultContributionStrategy = strategy
      })

      expect(validateSettings(settings).isValid).toBe(true)
    }
  )

  it('rejects an unknown contribution strategy', () => {
    const settings = settingsWith((current) => {
      current.planning.defaultContributionStrategy = 'unknown' as never
    })

    expect(
      validateSettings(settings).errors.defaultContributionStrategy
    ).toContain('estratégia de aporte válida')
  })

  it('counts enabled notification preferences', () => {
    expect(countEnabledNotifications(settingsMock)).toBe(2)
  })

  it('restores a fresh copy of the default settings', () => {
    const restored = restoreDefaultSettings()
    restored.profile.displayName = 'Alterado'

    expect(areSettingsEqual(restoreDefaultSettings(), settingsMock)).toBe(true)
    expect(settingsMock.profile.displayName).toBe('Luis Fernando')
  })

  it('clones settings without mutating the original mock', () => {
    const clone = cloneSettings(settingsMock)
    clone.notifications.strategyAlerts = true
    clone.planning.contributionReminderDay = 28

    expect(settingsMock.notifications.strategyAlerts).toBe(false)
    expect(settingsMock.planning.contributionReminderDay).toBe(10)
  })
})
