import { DatabaseZap, ShieldCheck } from 'lucide-react'
import { Card } from '../../../components/ui/Card'

const DEMO_PRIVACY_FACTS = [
  'A aplicação ainda utiliza somente mocks determinísticos.',
  'Nenhum dado é salvo e não existe backend conectado.',
  'Não existe conta autenticada nesta versão.',
  'Um refresh restaura todas as configurações padrão.',
  'Nenhum dado financeiro real é utilizado.',
  'Não há ação de exclusão de conta disponível nesta versão.',
]

const REAL_PRIVACY_FACTS = [
  'Nome de exibição e preferências desta tela são salvos na sua conta.',
  'E-mail e senha são gerenciados pelo Supabase Auth, fora desta tela.',
  'Carteira, compras e metas de estratégia usam dado real, não mock.',
  'Um refresh não apaga nada — os dados persistem entre sessões.',
  'Não há ação de exclusão de conta disponível nesta versão.',
]

export function SettingsPrivacySection({ isDemo }: { isDemo: boolean }) {
  const privacyFacts = isDemo ? DEMO_PRIVACY_FACTS : REAL_PRIVACY_FACTS

  return (
    <section aria-labelledby="settings-privacy-title">
      <Card className="border-[color:color-mix(in_srgb,var(--color-positive)_20%,var(--color-border))] bg-[color:color-mix(in_srgb,var(--color-positive)_4%,white)]">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[color:color-mix(in_srgb,var(--color-positive)_12%,white)] text-[var(--color-positive)]">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="settings-privacy-title"
              className="text-xl font-semibold text-[var(--color-text)]"
            >
              Dados e privacidade
            </h2>
            <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
              Transparência sobre o estado demonstrativo desta aplicação.
            </p>
          </div>
        </div>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {privacyFacts.map((fact) => (
            <li
              key={fact}
              className="flex items-start gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-4 py-3 text-sm leading-6 text-[var(--color-text-muted)]"
            >
              <DatabaseZap
                className="mt-1 size-4 shrink-0 text-[var(--color-positive)]"
                aria-hidden="true"
              />
              {fact}
            </li>
          ))}
        </ul>
      </Card>
    </section>
  )
}
