import { normalizeExactDecimalQuantity } from '../exactDecimalQuantity'
import type { ExactDecimalQuantity } from '../types'

export type FiiMonthlyDividendYieldPointV1 = {
  referenceDate: string
  version: number
  dividendYield: ExactDecimalQuantity
}

const MS_PER_DAY = 24 * 60 * 60 * 1000
const TRAILING_WINDOW_DAYS = 365
const REQUIRED_MONTH_COUNT = 12

/**
 * Soma o dividend yield mensal (CVM Informe Mensal complemento,
 * Percentual_Dividend_Yield_Mes) dos últimos 12 meses até
 * `windowEndDate` (inclusive), pra um único fundo. Dedup por
 * referenceDate: mês reenviado com Versão maior substitui a versão
 * anterior, mesmo espírito de "versão mais alta vence" de
 * computeProventoTrailingTwelveMonthValueV1.
 *
 * Devolve `null` (nunca soma parcial) quando menos de 12 meses distintos
 * caem na janela - mesma disciplina confirmada com o usuário pro sinal
 * de provento: mês faltando marca o sinal inteiro `unavailable`, nunca
 * um trailing-12m incompleto disfarçado de completo.
 */
export function computeFiiTrailingTwelveMonthDividendYieldV1(input: {
  monthlyPoints: readonly FiiMonthlyDividendYieldPointV1[]
  windowEndDate: string
}): ExactDecimalQuantity | null {
  const { monthlyPoints, windowEndDate } = input

  const latestByMonth = new Map<string, FiiMonthlyDividendYieldPointV1>()
  for (const point of monthlyPoints) {
    const existing = latestByMonth.get(point.referenceDate)
    if (!existing || point.version > existing.version) {
      latestByMonth.set(point.referenceDate, point)
    }
  }

  const windowEndMs = Date.parse(`${windowEndDate}T00:00:00.000Z`)
  const windowStartMs = windowEndMs - TRAILING_WINDOW_DAYS * MS_PER_DAY

  const inWindow = [...latestByMonth.values()].filter((point) => {
    const referenceMs = Date.parse(`${point.referenceDate}T00:00:00.000Z`)
    return referenceMs > windowStartMs && referenceMs <= windowEndMs
  })

  if (inWindow.length < REQUIRED_MONTH_COUNT) {
    return null
  }

  const maxScale = Math.max(
    ...inWindow.map((point) => point.dividendYield.scale)
  )
  const totalUnscaled = inWindow.reduce((sum, point) => {
    const scaleDiff = maxScale - point.dividendYield.scale
    return (
      sum + BigInt(point.dividendYield.unscaledValue) * 10n ** BigInt(scaleDiff)
    )
  }, 0n)

  if (totalUnscaled > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError(
      'FII trailing-12-month dividend yield exceeds the safe integer range'
    )
  }

  return normalizeExactDecimalQuantity(
    { unscaledValue: Number(totalUnscaled), scale: maxScale },
    'FII trailing-12-month dividend yield'
  )
}
