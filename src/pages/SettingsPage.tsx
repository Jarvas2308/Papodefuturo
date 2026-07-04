import { useState } from 'react'
import { SettingsDisplaySection } from '../features/settings/components/SettingsDisplaySection'
import { SettingsNotificationsSection } from '../features/settings/components/SettingsNotificationsSection'
import { SettingsPlanningSection } from '../features/settings/components/SettingsPlanningSection'
import { SettingsPrivacySection } from '../features/settings/components/SettingsPrivacySection'
import { SettingsProfileSection } from '../features/settings/components/SettingsProfileSection'
import { SettingsSummaryCards } from '../features/settings/components/SettingsSummaryCards'
import { SettingsToolbar } from '../features/settings/components/SettingsToolbar'
import { SettingsValidationPanel } from '../features/settings/components/SettingsValidationPanel'
import { settingsMock } from '../features/settings/mocks/settingsMock'
import type {
  PercentageDecimals,
  SettingsCurrency,
  UserSettings,
} from '../features/settings/types'
import {
  areSettingsEqual,
  cloneSettings,
  createSettingsDraft,
  normalizeSettings,
  restoreDefaultSettings,
  validateSettings,
} from '../features/settings/utils/settings'
import type { ContributionStrategyType } from '../features/contribution/types'

type NotificationKey = keyof UserSettings['notifications']

export function SettingsPage() {
  const [appliedSettings, setAppliedSettings] = useState(() =>
    cloneSettings(settingsMock)
  )
  const [draft, setDraft] = useState(() => createSettingsDraft(settingsMock))
  const [isEditing, setIsEditing] = useState(false)
  const [feedback, setFeedback] = useState('')

  const activeSettings = isEditing ? draft : appliedSettings
  const validation = validateSettings(activeSettings)
  const hasChanges = !areSettingsEqual(draft, appliedSettings)

  function startEditing() {
    setDraft(createSettingsDraft(appliedSettings))
    setFeedback('')
    setIsEditing(true)
  }

  function updateProfile(field: 'displayName' | 'email', value: string) {
    setDraft((current) => ({
      ...current,
      profile: { ...current.profile, [field]: value },
    }))
  }

  function updateDisplay<K extends keyof UserSettings['display']>(
    field: K,
    value: UserSettings['display'][K]
  ) {
    setDraft((current) => ({
      ...current,
      display: { ...current.display, [field]: value },
    }))
  }

  function updatePlanning<K extends keyof UserSettings['planning']>(
    field: K,
    value: UserSettings['planning'][K]
  ) {
    setDraft((current) => ({
      ...current,
      planning: { ...current.planning, [field]: value },
    }))
  }

  function updateNotification(key: NotificationKey, enabled: boolean) {
    setDraft((current) => ({
      ...current,
      notifications: { ...current.notifications, [key]: enabled },
    }))
  }

  function applyChanges() {
    if (!validation.isValid || !hasChanges) {
      return
    }

    const normalized = normalizeSettings(draft)
    setAppliedSettings(normalized)
    setDraft(createSettingsDraft(normalized))
    setIsEditing(false)
    setFeedback(
      'Configurações aplicadas apenas nesta sessão. Nenhum dado foi persistido.'
    )
  }

  function cancelChanges() {
    setDraft(createSettingsDraft(appliedSettings))
    setIsEditing(false)
    setFeedback('Alterações não aplicadas foram descartadas.')
  }

  function restoreDefault() {
    const defaultSettings = restoreDefaultSettings()

    if (isEditing) {
      setDraft(defaultSettings)
      setFeedback(
        'Configurações padrão preparadas. Aplique para usar nesta sessão.'
      )
      return
    }

    setAppliedSettings(defaultSettings)
    setDraft(createSettingsDraft(defaultSettings))
    setFeedback('Configurações padrão restauradas apenas nesta sessão.')
  }

  return (
    <section className="space-y-6">
      <SettingsToolbar
        isEditing={isEditing}
        isValid={validation.isValid}
        hasChanges={hasChanges}
        onEdit={startEditing}
        onApply={applyChanges}
        onCancel={cancelChanges}
        onRestore={restoreDefault}
      />

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {feedback}
      </p>
      {feedback ? (
        <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-text)]">
          {feedback}
        </p>
      ) : null}

      <SettingsSummaryCards settings={activeSettings} validation={validation} />

      {isEditing ? <SettingsValidationPanel validation={validation} /> : null}

      <SettingsProfileSection
        settings={activeSettings}
        validation={validation}
        isEditing={isEditing}
        onChange={updateProfile}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <SettingsDisplaySection
          settings={activeSettings}
          isEditing={isEditing}
          onCurrencyChange={(currency: SettingsCurrency) =>
            updateDisplay('currency', currency)
          }
          onDecimalsChange={(decimals: PercentageDecimals) =>
            updateDisplay('percentageDecimals', decimals)
          }
          onCompactViewChange={(enabled) =>
            updateDisplay('compactView', enabled)
          }
        />
        <SettingsPlanningSection
          settings={activeSettings}
          validation={validation}
          isEditing={isEditing}
          onStrategyChange={(strategy: ContributionStrategyType) =>
            updatePlanning('defaultContributionStrategy', strategy)
          }
          onReminderEnabledChange={(enabled) =>
            updatePlanning('contributionReminderEnabled', enabled)
          }
          onReminderDayChange={(day) =>
            updatePlanning('contributionReminderDay', day)
          }
        />
      </div>

      <SettingsNotificationsSection
        settings={activeSettings}
        isEditing={isEditing}
        onChange={updateNotification}
      />

      <SettingsPrivacySection />
    </section>
  )
}
