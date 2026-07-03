import type { ContributionStrategyType } from '../contribution/types'

export type SettingsCurrency = 'BRL' | 'USD'
export type SettingsLocale = 'pt-BR'
export type PercentageDecimals = 0 | 1 | 2

export type UserSettings = {
  profile: {
    displayName: string
    email: string
  }
  display: {
    currency: SettingsCurrency
    locale: SettingsLocale
    percentageDecimals: PercentageDecimals
    compactView: boolean
  }
  planning: {
    defaultContributionStrategy: ContributionStrategyType
    contributionReminderEnabled: boolean
    contributionReminderDay: number
  }
  notifications: {
    contributionReminder: boolean
    portfolioSummary: boolean
    strategyAlerts: boolean
  }
}

export type SettingsField =
  | 'displayName'
  | 'email'
  | 'defaultContributionStrategy'
  | 'contributionReminderDay'

export type SettingsValidationIssue = {
  field: SettingsField
  message: string
}

export type SettingsValidation = {
  isValid: boolean
  issues: SettingsValidationIssue[]
  errors: Partial<Record<SettingsField, string>>
}
