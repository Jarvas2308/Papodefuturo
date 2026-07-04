import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import type { SettingsValidation } from '../types'

export function SettingsValidationPanel({
  validation,
}: {
  validation: SettingsValidation
}) {
  if (validation.isValid) {
    return (
      <Card
        className="flex items-start gap-3 border-[color:color-mix(in_srgb,var(--color-positive)_28%,var(--color-border))] bg-[color:color-mix(in_srgb,var(--color-positive)_7%,white)] py-4"
        role="status"
      >
        <CheckCircle2
          className="mt-0.5 size-5 shrink-0 text-[var(--color-positive)]"
          aria-hidden="true"
        />
        <div>
          <h2 className="font-semibold text-[var(--color-text)]">
            Configurações válidas
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
            Os campos demonstrativos estão consistentes para aplicação local.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className="border-[color:color-mix(in_srgb,var(--color-alert)_30%,var(--color-border))] bg-[color:color-mix(in_srgb,var(--color-alert)_6%,white)] py-4"
      role="alert"
      aria-labelledby="settings-validation-title"
    >
      <div className="flex items-start gap-3">
        <AlertCircle
          className="mt-0.5 size-5 shrink-0 text-[var(--color-alert)]"
          aria-hidden="true"
        />
        <div>
          <h2
            id="settings-validation-title"
            className="font-semibold text-[var(--color-text)]"
          >
            Corrija os campos para aplicar
          </h2>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-[var(--color-text-muted)]">
            {validation.issues.map((issue) => (
              <li key={issue.field}>{issue.message}</li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  )
}
