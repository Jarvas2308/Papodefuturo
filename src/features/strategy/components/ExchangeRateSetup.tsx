import { useState } from 'react'
import { EXCHANGE_RATE_SCALE } from '../../../domain/models'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'

type ExchangeRateSetupProps = {
  onSave(rateScaled: number): Promise<void>
}

function parseUsdBrlRate(value: string): number | null {
  const normalized = value.trim().replace(',', '.')

  if (!/^\d{1,3}(?:\.\d{1,6})?$/.test(normalized)) {
    return null
  }

  const rate = Number(normalized)
  const rateScaled = Math.round(rate * EXCHANGE_RATE_SCALE)

  if (!Number.isSafeInteger(rateScaled) || rateScaled <= 0) {
    return null
  }

  return rateScaled
}

export function ExchangeRateSetup({ onSave }: ExchangeRateSetupProps) {
  const [value, setValue] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const parsedRate = parseUsdBrlRate(value)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (parsedRate === null || isSaving) {
      setFeedback('Informe uma cotação USD/BRL válida, por exemplo 5,432100.')
      return
    }

    setIsSaving(true)
    setFeedback('')

    try {
      await onSave(parsedRate)
      setFeedback('Cotação salva. Recalculando a estratégia em BRL.')
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar a cotação USD/BRL.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="space-y-5 p-5 sm:p-6">
      <div>
        <p className="text-sm font-semibold text-[var(--color-primary)]">
          Conversão cambial necessária
        </p>
        <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
          Informe a cotação USD/BRL
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
          Sua carteira possui posição internacional confirmada. A Estratégia não
          soma dólares e reais diretamente; registre a cotação usada para
          converter as posições em USD para BRL.
        </p>
      </div>

      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={handleSubmit}
      >
        <label className="flex-1 text-sm font-medium text-[var(--color-text)]">
          1 USD em BRL
          <input
            className="mt-2 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
            inputMode="decimal"
            placeholder="5,432100"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            aria-describedby="exchange-rate-helper"
          />
        </label>
        <Button type="submit" disabled={parsedRate === null || isSaving}>
          {isSaving ? 'Salvando...' : 'Salvar cotação'}
        </Button>
      </form>

      <p
        id="exchange-rate-helper"
        className="text-xs leading-5 text-[var(--color-text-muted)]"
      >
        A taxa é armazenada com precisão de até 6 casas decimais e marcada como
        origem manual.
      </p>

      {feedback ? (
        <p
          className="text-sm font-medium text-[var(--color-text)]"
          aria-live="polite"
        >
          {feedback}
        </p>
      ) : null}
    </Card>
  )
}
