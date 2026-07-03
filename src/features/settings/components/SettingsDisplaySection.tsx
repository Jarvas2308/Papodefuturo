import { MonitorCog } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import type {
  PercentageDecimals,
  SettingsCurrency,
  UserSettings,
} from '../types'

const optionClassName =
  'flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text)]'

export function SettingsDisplaySection({
  settings,
  isEditing,
  onCurrencyChange,
  onDecimalsChange,
  onCompactViewChange,
}: {
  settings: UserSettings
  isEditing: boolean
  onCurrencyChange: (currency: SettingsCurrency) => void
  onDecimalsChange: (decimals: PercentageDecimals) => void
  onCompactViewChange: (enabled: boolean) => void
}) {
  return (
    <section aria-labelledby="settings-display-title">
      <Card className="h-full">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-subtle)] text-[var(--color-brand)]">
            <MonitorCog className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="settings-display-title"
              className="text-xl font-semibold text-[var(--color-text)]"
            >
              Exibição
            </h2>
            <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
              Preferências locais que ainda não alteram as demais telas.
            </p>
          </div>
        </div>

        {isEditing ? (
          <div className="mt-6 space-y-6">
            <fieldset>
              <legend className="text-sm font-semibold text-[var(--color-text)]">
                Moeda principal
              </legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {(['BRL', 'USD'] as const).map((currency) => (
                  <label key={currency} className={optionClassName}>
                    <input
                      type="radio"
                      name="settings-currency"
                      value={currency}
                      checked={settings.display.currency === currency}
                      onChange={() => onCurrencyChange(currency)}
                      className="size-4 accent-[var(--color-brand)]"
                    />
                    {currency}
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">
                Localidade
              </p>
              <p className="mt-2 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-3 py-3 text-sm text-[var(--color-text)]">
                pt-BR{' '}
                <span className="text-[var(--color-text-muted)]">
                  (fixa nesta versão)
                </span>
              </p>
            </div>

            <fieldset>
              <legend className="text-sm font-semibold text-[var(--color-text)]">
                Casas decimais de percentuais
              </legend>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {([0, 1, 2] as const).map((decimals) => (
                  <label key={decimals} className={optionClassName}>
                    <input
                      type="radio"
                      name="settings-percentage-decimals"
                      value={decimals}
                      checked={settings.display.percentageDecimals === decimals}
                      onChange={() => onDecimalsChange(decimals)}
                      className="size-4 accent-[var(--color-brand)]"
                    />
                    {decimals}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className={optionClassName}>
              <input
                type="checkbox"
                checked={settings.display.compactView}
                onChange={(event) => onCompactViewChange(event.target.checked)}
                className="size-4 accent-[var(--color-brand)]"
              />
              Usar visualização compacta
            </label>
          </div>
        ) : (
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-[var(--color-text-muted)]">Moeda</dt>
              <dd className="mt-1 font-semibold text-[var(--color-text)]">
                {settings.display.currency}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-[var(--color-text-muted)]">
                Localidade
              </dt>
              <dd className="mt-1 font-semibold text-[var(--color-text)]">
                {settings.display.locale}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-[var(--color-text-muted)]">
                Casas decimais
              </dt>
              <dd className="mt-1 font-semibold text-[var(--color-text)]">
                {settings.display.percentageDecimals}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-[var(--color-text-muted)]">
                Visualização compacta
              </dt>
              <dd className="mt-1 font-semibold text-[var(--color-text)]">
                {settings.display.compactView ? 'Ativada' : 'Desativada'}
              </dd>
            </div>
          </dl>
        )}
      </Card>
    </section>
  )
}
