import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { SettingsDisplaySection } from '../features/settings/components/SettingsDisplaySection'
import { SettingsPlanningSection } from '../features/settings/components/SettingsPlanningSection'
import { SettingsPrivacySection } from '../features/settings/components/SettingsPrivacySection'
import { SettingsProfileSection } from '../features/settings/components/SettingsProfileSection'
import { SettingsSummaryCards } from '../features/settings/components/SettingsSummaryCards'
import { SettingsToolbar } from '../features/settings/components/SettingsToolbar'
import { SettingsValidationPanel } from '../features/settings/components/SettingsValidationPanel'
import { useSettingsData } from '../features/settings/useSettingsData'
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

export function SettingsPage() {
  const { settings, status, error, isDemo, saveSettings } = useSettingsData()
  const [appliedSettings, setAppliedSettings] = useState<UserSettings | null>(
    null
  )
  const [draft, setDraft] = useState<UserSettings | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  if (settings && !appliedSettings) {
    setAppliedSettings(cloneSettings(settings))
    setDraft(createSettingsDraft(settings))
  }

  if (status === 'loading' || !appliedSettings || !draft) {
    return (
      <Card>
        <p role="status" className="text-sm text-[var(--color-text-muted)]">
          Carregando suas configurações...
        </p>
      </Card>
    )
  }

  if (status === 'error') {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          Não foi possível carregar as configurações
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          {error ?? 'Tente novamente após atualizar a página.'}
        </p>
      </Card>
    )
  }

  const activeSettings = isEditing ? draft : appliedSettings
  const validation = validateSettings(activeSettings)
  const hasChanges = !areSettingsEqual(draft, appliedSettings)

  function startEditing() {
    setDraft(createSettingsDraft(appliedSettings!))
    setFeedback('')
    setIsEditing(true)
  }

  function updateProfile(field: 'displayName', value: string) {
    setDraft((current) =>
      current
        ? { ...current, profile: { ...current.profile, [field]: value } }
        : current
    )
  }

  function updateDisplay<K extends keyof UserSettings['display']>(
    field: K,
    value: UserSettings['display'][K]
  ) {
    setDraft((current) =>
      current
        ? { ...current, display: { ...current.display, [field]: value } }
        : current
    )
  }

  function updatePlanning<K extends keyof UserSettings['planning']>(
    field: K,
    value: UserSettings['planning'][K]
  ) {
    setDraft((current) =>
      current
        ? { ...current, planning: { ...current.planning, [field]: value } }
        : current
    )
  }

  async function applyChanges() {
    if (!validation.isValid || !hasChanges || isSaving) {
      return
    }

    const normalized = normalizeSettings(draft!)
    setIsSaving(true)

    try {
      await saveSettings(normalized)
      setAppliedSettings(normalized)
      setDraft(createSettingsDraft(normalized))
      setIsEditing(false)
      setFeedback(
        isDemo
          ? 'Configurações aplicadas apenas nesta sessão. Nenhum dado foi persistido.'
          : 'Configurações salvas na sua conta.'
      )
    } catch (saveError) {
      setFeedback(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível salvar as configurações. Tente novamente.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  function cancelChanges() {
    setDraft(createSettingsDraft(appliedSettings!))
    setIsEditing(false)
    setFeedback('Alterações não aplicadas foram descartadas.')
  }

  function restoreDefault() {
    const defaultSettings = restoreDefaultSettings(appliedSettings!.profile)

    if (isEditing) {
      setDraft(defaultSettings)
      setFeedback('Configurações padrão preparadas. Aplique para salvar.')
      return
    }

    setDraft(defaultSettings)
    setIsEditing(true)
    setFeedback('Configurações padrão preparadas. Aplique para salvar.')
  }

  return (
    <section className="space-y-6">
      <SettingsToolbar
        isEditing={isEditing}
        isValid={validation.isValid}
        hasChanges={hasChanges}
        isDemo={isDemo}
        onEdit={startEditing}
        onApply={() => void applyChanges()}
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
        isDemo={isDemo}
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

      <SettingsPrivacySection isDemo={isDemo} />
    </section>
  )
}
