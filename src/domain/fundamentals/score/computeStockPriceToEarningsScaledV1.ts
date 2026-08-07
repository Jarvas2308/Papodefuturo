import { FUNDAMENTAL_RATIO_SCALE } from '../derived/types'
import type { ExactDecimalQuantity, SignedMonetaryFact } from '../types'

// P/L = preço de mercado ÷ LPA (lucro por ação)
// (docs/reference/ACOES_BR_SETORES_E_METRICAS.md, seção 3.1). LPA = lucro
// líquido do exercício ÷ ações emitidas da classe negociada (mesma fonte
// `issuedShares` de `computeStockPayoutRatioScaledV1`). Preço é o
// fechamento B3 (COTAHIST) no último pregão do próprio exercício (data de
// referência do DFP), não a cotação atual - o sinal compara P/L histórico
// exercício a exercício, não P/L corrente.
//
// P/L = preço ÷ (lucro / ações) = preço × ações ÷ lucro. O preço e o lucro
// líquido já vêm em unidades menores (centavos) na mesma moeda - o fator
// de escala de centavos se cancela algebricamente entre numerador e
// denominador, então a fórmula abaixo usa os dois em unidades menores
// diretamente, sem reconverter para reais. BigInt exato, arredondamento
// half-away-from-zero, mesma disciplina de
// `computeStockNetDebtToEbitdaScaledV1`/`computeStockPayoutRatioScaledV1`.
// Lucro líquido não positivo não tem P/L com sentido (companhia com
// prejuízo) - lançar em vez de devolver um número enganoso.
export function computeStockPriceToEarningsScaledV1(input: {
  closePriceInMinorUnits: number
  issuedShares: ExactDecimalQuantity
  netIncome: SignedMonetaryFact
}): number {
  const { closePriceInMinorUnits, issuedShares, netIncome } = input

  if (netIncome.currency !== 'BRL') {
    throw new RangeError('Price-to-earnings requires BRL net income')
  }
  if (
    !Number.isSafeInteger(closePriceInMinorUnits) ||
    closePriceInMinorUnits <= 0
  ) {
    throw new RangeError(
      'Close price must be a positive safe integer in minor units'
    )
  }
  if (!Number.isSafeInteger(netIncome.amountInMinorUnits)) {
    throw new RangeError('Net income must be a safe integer')
  }
  if (netIncome.amountInMinorUnits <= 0) {
    throw new RangeError(
      'Net income must be positive to compute a price-to-earnings ratio'
    )
  }
  if (
    !Number.isSafeInteger(issuedShares.unscaledValue) ||
    issuedShares.unscaledValue <= 0
  ) {
    throw new RangeError('Issued shares must be a positive safe integer')
  }

  const numerator =
    BigInt(closePriceInMinorUnits) *
    BigInt(issuedShares.unscaledValue) *
    BigInt(FUNDAMENTAL_RATIO_SCALE)
  const denominator =
    10n ** BigInt(issuedShares.scale) * BigInt(netIncome.amountInMinorUnits)

  const quotient = numerator / denominator
  const remainder = numerator % denominator
  const ratioScaled = remainder * 2n >= denominator ? quotient + 1n : quotient

  if (ratioScaled > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError(
      'Price-to-earnings result exceeds the safe integer range'
    )
  }

  return Number(ratioScaled)
}
