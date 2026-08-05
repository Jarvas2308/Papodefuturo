import { describe, expect, it } from 'vitest'
import { settingsMock } from '../mocks/settingsMock'
import type { UserSettings } from '../types'
import {
  cloneSettings,
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

  it('normalizes surrounding spaces in the display name', () => {
    const settings = settingsWith((current) => {
      current.profile.displayName = '  Luis Fernando  '
    })

    expect(normalizeSettings(settings).profile).toEqual({
      displayName: 'Luis Fernando',
      email: settingsMock.profile.email,
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

  it('restores display and planning defaults while preserving the given profile', () => {
    const currentProfile = { displayName: 'Outro Nome', email: 'outro@exemplo.com' }
    const restored = restoreDefaultSettings(currentProfile)

    expect(restored.profile).toEqual(currentProfile)
    expect(restored.display).toEqual(settingsMock.display)
    expect(restored.planning).toEqual(settingsMock.planning)
  })

  it('clones settings without mutating the original mock', () => {
    const clone = cloneSettings(settingsMock)
    clone.profile.displayName = 'Alterado'
    clone.planning.contributionReminderDay = 28

    expect(settingsMock.profile.displayName).toBe('Luis Fernando')
    expect(settingsMock.planning.contributionReminderDay).toBe(10)
  })
})
