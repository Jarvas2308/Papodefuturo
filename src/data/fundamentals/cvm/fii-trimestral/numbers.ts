import {
  normalizeExactDecimalQuantity,
  type ExactDecimalQuantity,
} from '../../../../domain/fundamentals'
import type { CvmFiiTrimestralMaturityFaixa } from './types'

// Ponto medio de cada faixa de vencimento, em centesimos de mes (150 =
// 1,5 mes). "Acima_36Meses" usa piso conservador (36 meses exatos, nao
// um ponto medio real - a faixa e' aberta) e "indeterminado" fica de fora
// (sem chave aqui = excluido do calculo de WALE). Ver DEC-080.
export const MATURITY_FAIXA_MIDPOINT_MONTHS_X100: Partial<
  Record<CvmFiiTrimestralMaturityFaixa, number>
> = {
  ate3Meses: 150,
  '3a6Meses': 450,
  '6a9Meses': 750,
  '9a12Meses': 1050,
  '12a15Meses': 1350,
  '15a18Meses': 1650,
  '18a21Meses': 1950,
  '21a24Meses': 2250,
  '24a27Meses': 2550,
  '27a30Meses': 2850,
  '30a33Meses': 3150,
  '33a36Meses': 3450,
  acima36Meses: 3600,
}

const MAX_SAFE_INTEGER_BIGINT = BigInt(Number.MAX_SAFE_INTEGER)
const BASIS_POINTS_SCALE = 10_000n
// Escala fixa de armazenamento para o peso agregado (provenance/auditoria
// apenas - nao participa de mais aritmetica). Precisao de 1e-6 e suficiente
// para conferencia humana e evita que a soma, ao ser convertida para o
// scale comum (que pode chegar a 17 casas nos dados reais da CVM), estoure
// Number.MAX_SAFE_INTEGER.
const WEIGHT_SUM_STORAGE_SCALE = 6n

type VacancyWeightPair = {
  vacancy: ExactDecimalQuantity
  weight: ExactDecimalQuantity
}

function toCommonScale(
  value: ExactDecimalQuantity,
  commonScale: number
): bigint {
  const scaleGap = commonScale - value.scale
  if (scaleGap < 0) {
    throw new RangeError('Common scale must be at least the value scale')
  }
  return BigInt(value.unscaledValue) * 10n ** BigInt(scaleGap)
}

/**
 * Media ponderada de vacancia por participacao na receita do fundo
 * (Percentual_Receitas_FII), em pontos-base (0-10000). Pesos NAO sao
 * assumidos como normalizados (a soma observada em dados reais fica abaixo
 * de 1 - ha receita nao alocada a imovel) - por isso a divisao usa a soma
 * real dos pesos, nunca 1 fixo. Toda a aritmetica e em BigInt para evitar
 * erro de ponto flutuante (ver docs/reference/FII_SEGMENTOS_E_METRICAS.md,
 * secao 7.1).
 */
export function computeWeightedAverageVacancyInBasisPoints(
  pairs: readonly VacancyWeightPair[]
): { basisPoints: number | null; weightSum: ExactDecimalQuantity } {
  if (pairs.length === 0) {
    return { basisPoints: null, weightSum: { unscaledValue: 0, scale: 0 } }
  }

  const commonScale = pairs.reduce(
    (max, pair) => Math.max(max, pair.vacancy.scale, pair.weight.scale),
    0
  )

  let numerator = 0n
  let weightSum = 0n

  for (const pair of pairs) {
    const vacancyAtScale = toCommonScale(pair.vacancy, commonScale)
    const weightAtScale = toCommonScale(pair.weight, commonScale)
    numerator += vacancyAtScale * weightAtScale
    weightSum += weightAtScale
  }

  if (weightSum <= 0n) {
    return {
      basisPoints: null,
      weightSum: { unscaledValue: 0, scale: 0 },
    }
  }

  const denominator = weightSum * 10n ** BigInt(commonScale)
  const scaledNumerator = numerator * BASIS_POINTS_SCALE
  const quotient = scaledNumerator / denominator
  const remainder = scaledNumerator % denominator
  const rounded = remainder * 2n >= denominator ? quotient + 1n : quotient

  if (rounded < 0n || rounded > BASIS_POINTS_SCALE) {
    throw new RangeError(
      `Weighted average vacancy out of basis-point range: ${rounded.toString()}`
    )
  }
  if (rounded > MAX_SAFE_INTEGER_BIGINT) {
    throw new RangeError('Weighted average vacancy exceeds safe integer range')
  }

  const weightSumScaledNumerator =
    weightSum * 10n ** WEIGHT_SUM_STORAGE_SCALE
  const weightSumDenominator = 10n ** BigInt(commonScale)
  const weightSumQuotient = weightSumScaledNumerator / weightSumDenominator
  const weightSumRemainder = weightSumScaledNumerator % weightSumDenominator
  const weightSumRounded =
    weightSumRemainder * 2n >= weightSumDenominator
      ? weightSumQuotient + 1n
      : weightSumQuotient

  if (weightSumRounded > MAX_SAFE_INTEGER_BIGINT) {
    throw new RangeError('Weighted average vacancy weight sum overflowed')
  }

  return {
    basisPoints: Number(rounded),
    weightSum: normalizeExactDecimalQuantity(
      {
        unscaledValue: Number(weightSumRounded),
        scale: Number(WEIGHT_SUM_STORAGE_SCALE),
      },
      'CVM FII trimestral weight sum'
    ),
  }
}

/**
 * Converte uma fracao 0-1 isolada (sem agregacao) em pontos-base (0-10000),
 * arredondamento half-up em BigInt. Usado pelo indexador da carteira
 * (`Percentual_Indexador_Receita_FII_*` da tabela `complemento`, 1 linha
 * por fundo por trimestre - ao contrario da vacancia, nao ha nada para
 * ponderar).
 */
export function toBasisPoints(
  value: ExactDecimalQuantity | null
): number | null {
  if (value === null) {
    return null
  }

  const numerator = BigInt(value.unscaledValue) * BASIS_POINTS_SCALE
  const denominator = 10n ** BigInt(value.scale)
  const quotient = numerator / denominator
  const remainder = numerator % denominator
  const rounded = remainder * 2n >= denominator ? quotient + 1n : quotient

  if (rounded < 0n || rounded > BASIS_POINTS_SCALE) {
    throw new RangeError(
      `Fraction out of basis-point range: ${rounded.toString()}`
    )
  }

  return Number(rounded)
}

function roundBigIntFractionToStorageScale(
  numerator: bigint,
  fromScale: number
): ExactDecimalQuantity {
  const scaledNumerator = numerator * 10n ** WEIGHT_SUM_STORAGE_SCALE
  const denominator = 10n ** BigInt(fromScale)
  const quotient = scaledNumerator / denominator
  const remainder = scaledNumerator % denominator
  const rounded = remainder * 2n >= denominator ? quotient + 1n : quotient

  if (rounded > MAX_SAFE_INTEGER_BIGINT) {
    throw new RangeError('Fraction sum overflowed the safe integer range')
  }

  return normalizeExactDecimalQuantity(
    {
      unscaledValue: Number(rounded),
      scale: Number(WEIGHT_SUM_STORAGE_SCALE),
    },
    'CVM FII trimestral sector revenue share sum'
  )
}

/**
 * Concentracao por setor de inquilino (DEC-078): soma `Percentual_Receitas_FII`
 * por `Setor_Atuacao` (um fundo pode ter o mesmo setor em varios imoveis -
 * a soma agrega todos), depois pega o MAIOR setor - nao ha ponderacao
 * adicional, cada linha ja e participacao direta na receita do fundo.
 * CVM nao divulga inquilino nomeado, so o setor de atuacao.
 */
export function computeTenantConcentration(
  rows: readonly { sector: string; share: ExactDecimalQuantity }[]
): {
  basisPoints: number | null
  dominantSector: string | null
  sectors: readonly {
    sector: string
    sum: ExactDecimalQuantity
    rowCount: number
  }[]
} {
  if (rows.length === 0) {
    return { basisPoints: null, dominantSector: null, sectors: [] }
  }

  const commonScale = rows.reduce(
    (max, row) => Math.max(max, row.share.scale),
    0
  )

  const rawSumsBySector = new Map<string, { sum: bigint; rowCount: number }>()
  for (const row of rows) {
    const atScale = toCommonScale(row.share, commonScale)
    const existing = rawSumsBySector.get(row.sector)
    if (existing) {
      existing.sum += atScale
      existing.rowCount += 1
    } else {
      rawSumsBySector.set(row.sector, { sum: atScale, rowCount: 1 })
    }
  }

  let dominantSector: string | null = null
  let dominantSum = -1n
  for (const [sector, { sum }] of rawSumsBySector) {
    if (sum > dominantSum) {
      dominantSum = sum
      dominantSector = sector
    }
  }

  const denominator = 10n ** BigInt(commonScale)
  const scaledNumerator = dominantSum * BASIS_POINTS_SCALE
  const quotient = scaledNumerator / denominator
  const remainder = scaledNumerator % denominator
  const rounded = remainder * 2n >= denominator ? quotient + 1n : quotient

  if (rounded < 0n || rounded > BASIS_POINTS_SCALE) {
    throw new RangeError(
      `Tenant concentration out of basis-point range: ${rounded.toString()}`
    )
  }

  return {
    basisPoints: Number(rounded),
    dominantSector,
    sectors: Array.from(rawSumsBySector.entries()).map(
      ([sector, { sum, rowCount }]) => ({
        sector,
        sum: roundBigIntFractionToStorageScale(sum, commonScale),
        rowCount,
      })
    ),
  }
}

/**
 * WALE (prazo medio ponderado de vencimento) em meses, escala x100
 * (2 casas decimais). Media ponderada por receita usando o ponto medio de
 * cada faixa - `indeterminado` nao tem ponto medio (sem informacao de
 * prazo) e e' excluido tanto do numerador quanto do denominador. O
 * arredondamento half-up e' exato porque `midpointMonthsX100` ja carrega
 * a escala de saida: `numerador/denominador` sem escala adicional (ver
 * comentario no chamador, DEC-080).
 */
export function computeWaleInMonths(
  pairs: readonly { midpointMonthsX100: number; weight: ExactDecimalQuantity }[]
): { monthsScaledBy100: number | null; weightSum: ExactDecimalQuantity } {
  if (pairs.length === 0) {
    return { monthsScaledBy100: null, weightSum: { unscaledValue: 0, scale: 0 } }
  }

  const commonScale = pairs.reduce(
    (max, pair) => Math.max(max, pair.weight.scale),
    0
  )

  let numerator = 0n
  let weightSum = 0n

  for (const pair of pairs) {
    const weightAtScale = toCommonScale(pair.weight, commonScale)
    numerator += BigInt(pair.midpointMonthsX100) * weightAtScale
    weightSum += weightAtScale
  }

  if (weightSum <= 0n) {
    return { monthsScaledBy100: null, weightSum: { unscaledValue: 0, scale: 0 } }
  }

  const quotient = numerator / weightSum
  const remainder = numerator % weightSum
  const rounded = remainder * 2n >= weightSum ? quotient + 1n : quotient

  if (rounded < 0n || rounded > MAX_SAFE_INTEGER_BIGINT) {
    throw new RangeError(`WALE out of safe range: ${rounded.toString()}`)
  }

  return {
    monthsScaledBy100: Number(rounded),
    weightSum: roundBigIntFractionToStorageScale(weightSum, commonScale),
  }
}
