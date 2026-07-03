import type { ContributionStrategyType } from '../../contribution/types'
import { settingsMock } from '../mocks/settingsMock'
import type { SettingsField, SettingsValidation, UserSettings } from '../types'

const VALID_STRATEGIES: ContributionStrategyType[] = [
  'proportional',
  'target-allocation',
]

export function cloneSettings(settings: UserSettings): UserSettings {
  return {
    profile: { ...settings.profile },
    display: { ...settings.display },
    planning: { ...settings.planning },
    notifications: { ...settings.notifications },
  }
}

export function createSettingsDraft(settings: UserSettings): UserSettings {
  return cloneSettings(settings)
}

export function restoreDefaultSettings(): UserSettings {
  return cloneSettings(settingsMock)
}

export function normalizeSettings(settings: UserSettings): UserSettings {
  const normalized = cloneSettings(settings)
  normalized.profile.displayName = normalized.profile.displayName.trim()
  normalized.profile.email = normalized.profile.email.trim().toLowerCase()
  return normalized
}

export function validateSettings(settings: UserSettings): SettingsValidation {
  const issues: SettingsValidation['issues'] = []
  const displayName = settings.profile.displayName.trim()
  const email = settings.profile.email.trim()

  function addIssue(field: SettingsField, message: string) {
    issues.push({ field, message })
  }

  if (!displayName) {
    addIssue('displayName', 'Informe um nome de exibição.')
  } else if (displayName.length < 2) {
    addIssue(
      'displayName',
      'O nome de exibição deve ter pelo menos 2 caracteres.'
    )
  } else if (displayName.length > 60) {
    addIssue(
      'displayName',
      'O nome de exibição deve ter no máximo 60 caracteres.'
    )
  }

  if (!email) {
    addIssue('email', 'Informe um e-mail demonstrativo.')
  } else if (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    addIssue('email', 'Informe um e-mail válido.')
  }

  if (
    !VALID_STRATEGIES.includes(
      settings.planning.defaultContributionStrategy as ContributionStrategyType
    )
  ) {
    addIssue(
      'defaultContributionStrategy',
      'Selecione uma estratégia de aporte válida.'
    )
  }

  if (
    settings.planning.contributionReminderEnabled &&
    (!Number.isInteger(settings.planning.contributionReminderDay) ||
      settings.planning.contributionReminderDay < 1 ||
      settings.planning.contributionReminderDay > 28)
  ) {
    addIssue(
      'contributionReminderDay',
      'O dia do lembrete deve estar entre 1 e 28.'
    )
  }

  return {
    isValid: issues.length === 0,
    issues,
    errors: Object.fromEntries(
      issues.map((issue) => [issue.field, issue.message])
    ),
  }
}

export function countEnabledNotifications(settings: UserSettings): number {
  return Object.values(settings.notifications).filter(Boolean).length
}

export function areSettingsEqual(
  first: UserSettings,
  second: UserSettings
): boolean {
  return JSON.stringify(first) === JSON.stringify(second)
}

export function getContributionStrategyLabel(
  strategy: ContributionStrategyType
): string {
  return strategy === 'proportional'
    ? 'Proporcional demonstrativa'
    : 'Déficit projetado'
}
