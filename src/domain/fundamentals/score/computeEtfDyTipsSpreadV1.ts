import type { ExactDecimalQuantity } from '../types'

// Spread de DY de ETF sobre a TIPS de 10 anos
// (docs/reference/REGRAS_DE_PONTUACAO_RASCUNHO.md, seção 4, linhas
// "Spread DY sobre TIPS 10 anos", aplicáveis a VNQ).
//
// Numerador e denominador vêm do MESMO documento oficial (N-CSR anual da
// SEC, tabela "Financial Highlights" da classe ETF do fundo): "Total
// Distributions" por cota do exercício e "Net Asset Value, End of
// Period". Usar o NAV do próprio filing, e não a cotação de mercado,
// mantém as duas pontas com a mesma data de referência e a mesma fonte
// auditável — o mesmo espírito do DY de FII, que vem pronto do Informe
// Mensal da CVM em vez de ser recomposto com preço de mercado.
//
// A taxa TIPS fica em `market_reference_rates` (série `fred-dfii10`,
// DEC-093) como par rateScaled/rateScale — rateScaled ÷ rateScale já é o
// número percentual puro (ex.: 2,41 = 2,41%), NÃO o formato
// unscaledValue/10^scale de ExactDecimalQuantity.
//
// Resultado em pontos percentuais. BigInt exato com escala interna de
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

function assertExactDecimal(
  value: ExactDecimalQuantity,
  description: string
): void {
  if (
    !value ||
    !Number.isSafeInteger(value.unscaledValue) ||
    !Number.isSafeInteger(value.scale) ||
    value.scale < 0
  ) {
    throw new RangeError(`${description} must use a safe-integer unscaled/scale`)
  }
}

export function computeEtfDyTipsSpreadV1(input: {
  totalDistributionsPerShare: ExactDecimalQuantity
  netAssetValueEndOfPeriod: ExactDecimalQuantity
  tipsRateScaled: number
  tipsRateScale: number
}): number {
  const {
    totalDistributionsPerShare,
    netAssetValueEndOfPeriod,
    tipsRateScaled,
    tipsRateScale,
  } = input

  assertExactDecimal(totalDistributionsPerShare, 'ETF total distributions')
  assertExactDecimal(netAssetValueEndOfPeriod, 'ETF net asset value')

  if (
    !Number.isSafeInteger(tipsRateScaled) ||
    !Number.isSafeInteger(tipsRateScale) ||
    tipsRateScale <= 0
  ) {
    throw new RangeError('TIPS rate must use safe-integer scaled/scale')
  }

  if (netAssetValueEndOfPeriod.unscaledValue <= 0) {
    throw new RangeError('ETF net asset value must be strictly positive')
  }

  if (totalDistributionsPerShare.unscaledValue < 0) {
    throw new RangeError('ETF total distributions must not be negative')
  }

  // DY em pontos percentuais = (distribuições / NAV) x 100, mantendo as
  // escalas decimais de origem sem truncar nenhuma delas antes da divisão.
  const dyPpScaled = roundHalfAwayFromZeroDiv(
    BigInt(totalDistributionsPerShare.unscaledValue) *
      100n *
      PP_SCALE *
      10n ** BigInt(netAssetValueEndOfPeriod.scale),
    BigInt(netAssetValueEndOfPeriod.unscaledValue) *
      10n ** BigInt(totalDistributionsPerShare.scale)
  )

  // TIPS já é número percentual puro (2,41 = 2,41%).
  const tipsPpScaled = roundHalfAwayFromZeroDiv(
    BigInt(tipsRateScaled) * PP_SCALE,
    BigInt(tipsRateScale)
  )

  const spreadPpScaled = dyPpScaled - tipsPpScaled

  if (
    spreadPpScaled > BigInt(Number.MAX_SAFE_INTEGER) ||
    spreadPpScaled < BigInt(-Number.MAX_SAFE_INTEGER)
  ) {
    throw new RangeError('ETF DY-TIPS spread exceeds the safe integer range')
  }

  return Number(spreadPpScaled) / Number(PP_SCALE)
}
