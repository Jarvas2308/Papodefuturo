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
  }
}

export function createSettingsDraft(settings: UserSettings): UserSettings {
  return cloneSettings(settings)
}

// `profile` (nome, e-mail) não é "padrão" a restaurar — é identidade real do
// usuário. Só `display` e `planning` voltam ao valor de fábrica; o perfil
// atual é preservado.
export function restoreDefaultSettings(
  currentProfile: UserSettings['profile']
): UserSettings {
  return {
    profile: { ...currentProfile },
    display: { ...settingsMock.display },
    planning: { ...settingsMock.planning },
  }
}

export function normalizeSettings(settings: UserSettings): UserSettings {
  const normalized = cloneSettings(settings)
  normalized.profile.displayName = normalized.profile.displayName.trim()
  return normalized
}

export function validateSettings(settings: UserSettings): SettingsValidation {
  const issues: SettingsValidation['issues'] = []
  const displayName = settings.profile.displayName.trim()

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
    ? 'Proporcional simples'
    : 'Déficit projetado'
}
