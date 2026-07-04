import { CalendarClock } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import type { ContributionStrategyType } from '../../contribution/types'
import type { SettingsValidation, UserSettings } from '../types'
import { getContributionStrategyLabel } from '../utils/settings'

const optionClassName =
  'flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text)]'

export function SettingsPlanningSection({
  settings,
  validation,
  isEditing,
  onStrategyChange,
  onReminderEnabledChange,
  onReminderDayChange,
}: {
  settings: UserSettings
  validation: SettingsValidation
  isEditing: boolean
  onStrategyChange: (strategy: ContributionStrategyType) => void
  onReminderEnabledChange: (enabled: boolean) => void
  onReminderDayChange: (day: number) => void
}) {
  const dayError = validation.errors.contributionReminderDay

  return (
    <section aria-labelledby="settings-planning-title">
      <Card className="h-full">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-subtle)] text-[var(--color-brand)]">
            <CalendarClock className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="settings-planning-title"
              className="text-xl font-semibold text-[var(--color-text)]"
            >
              Planejamento
            </h2>
            <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
              Define estratégia preferida e periodicidade, sem alterar o Novo
              Aporte.
            </p>
          </div>
        </div>

        {isEditing ? (
          <div className="mt-6 space-y-6">
            <fieldset>
              <legend className="text-sm font-semibold text-[var(--color-text)]">
                Estratégia padrão do Novo Aporte
              </legend>
              <div className="mt-2 grid gap-2">
                {(['proportional', 'target-allocation'] as const).map(
                  (strategy) => (
                    <label key={strategy} className={optionClassName}>
                      <input
                        type="radio"
                        name="settings-contribution-strategy"
                        value={strategy}
                        checked={
                          settings.planning.defaultContributionStrategy ===
                          strategy
                        }
                        onChange={() => onStrategyChange(strategy)}
                        className="size-4 accent-[var(--color-brand)]"
                      />
                      {getContributionStrategyLabel(strategy)}
                    </label>
                  )
                )}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-semibold text-[var(--color-text)]">
                Lembrete mensal
              </legend>
              <label className={`${optionClassName} mt-2`}>
                <input
                  type="checkbox"
                  checked={settings.planning.contributionReminderEnabled}
                  onChange={(event) =>
                    onReminderEnabledChange(event.target.checked)
                  }
                  className="size-4 accent-[var(--color-brand)]"
                />
                Definir periodicidade mensal de aporte
              </label>

              <div className="mt-4 max-w-xs">
                <label
                  htmlFor="settings-reminder-day"
                  className="text-sm font-semibold text-[var(--color-text)]"
                >
                  Dia do mês
                </label>
                <input
                  id="settings-reminder-day"
                  type="number"
                  min={1}
                  max={28}
                  value={settings.planning.contributionReminderDay}
                  disabled={!settings.planning.contributionReminderEnabled}
                  onChange={(event) =>
                    onReminderDayChange(Number(event.target.value))
                  }
                  className="mt-2 min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:bg-[var(--color-surface-muted)] disabled:text-[var(--color-text-muted)]"
                  aria-invalid={Boolean(dayError)}
                  aria-describedby={
                    dayError ? 'settings-reminder-day-error' : undefined
                  }
                />
                {dayError ? (
                  <p
                    id="settings-reminder-day-error"
                    className="mt-2 text-sm font-medium text-[var(--color-alert)]"
                  >
                    {dayError}
                  </p>
                ) : null}
              </div>
            </fieldset>
          </div>
        ) : (
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-sm text-[var(--color-text-muted)]">
                Estratégia padrão
              </dt>
              <dd className="mt-1 font-semibold text-[var(--color-text)]">
                {getContributionStrategyLabel(
                  settings.planning.defaultContributionStrategy
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-[var(--color-text-muted)]">
                Periodicidade mensal
              </dt>
              <dd className="mt-1 font-semibold text-[var(--color-text)]">
                {settings.planning.contributionReminderEnabled
                  ? 'Ativada'
                  : 'Desativada'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-[var(--color-text-muted)]">
                Dia planejado
              </dt>
              <dd className="mt-1 font-semibold text-[var(--color-text)]">
                {settings.planning.contributionReminderEnabled
                  ? `Dia ${settings.planning.contributionReminderDay}`
                  : 'Não definido'}
              </dd>
            </div>
          </dl>
        )}
      </Card>
    </section>
  )
}
