import { normalizeCvmDescription } from '../normalizeDescription'
import type { CvmRealEstateFundTicker } from './types'

export const CVM_FII_OFFICIAL_NAME_ALIASES_V1_VERSION =
  'cvm-fii-official-name-aliases.v1' as const

const OFFICIAL_NAME_ALIASES = Object.freeze({
  KNRI11: Object.freeze([
    'KINEA RENDA IMOBILIARIA FII RESPONSABILIDADE LIMITADA',
  ]),
  VISC11: Object.freeze([
    'VINCI SHOPPING CENTERS FUNDO DE INVESTIMENTO IMOBILIÁRIO-FII',
  ]),
  XPLG11: Object.freeze(['XP LOG FII RL', 'FII XP LOG']),
  HGRU11: Object.freeze([
    'PÁTRIA RENDA URBANA - FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  ]),
} as const satisfies Readonly<
  Record<CvmRealEstateFundTicker, readonly string[]>
>)

export function matchCvmFiiOfficialNameAlias(
  ticker: CvmRealEstateFundTicker,
  observedName: string,
  canonicalName: string
): string | null {
  const aliases = OFFICIAL_NAME_ALIASES[ticker]
  if (
    normalizeCvmDescription(aliases[0]) !==
    normalizeCvmDescription(canonicalName)
  ) {
    throw new Error(`Invalid canonical alias configuration for ${ticker}`)
  }
  const normalizedObservedName = normalizeCvmDescription(observedName)
  return aliases.some(
    (alias) => normalizeCvmDescription(alias) === normalizedObservedName
  )
    ? normalizedObservedName
    : null
}
