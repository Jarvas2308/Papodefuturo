import { FUNDAMENTAL_RATIO_SCALE } from '../derived/types'
import type { SignedMonetaryFact } from '../types'

// ROE = lucro liquido / patrimonio liquido (docs/reference/ACOES_BR_SETORES_E_METRICAS.md,
// secao 3.3). A formula academica usa patrimonio liquido MEDIO
// (inicio+fim / 2); esta versao usa o patrimonio liquido do fim do periodo
// (ponto no tempo, nao media) - simplificacao pragmatica documentada, mesma
// pratica de calculadoras publicas de ROE quando so ha um snapshot por
// periodo disponivel. BigInt exato, nunca ponto flutuante em razao
// financeira - mesma disciplina de computeFiiPvpScaledV1.
export function computeStockRoeScaledV1(input: {
  netIncome: SignedMonetaryFact
  totalEquity: SignedMonetaryFact
}): number {
  const { netIncome, totalEquity } = input

  if (netIncome.currency !== totalEquity.currency) {
    throw new RangeError(
      'Net income and total equity must use the same currency'
    )
  }
  if (!Number.isSafeInteger(netIncome.amountInMinorUnits)) {
    throw new RangeError('Net income must be a safe integer')
  }
  if (
    !Number.isSafeInteger(totalEquity.amountInMinorUnits) ||
    totalEquity.amountInMinorUnits <= 0
  ) {
    throw new RangeError('Total equity must be a positive safe integer')
  }

  const numerator =
    BigInt(netIncome.amountInMinorUnits) * BigInt(FUNDAMENTAL_RATIO_SCALE)
  const denominator = BigInt(totalEquity.amountInMinorUnits)
  const negative = numerator < 0n
  const absNumerator = negative ? -numerator : numerator
  const quotient = absNumerator / denominator
  const remainder = absNumerator % denominator
  const roundedAbs = remainder * 2n >= denominator ? quotient + 1n : quotient
  const roeScaled = negative ? -roundedAbs : roundedAbs

  if (
    roeScaled > BigInt(Number.MAX_SAFE_INTEGER) ||
    roeScaled < BigInt(-Number.MAX_SAFE_INTEGER)
  ) {
    throw new RangeError('ROE result exceeds the safe integer range')
  }

  return Number(roeScaled)
}
