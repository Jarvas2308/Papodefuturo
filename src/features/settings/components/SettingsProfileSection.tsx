import { UserRound } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import type { SettingsValidation, UserSettings } from '../types'

const inputClassName =
  'min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:bg-[var(--color-surface-muted)]'

export function SettingsProfileSection({
  settings,
  validation,
  isEditing,
  onChange,
}: {
  settings: UserSettings
  validation: SettingsValidation
  isEditing: boolean
  onChange: (field: 'displayName' | 'email', value: string) => void
}) {
  const nameError = validation.errors.displayName
  const emailError = validation.errors.email

  return (
    <section aria-labelledby="settings-profile-title">
      <Card>
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-subtle)] text-[var(--color-brand)]">
            <UserRound className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="settings-profile-title"
              className="text-xl font-semibold text-[var(--color-text)]"
            >
              Perfil
            </h2>
            <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
              Identidade apenas demonstrativa, sem conta autenticada.
            </p>
          </div>
        </div>

        {isEditing ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="settings-display-name"
                className="text-sm font-semibold text-[var(--color-text)]"
              >
                Nome de exibição
              </label>
              <input
                id="settings-display-name"
                value={settings.profile.displayName}
                maxLength={60}
                onChange={(event) =>
                  onChange('displayName', event.target.value)
                }
                className={`${inputClassName} mt-2`}
                aria-invalid={Boolean(nameError)}
                aria-describedby={
                  nameError ? 'settings-display-name-error' : undefined
                }
              />
              {nameError ? (
                <p
                  id="settings-display-name-error"
                  className="mt-2 text-sm font-medium text-[var(--color-alert)]"
                >
                  {nameError}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="settings-email"
                className="text-sm font-semibold text-[var(--color-text)]"
              >
                E-mail demonstrativo
              </label>
              <input
                id="settings-email"
                type="email"
                value={settings.profile.email}
                maxLength={120}
                onChange={(event) => onChange('email', event.target.value)}
                className={`${inputClassName} mt-2`}
                aria-invalid={Boolean(emailError)}
                aria-describedby={
                  emailError ? 'settings-email-error' : undefined
                }
              />
              {emailError ? (
                <p
                  id="settings-email-error"
                  className="mt-2 text-sm font-medium text-[var(--color-alert)]"
                >
                  {emailError}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-[var(--color-text-muted)]">
                Nome de exibição
              </dt>
              <dd className="mt-1 break-words font-semibold text-[var(--color-text)]">
                {settings.profile.displayName}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-[var(--color-text-muted)]">
                E-mail demonstrativo
              </dt>
              <dd className="mt-1 break-all font-semibold text-[var(--color-text)]">
                {settings.profile.email}
              </dd>
            </div>
          </dl>
        )}
      </Card>
    </section>
  )
}
