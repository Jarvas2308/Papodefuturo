import { UserRound } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import type { SettingsValidation, UserSettings } from '../types'

const inputClassName =
  'min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:bg-[var(--color-surface-muted)]'

export function SettingsProfileSection({
  settings,
  validation,
  isEditing,
  isDemo,
  onChange,
}: {
  settings: UserSettings
  validation: SettingsValidation
  isEditing: boolean
  isDemo: boolean
  onChange: (field: 'displayName', value: string) => void
}) {
  const nameError = validation.errors.displayName

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
              {isDemo
                ? 'Identidade apenas demonstrativa, sem conta autenticada.'
                : 'Nome de exibição salvo na sua conta. O e-mail é o mesmo usado para entrar.'}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {isEditing ? (
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
          ) : (
            <div>
              <dt className="text-sm text-[var(--color-text-muted)]">
                Nome de exibição
              </dt>
              <dd className="mt-1 break-words font-semibold text-[var(--color-text)]">
                {settings.profile.displayName}
              </dd>
            </div>
          )}

          <div>
            <dt className="text-sm text-[var(--color-text-muted)]">
              E-mail
            </dt>
            <dd className="mt-1 break-all font-semibold text-[var(--color-text)]">
              {settings.profile.email}
            </dd>
          </div>
        </div>
      </Card>
    </section>
  )
}
