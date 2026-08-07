import { normalizeExactDecimalQuantity } from '../exactDecimalQuantity'
import type { ExactDecimalQuantity } from '../types'

export type ProventoDeclarationPointV1 = {
  protocol: string
  version: number
  grossValuePerShare: ExactDecimalQuantity
  paymentDate: string
}

const MS_PER_DAY = 24 * 60 * 60 * 1000
const TRAILING_WINDOW_DAYS = 365

/**
 * Soma o valor bruto por ação declarado nos últimos 12 meses até
 * `windowEndDate` (inclusive), para as linhas de um único ISIN
 * (`provento_declaration_values`, DEC-097). Dedup por "Protocolo
 * Provento": duas submissões ENET distintas podem compartilhar o mesmo
 * protocolo com Versão incrementada quando a empresa reenvia uma
 * correção da mesma declaração (DEC-101) - só a versão mais alta por
 * protocolo entra na soma, nunca as duas.
 *
 * Devolve `null` (não zero) quando nenhuma declaração cai na janela -
 * "não sei" e "zero distribuído" são coisas diferentes, mesma
 * disciplina do resto do motor de score.
 */
export function computeProventoTrailingTwelveMonthValueV1(input: {
  declarations: readonly ProventoDeclarationPointV1[]
  windowEndDate: string
}): ExactDecimalQuantity | null {
  const { declarations, windowEndDate } = input

  const latestByProtocol = new Map<string, ProventoDeclarationPointV1>()
  for (const declaration of declarations) {
    const existing = latestByProtocol.get(declaration.protocol)
    if (!existing || declaration.version > existing.version) {
      latestByProtocol.set(declaration.protocol, declaration)
    }
  }

  const windowEndMs = Date.parse(`${windowEndDate}T00:00:00.000Z`)
  const windowStartMs = windowEndMs - TRAILING_WINDOW_DAYS * MS_PER_DAY

  const inWindow = [...latestByProtocol.values()].filter((declaration) => {
    const paymentMs = Date.parse(`${declaration.paymentDate}T00:00:00.000Z`)
    return paymentMs > windowStartMs && paymentMs <= windowEndMs
  })

  if (inWindow.length === 0) {
    return null
  }

  const maxScale = Math.max(
    ...inWindow.map((declaration) => declaration.grossValuePerShare.scale)
  )
  const totalUnscaled = inWindow.reduce((sum, declaration) => {
    const scaleDiff = maxScale - declaration.grossValuePerShare.scale
    return (
      sum +
      BigInt(declaration.grossValuePerShare.unscaledValue) *
        10n ** BigInt(scaleDiff)
    )
  }, 0n)

  if (totalUnscaled > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError(
      'Provento trailing-12-month total exceeds the safe integer range'
    )
  }

  return normalizeExactDecimalQuantity(
    { unscaledValue: Number(totalUnscaled), scale: maxScale },
    'Provento trailing-12-month value'
  )
}
