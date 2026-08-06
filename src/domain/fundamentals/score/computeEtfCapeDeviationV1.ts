// CAPE vs propria media historica de 10 anos (docs/reference/REGRAS_DE_PONTUACAO_RASCUNHO.md,
// secao 4) - Sprint 16, Fase 5 fatia ETF (DEC-091). BigInt exato: media dos
// valores escalados (arredondamento half-away-from-zero), depois desvio =
// atual - media. Convencao: a janela de 10 anos INCLUI o ponto mais
// recente (media movel simples ate a data mais recente disponivel, nao
// "media dos 10 anos anteriores excluindo hoje") - decisao documentada
// aqui, nao inferida em silencio.
export type ShillerCapeHistoryPoint = {
  referenceDate: string
  valueScaled: number
}

function monthsBetween(earlier: string, later: string): number {
  const [earlierYear, earlierMonth] = earlier.split('-').map(Number)
  const [laterYear, laterMonth] = later.split('-').map(Number)
  if (
    earlierYear === undefined ||
    earlierMonth === undefined ||
    laterYear === undefined ||
    laterMonth === undefined
  ) {
    throw new RangeError('referenceDate must be in YYYY-MM-DD format')
  }
  return (laterYear - earlierYear) * 12 + (laterMonth - earlierMonth)
}

export function computeEtfCapeDeviationV1(input: {
  history: readonly ShillerCapeHistoryPoint[]
  windowYears?: number
}): { currentScaled: number; averageScaled: number; deviationScaled: number } {
  const { history, windowYears = 10 } = input

  if (history.length === 0) {
    throw new RangeError('CAPE history must not be empty')
  }

  const latest = history.reduce((best, point) =>
    point.referenceDate > best.referenceDate ? point : best
  )
  const windowMonths = windowYears * 12
  const windowPoints = history.filter(
    (point) =>
      monthsBetween(point.referenceDate, latest.referenceDate) < windowMonths
  )

  const sum = windowPoints.reduce(
    (total, point) => total + BigInt(point.valueScaled),
    0n
  )
  const count = BigInt(windowPoints.length)
  const quotient = sum / count
  const remainder = sum % count
  const averageScaled = Number(
    remainder * 2n >= count ? quotient + 1n : quotient
  )

  return {
    currentScaled: latest.valueScaled,
    averageScaled,
    deviationScaled: latest.valueScaled - averageScaled,
  }
}
