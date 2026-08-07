import { FUNDAMENTAL_RATIO_SCALE } from '../derived/types'
import type { ExactDecimalQuantity, SignedMonetaryFact } from '../types'

// Payout = (dividendos + JCP) ÷ lucro líquido do período
// (docs/reference/ACOES_BR_SETORES_E_METRICAS.md, seção 3.6). Dividendo
// total = valor bruto por ação (trailing-12-meses,
// computeProventoTrailingTwelveMonthValueV1) × ações emitidas. BigInt
// exato, nunca ponto flutuante em razão financeira - mesma disciplina de
// computeStockNetDebtToEbitdaScaledV1. Lucro líquido não positivo não
// tem razão de payout com sentido - lançar em vez de devolver um número
// enganoso.
export function computeStockPayoutRatioScaledV1(input: {
  trailingTwelveMonthDividendPerShare: ExactDecimalQuantity
  issuedShares: ExactDecimalQuantity
  netIncome: SignedMonetaryFact
}): number {
  const { trailingTwelveMonthDividendPerShare, issuedShares, netIncome } = input

  if (netIncome.currency !== 'BRL') {
    throw new RangeError('Payout ratio requires BRL net income')
  }
  if (!Number.isSafeInteger(netIncome.amountInMinorUnits)) {
    throw new RangeError('Net income must be a safe integer')
  }
  if (netIncome.amountInMinorUnits <= 0) {
    throw new RangeError(
      'Net income must be positive to compute a payout ratio'
    )
  }

  const numerator =
    BigInt(trailingTwelveMonthDividendPerShare.unscaledValue) *
    BigInt(issuedShares.unscaledValue) *
    100n *
    BigInt(FUNDAMENTAL_RATIO_SCALE)
  const denominator =
    10n **
      BigInt(trailingTwelveMonthDividendPerShare.scale + issuedShares.scale) *
    BigInt(netIncome.amountInMinorUnits)

  const quotient = numerator / denominator
  const remainder = numerator % denominator
  const ratioScaled = remainder * 2n >= denominator ? quotient + 1n : quotient

  if (ratioScaled > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError('Payout ratio result exceeds the safe integer range')
  }

  return Number(ratioScaled)
}
