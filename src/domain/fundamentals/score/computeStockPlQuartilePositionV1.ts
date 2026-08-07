// P/L vs própria série histórica (docs/reference/REGRAS_DE_PONTUACAO_RASCUNHO.md,
// seção 3): "abaixo do próprio quartil inferior" pontua +1. Mesma
// convenção de `computeEtfCapeDeviationV1` (janela histórica INCLUI o
// ponto mais recente, e o sinal final é a distância entre o valor atual
// e o próprio marco histórico, não o valor bruto) - permite que
// `buildBrazilianStockScoreV1.ts` reaproveite o mecanismo estático de
// `SignalRuleV1` (limiar fixo em zero) mesmo com um marco (quartil
// inferior) que é dinâmico por ativo.
//
// Método do quartil: "nearest-rank" (ordem estatística por índice, sem
// interpolação) sobre os valores de P/L escalados ordenados
// ascendentemente - `rank = ceil(0.25 × n)`, quartil inferior = valor na
// posição `rank` (1-based). Escolhido por ser aritmética inteira exata
// (sem ponto flutuante), sem ambiguidade de fronteira, e adequado a
// amostras pequenas onde interpolação linear entre pontos não teria
// sentido adicional.
//
// Tamanho mínimo de amostra: decisão técnica direta, não de produto
// (AGENTS.md seção 15) - quartil de amostra menor que 5 pontos degenera:
// com 2-4 pontos, `rank` sempre aponta pro próprio valor mais baixo (ou
// perto dele), tornando "abaixo do quartil inferior" quase sempre
// verdadeiro por construção, não por sinal real de barateamento. Com 5+
// pontos o quartil passa a separar de fato o quarto mais barato do
// resto da série. Documentado explicitamente aqui, nunca inferido em
// silêncio - ver docs/CHANGELOG-DECISIONS.md.
export const STOCK_PL_HISTORY_MIN_POINTS = 5

export type StockPlHistoryPointV1 = {
  referenceDate: string
  plScaled: number
}

export type StockPlQuartilePositionV1 = {
  currentScaled: number
  currentReferenceDate: string
  lowerQuartileScaled: number
  deviationScaled: number
  belowLowerQuartile: boolean
  sampleSize: number
}

export function computeStockPlQuartilePositionV1(input: {
  history: readonly StockPlHistoryPointV1[]
}): StockPlQuartilePositionV1 | null {
  const { history } = input

  if (history.length < STOCK_PL_HISTORY_MIN_POINTS) {
    return null
  }

  const latest = history.reduce((best, point) =>
    point.referenceDate > best.referenceDate ? point : best
  )

  const sortedAscending = [...history].sort((a, b) => a.plScaled - b.plScaled)
  const sampleSize = sortedAscending.length
  const rank = Math.ceil(0.25 * sampleSize)
  const lowerQuartilePoint = sortedAscending[rank - 1]

  if (lowerQuartilePoint === undefined) {
    return null
  }

  const lowerQuartileScaled = lowerQuartilePoint.plScaled
  const deviationScaled = latest.plScaled - lowerQuartileScaled

  return {
    currentScaled: latest.plScaled,
    currentReferenceDate: latest.referenceDate,
    lowerQuartileScaled,
    deviationScaled,
    belowLowerQuartile: deviationScaled < 0,
    sampleSize,
  }
}
