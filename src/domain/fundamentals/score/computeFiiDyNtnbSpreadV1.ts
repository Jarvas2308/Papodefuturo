import type { ExactDecimalQuantity } from '../types'

// Spread de DY sobre NTN-B longa
// (docs/reference/FII_SEGMENTOS_E_METRICAS.md, seção 3.2/7.2): DY
// trailing-12-meses (soma de fração decimal mensal do CVM, ex. 0,06 =
// 6%) menos a taxa NTN-B (armazenada em market_reference_rates como par
// rateScaled/rateScale - rateScaled ÷ rateScale já é o número percentual
// puro, ex. 7,42 = 7,42%, NÃO o formato unscaledValue/10^scale de
// ExactDecimalQuantity - as duas colunas do banco são um par próprio,
// mesmo quando o divisor observado na prática é uma potência de 10).
// Resultado em pontos percentuais. BigInt exato via escala interna de
// 1e6, nunca ponto flutuante em razão financeira.
const PP_SCALE = 1_000_000n

function roundHalfAwayFromZeroDiv(
  numerator: bigint,
  denominator: bigint
): bigint {
  const negative = numerator < 0n !== denominator < 0n
  const absNumerator = numerator < 0n ? -numerator : numerator
  const absDenominator = denominator < 0n ? -denominator : denominator
  const quotient = absNumerator / absDenominator
  const remainder = absNumerator % absDenominator
  const rounded = remainder * 2n >= absDenominator ? quotient + 1n : quotient
  return negative ? -rounded : rounded
}

export function computeFiiDyNtnbSpreadV1(input: {
  trailingTwelveMonthDividendYield: ExactDecimalQuantity
  ntnbRateScaled: number
  ntnbRateScale: number
}): number {
  const { trailingTwelveMonthDividendYield, ntnbRateScaled, ntnbRateScale } =
    input

  if (
    !Number.isSafeInteger(ntnbRateScaled) ||
    !Number.isSafeInteger(ntnbRateScale) ||
    ntnbRateScale <= 0
  ) {
    throw new RangeError('NTN-B rate must use safe-integer scaled/scale')
  }

  // DY em fração decimal (0,06 = 6%) -> ponto percentual: x 100.
  const dyPpScaled = roundHalfAwayFromZeroDiv(
    BigInt(trailingTwelveMonthDividendYield.unscaledValue) * 100n * PP_SCALE,
    10n ** BigInt(trailingTwelveMonthDividendYield.scale)
  )

  // NTN-B já é número percentual puro (7,42 = 7,42%).
  const ntnbPpScaled = roundHalfAwayFromZeroDiv(
    BigInt(ntnbRateScaled) * PP_SCALE,
    BigInt(ntnbRateScale)
  )

  const spreadPpScaled = dyPpScaled - ntnbPpScaled

  if (
    spreadPpScaled > BigInt(Number.MAX_SAFE_INTEGER) ||
    spreadPpScaled < BigInt(-Number.MAX_SAFE_INTEGER)
  ) {
    throw new RangeError('FII DY-NTNB spread exceeds the safe integer range')
  }

  return Number(spreadPpScaled) / Number(PP_SCALE)
}
