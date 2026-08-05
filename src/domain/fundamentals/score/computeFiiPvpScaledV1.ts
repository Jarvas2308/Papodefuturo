import type { ScaledMonetaryPerQuantity } from '../derived/types'
import { FUNDAMENTAL_RATIO_SCALE } from '../derived/types'

// P/VP = cotacao de mercado / valor patrimonial por cota. Ambos os lados
// ja chegam em unidades minor exatas (centavos) - divisao feita em BigInt
// para preservar exatidao ate o arredondamento final, mesma disciplina do
// resto do dominio de fundamentos (nunca ponto flutuante em dado
// financeiro). Resultado escalado por FUNDAMENTAL_RATIO_SCALE (1e6), mesma
// convencao de ScaledFundamentalRatio ja usada nos derivados.
export function computeFiiPvpScaledV1(input: {
  marketPriceInMinorUnits: number
  netAssetValuePerIssuedShare: ScaledMonetaryPerQuantity
}): number {
  const { marketPriceInMinorUnits, netAssetValuePerIssuedShare } = input

  if (
    !Number.isSafeInteger(marketPriceInMinorUnits) ||
    marketPriceInMinorUnits <= 0
  ) {
    throw new RangeError('Market price must be a positive safe integer')
  }
  if (
    !Number.isSafeInteger(
      netAssetValuePerIssuedShare.scaledAmountInMinorUnitsPerUnit
    ) ||
    netAssetValuePerIssuedShare.scaledAmountInMinorUnitsPerUnit <= 0
  ) {
    throw new RangeError(
      'Net asset value per issued share must be a positive safe integer'
    )
  }

  const price = BigInt(marketPriceInMinorUnits)
  const navScale = BigInt(netAssetValuePerIssuedShare.scale)
  const navScaledAmount = BigInt(
    netAssetValuePerIssuedShare.scaledAmountInMinorUnitsPerUnit
  )
  const ratioScale = BigInt(FUNDAMENTAL_RATIO_SCALE)

  // pvp = price / (navScaledAmount / navScale) = price * navScale / navScaledAmount
  const numerator = price * navScale * ratioScale
  const denominator = navScaledAmount
  const quotient = numerator / denominator
  const remainder = numerator % denominator
  const pvpScaled = remainder * 2n >= denominator ? quotient + 1n : quotient

  if (pvpScaled > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError('P/VP result exceeds the safe integer range')
  }

  return Number(pvpScaled)
}
