import type { UserSettings } from '../types'

export const settingsMock: UserSettings = {
  profile: {
    displayName: 'Luis Fernando',
    email: 'luis.fernando@exemplo.com',
  },
  display: {
    currency: 'BRL',
    locale: 'pt-BR',
    percentageDecimals: 2,
    compactView: false,
  },
  planning: {
    defaultContributionStrategy: 'proportional',
    contributionReminderEnabled: true,
    contributionReminderDay: 10,
  },
  notifications: {
    contributionReminder: true,
    portfolioSummary: true,
    strategyAlerts: false,
  },
}
