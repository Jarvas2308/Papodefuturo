import { FUNDAMENTAL_RATIO_SCALE } from '../derived/types'
import type { SignedMonetaryFact } from '../types'

// Dívida líquida / EBITDA = (dívida financeira circulante + não circulante
// − caixa e equivalentes) ÷ (EBIT + depreciação e amortização)
// (docs/reference/ACOES_BR_SETORES_E_METRICAS.md, seção 3.5). Não se
// aplica a banco - ver `buildBrazilianStockScoreV1.ts`. BigInt exato,
// nunca ponto flutuante em razão financeira - mesma disciplina de
// `computeStockRoeScaledV1`. EBITDA não positivo não tem razão de
// alavancagem com sentido (empresa queimando caixa operacional) - lançar
// em vez de devolver um número enganoso.
export function computeStockNetDebtToEbitdaScaledV1(input: {
  financialDebtCurrent: SignedMonetaryFact
  financialDebtNonCurrent: SignedMonetaryFact
  cashAndEquivalents: SignedMonetaryFact
  ebit: SignedMonetaryFact
  depreciationAndAmortization: SignedMonetaryFact
}): number {
  const {
    financialDebtCurrent,
    financialDebtNonCurrent,
    cashAndEquivalents,
    ebit,
    depreciationAndAmortization,
  } = input

  const currency = financialDebtCurrent.currency
  for (const fact of [
    financialDebtNonCurrent,
    cashAndEquivalents,
    ebit,
    depreciationAndAmortization,
  ]) {
    if (fact.currency !== currency) {
      throw new RangeError(
        'All net debt / EBITDA inputs must use the same currency'
      )
    }
  }
  for (const fact of [
    financialDebtCurrent,
    financialDebtNonCurrent,
    cashAndEquivalents,
    ebit,
    depreciationAndAmortization,
  ]) {
    if (!Number.isSafeInteger(fact.amountInMinorUnits)) {
      throw new RangeError('Net debt / EBITDA inputs must be safe integers')
    }
  }

  const netDebt =
    BigInt(financialDebtCurrent.amountInMinorUnits) +
    BigInt(financialDebtNonCurrent.amountInMinorUnits) -
    BigInt(cashAndEquivalents.amountInMinorUnits)
  const ebitda =
    BigInt(ebit.amountInMinorUnits) +
    BigInt(depreciationAndAmortization.amountInMinorUnits)

  if (ebitda <= 0n) {
    throw new RangeError('EBITDA must be positive to compute a leverage ratio')
  }

  const numerator = netDebt * BigInt(FUNDAMENTAL_RATIO_SCALE)
  const negative = numerator < 0n
  const absNumerator = negative ? -numerator : numerator
  const quotient = absNumerator / ebitda
  const remainder = absNumerator % ebitda
  const roundedAbs = remainder * 2n >= ebitda ? quotient + 1n : quotient
  const ratioScaled = negative ? -roundedAbs : roundedAbs

  if (
    ratioScaled > BigInt(Number.MAX_SAFE_INTEGER) ||
    ratioScaled < BigInt(-Number.MAX_SAFE_INTEGER)
  ) {
    throw new RangeError(
      'Net debt / EBITDA result exceeds the safe integer range'
    )
  }

  return Number(ratioScaled)
}
