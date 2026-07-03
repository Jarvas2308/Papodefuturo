import { BellRing } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import type { UserSettings } from '../types'

type NotificationKey = keyof UserSettings['notifications']

const notificationOptions: Array<{
  key: NotificationKey
  label: string
  description: string
}> = [
  {
    key: 'contributionReminder',
    label: 'Lembrete de aporte',
    description:
      'Habilita o futuro canal lógico; periodicidade e dia ficam em Planejamento.',
  },
  {
    key: 'portfolioSummary',
    label: 'Resumo da carteira',
    description: 'Representa um futuro resumo periódico da carteira.',
  },
  {
    key: 'strategyAlerts',
    label: 'Alertas de desvio da estratégia',
    description: 'Representa futuros avisos sobre desvios das metas.',
  },
]

export function SettingsNotificationsSection({
  settings,
  isEditing,
  onChange,
}: {
  settings: UserSettings
  isEditing: boolean
  onChange: (key: NotificationKey, enabled: boolean) => void
}) {
  return (
    <section aria-labelledby="settings-notifications-title">
      <Card>
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-subtle)] text-[var(--color-brand)]">
            <BellRing className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="settings-notifications-title"
              className="text-xl font-semibold text-[var(--color-text)]"
            >
              Notificações
            </h2>
            <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
              Nenhuma notificação será enviada. Não há integração com e-mail,
              push ou backend.
            </p>
          </div>
        </div>

        {isEditing ? (
          <fieldset className="mt-6">
            <legend className="sr-only">Notificações demonstrativas</legend>
            <div className="grid gap-3 lg:grid-cols-3">
              {notificationOptions.map((option) => (
                <label
                  key={option.key}
                  className="flex min-h-24 items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                >
                  <input
                    type="checkbox"
                    checked={settings.notifications[option.key]}
                    onChange={(event) =>
                      onChange(option.key, event.target.checked)
                    }
                    className="mt-1 size-4 shrink-0 accent-[var(--color-brand)]"
                  />
                  <span>
                    <span className="block font-semibold text-[var(--color-text)]">
                      {option.label}
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-[var(--color-text-muted)]">
                      {option.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : (
          <ul className="mt-6 grid gap-3 lg:grid-cols-3">
            {notificationOptions.map((option) => (
              <li
                key={option.key}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-[var(--color-text)]">
                    {option.label}
                  </span>
                  <span className="text-sm font-semibold text-[var(--color-brand-strong)]">
                    {settings.notifications[option.key]
                      ? 'Habilitada'
                      : 'Desabilitada'}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-5 text-[var(--color-text-muted)]">
                  {option.description}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  )
}
