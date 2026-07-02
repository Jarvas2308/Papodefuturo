import { useId, type FormEvent } from 'react'
import { Calculator, WalletCards } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import type { ContributionStrategyType } from '../types'

type ContributionFormProps = {
  error: string | null
  strategy: ContributionStrategyType
  value: string
  onChange: (value: string) => void
  onStrategyChange: (strategy: ContributionStrategyType) => void
  onSubmit: () => void
}

export function ContributionForm({
  error,
  strategy,
  value,
  onChange,
  onStrategyChange,
  onSubmit,
}: ContributionFormProps) {
  const inputId = useId()
  const strategyId = useId()
  const helperId = `${inputId}-helper`
  const errorId = `${inputId}-error`

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <Card className="h-full p-0">
      <form className="flex h-full flex-col" onSubmit={handleSubmit} noValidate>
        <div className="border-b border-[var(--color-border)] px-6 py-6 sm:px-7">
          <div className="flex size-12 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-brand-subtle)] text-[var(--color-brand-strong)]">
            <WalletCards className="size-5" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-[var(--color-text)]">
            Defina o valor do aporte
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            Escolha como o simulador demonstrativo deve distribuir o valor entre
            as posições da carteira.
          </p>
        </div>

        <div className="flex flex-1 flex-col justify-between gap-6 px-6 py-6 sm:px-7">
          <div className="space-y-5">
            <div>
              <label
                htmlFor={inputId}
                className="text-sm font-semibold text-[var(--color-text)]"
              >
                Valor do aporte
              </label>
              <div className="relative mt-2">
                <span
                  className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-base font-semibold text-[var(--color-text-muted)]"
                  aria-hidden="true"
                >
                  R$
                </span>
                <input
                  id={inputId}
                  type="text"
                  inputMode="decimal"
                  value={value}
                  onChange={(event) => onChange(event.target.value)}
                  aria-describedby={error ? `${helperId} ${errorId}` : helperId}
                  aria-invalid={Boolean(error)}
                  className="min-h-14 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] py-3 pl-12 pr-4 text-xl font-semibold text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-ring)]"
                  placeholder="0,00"
                />
              </div>
              <p
                id={helperId}
                className="mt-2 text-xs leading-5 text-[var(--color-text-muted)]"
              >
                Use um valor positivo. Nenhum dado será salvo.
              </p>
            </div>

            <div>
              <label
                htmlFor={strategyId}
                className="text-sm font-semibold text-[var(--color-text)]"
              >
                Estratégia da simulação
              </label>
              <select
                id={strategyId}
                value={strategy}
                onChange={(event) =>
                  onStrategyChange(
                    event.target.value as ContributionStrategyType
                  )
                }
                className="mt-2 min-h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold text-[var(--color-text)] outline-none transition focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-ring)]"
              >
                <option value="proportional">Proporcional demonstrativa</option>
                <option value="target-allocation">
                  Déficit por categoria — demonstrativa
                </option>
              </select>
            </div>

            {error ? (
              <p
                id={errorId}
                className="mt-3 text-sm font-semibold text-[var(--color-alert)]"
                role="alert"
              >
                {error}
              </p>
            ) : null}
          </div>

          <Button type="submit" className="min-h-12 w-full sm:w-auto">
            <Calculator className="size-4" aria-hidden="true" />
            Simular aporte
          </Button>
        </div>
      </form>
    </Card>
  )
}
