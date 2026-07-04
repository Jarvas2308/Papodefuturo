import { BellRing, CircleCheck, Coins, Goal } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import type { SettingsValidation, UserSettings } from '../types'
import {
  countEnabledNotifications,
  getContributionStrategyLabel,
} from '../utils/settings'

export function SettingsSummaryCards({
  settings,
  validation,
}: {
  settings: UserSettings
  validation: SettingsValidation
}) {
  const cards = [
    {
      label: 'Situação',
      value: validation.isValid ? 'Válida' : 'Inválida',
      helper: validation.isValid
        ? 'Preferências prontas para aplicar'
        : 'Revise os campos sinalizados',
      icon: CircleCheck,
    },
    {
      label: 'Moeda principal',
      value: settings.display.currency,
      helper: 'Ainda não altera valores nas demais telas',
      icon: Coins,
    },
    {
      label: 'Estratégia padrão',
      value: getContributionStrategyLabel(
        settings.planning.defaultContributionStrategy
      ),
      helper: 'Preferência local, sem integração com Novo Aporte',
      icon: Goal,
    },
    {
      label: 'Notificações',
      value: `${countEnabledNotifications(settings)} de 3`,
      helper: 'Somente controles demonstrativos',
      icon: BellRing,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <Card key={card.label} className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-muted)]">
                  {card.label}
                </p>
                <p className="mt-2 break-words text-xl font-semibold tracking-tight text-[var(--color-text)]">
                  {card.value}
                </p>
              </div>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-subtle)] text-[var(--color-brand)]">
                <Icon className="size-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-[var(--color-text-muted)]">
              {card.helper}
            </p>
          </Card>
        )
      })}
    </div>
  )
}
