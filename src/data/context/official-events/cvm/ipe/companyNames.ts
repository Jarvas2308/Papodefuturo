import type { BrazilianStockOfficialEventTickerV1 } from '../../../../../domain/context/official-events/types'

export const CVM_IPE_STOCK_COMPANY_NAME_ALIASES_V1_VERSION =
  'cvm-ipe-stock-company-name-aliases.v1' as const

const COMPANY_NAME_ALIASES = Object.freeze({
  BBAS3: Object.freeze(['BCO BRASIL S.A.', 'BANCO DO BRASIL S.A.']),
  ITSA4: Object.freeze(['ITAÚSA S.A.', 'ITAUSA S.A.']),
  TAEE11: Object.freeze(['TRANSMISSORA ALIANÇA DE ENERGIA ELÉTRICA S.A.']),
  WEGE3: Object.freeze(['WEG S.A.', 'WEG SA']),
  PSSA3: Object.freeze(['PORTO SEGURO S.A.', 'PORTO SEGURO SA']),
} as const satisfies Readonly<
  Record<BrazilianStockOfficialEventTickerV1, readonly string[]>
>)

function normalizeCompanyName(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toUpperCase()
}

export function matchCvmIpeCompanyNameAlias(
  ticker: BrazilianStockOfficialEventTickerV1,
  observedName: string,
  canonicalName: string
): string | null {
  const aliases = COMPANY_NAME_ALIASES[ticker]
  if (
    normalizeCompanyName(aliases[0]) !== normalizeCompanyName(canonicalName)
  ) {
    throw new Error(`Invalid canonical alias configuration for ${ticker}`)
  }
  const normalizedObservedName = normalizeCompanyName(observedName)
  return aliases.some(
    (alias) => normalizeCompanyName(alias) === normalizedObservedName
  )
    ? normalizedObservedName
    : null
}
