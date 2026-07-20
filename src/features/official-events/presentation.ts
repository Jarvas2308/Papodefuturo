import type {
  OfficialAssetEventV1,
  OfficialEventAssetTickerV1,
  OfficialEventSourceV1,
  OfficialEventStatusV1,
  OfficialEventTemporalValueV1,
  OfficialEventTypeV1,
} from '../../domain/context/official-events'
import type { OfficialEventsFiltersV1 } from './types'

export const OFFICIAL_EVENT_TICKER_COVERAGE = {
  BBAS3: true,
  ITSA4: true,
  TAEE11: true,
  WEGE3: true,
  PSSA3: true,
  KNRI11: true,
  VISC11: true,
  XPLG11: true,
  HGRU11: true,
  VOO: true,
  VNQ: true,
  VEA: true,
} as const satisfies Record<OfficialEventAssetTickerV1, true>

export const OFFICIAL_EVENT_SOURCE_COVERAGE = {
  'cvm-ipe': true,
  'cvm-fund-delivery': true,
  'sec-edgar': true,
} as const satisfies Record<OfficialEventSourceV1, true>

export const OFFICIAL_EVENT_STATUS_COVERAGE = {
  original: true,
  amendment: true,
  correction: true,
  replacement: true,
  cancellation: true,
} as const satisfies Record<OfficialEventStatusV1, true>

export const OFFICIAL_EVENT_TYPE_COVERAGE = {
  'regulatory-filing': true,
  'earnings-release': true,
  'periodic-report': true,
  'material-fact': true,
  'market-communication': true,
  'dividend-or-distribution': true,
  'capital-structure-change': true,
  'offering-or-issuance': true,
  'shareholder-meeting': true,
  'management-change': true,
  'merger-acquisition-or-reorganization': true,
  'legal-or-regulatory-action': true,
  'fund-policy-change': true,
  'fund-manager-or-administrator-change': true,
  'other-official-event': true,
} as const satisfies Record<OfficialEventTypeV1, true>

export const OFFICIAL_EVENT_TICKER_GROUPS = [
  {
    label: 'Ações',
    tickers: ['BBAS3', 'ITSA4', 'TAEE11', 'WEGE3', 'PSSA3'],
  },
  { label: 'FIIs', tickers: ['KNRI11', 'VISC11', 'XPLG11', 'HGRU11'] },
  { label: 'ETFs', tickers: ['VOO', 'VNQ', 'VEA'] },
] as const satisfies readonly {
  label: string
  tickers: readonly OfficialEventAssetTickerV1[]
}[]

export const OFFICIAL_EVENT_SOURCES = [
  { value: 'cvm-ipe', label: 'CVM — Empresas' },
  { value: 'cvm-fund-delivery', label: 'CVM — Fundos' },
  { value: 'sec-edgar', label: 'SEC EDGAR' },
] as const satisfies readonly { value: OfficialEventSourceV1; label: string }[]

export const OFFICIAL_EVENT_STATUSES = [
  { value: 'original', label: 'Original' },
  { value: 'amendment', label: 'Retificação' },
  { value: 'correction', label: 'Correção' },
  { value: 'replacement', label: 'Substituição' },
  { value: 'cancellation', label: 'Cancelamento' },
] as const satisfies readonly { value: OfficialEventStatusV1; label: string }[]

export const OFFICIAL_EVENT_TYPES = [
  { value: 'regulatory-filing', label: 'Documento regulatório' },
  { value: 'earnings-release', label: 'Divulgação de resultado' },
  { value: 'periodic-report', label: 'Relatório periódico' },
  { value: 'material-fact', label: 'Fato relevante' },
  { value: 'market-communication', label: 'Comunicado ao mercado' },
  { value: 'dividend-or-distribution', label: 'Provento ou distribuição' },
  { value: 'capital-structure-change', label: 'Mudança de capital' },
  { value: 'offering-or-issuance', label: 'Oferta ou emissão' },
  { value: 'shareholder-meeting', label: 'Assembleia' },
  { value: 'management-change', label: 'Mudança de administração' },
  {
    value: 'merger-acquisition-or-reorganization',
    label: 'Operação societária',
  },
  { value: 'legal-or-regulatory-action', label: 'Ação regulatória' },
  { value: 'fund-policy-change', label: 'Mudança de política do fundo' },
  {
    value: 'fund-manager-or-administrator-change',
    label: 'Mudança de gestor ou administrador',
  },
  { value: 'other-official-event', label: 'Outro evento oficial' },
] as const satisfies readonly { value: OfficialEventTypeV1; label: string }[]

export const EMPTY_OFFICIAL_EVENTS_FILTERS: OfficialEventsFiltersV1 = {
  tickers: [],
  sources: [],
  eventTypes: [],
  statuses: [],
  publishedFrom: '',
  publishedTo: '',
}

function labelFrom<Value extends string>(
  options: readonly { value: Value; label: string }[],
  value: Value
): string {
  const option = options.find((candidate) => candidate.value === value)
  if (!option) throw new Error(`Rótulo de evento oficial ausente: ${value}`)
  return option.label
}

export function getOfficialEventSourceLabel(value: OfficialEventSourceV1) {
  return labelFrom(OFFICIAL_EVENT_SOURCES, value)
}

export function getOfficialEventStatusLabel(value: OfficialEventStatusV1) {
  return labelFrom(OFFICIAL_EVENT_STATUSES, value)
}

export function getOfficialEventTypeLabel(value: OfficialEventTypeV1) {
  return labelFrom(OFFICIAL_EVENT_TYPES, value)
}

export function getOfficialEventCategoryLabel(
  value: OfficialAssetEventV1['assetIdentity']['category']
) {
  if (value === 'brazilian-stock') return 'Ação brasileira'
  if (value === 'real-estate-fund') return 'Fundo imobiliário'
  return 'ETF internacional'
}

export function cloneOfficialEventsFilters(
  filters: OfficialEventsFiltersV1
): OfficialEventsFiltersV1 {
  return {
    tickers: [...filters.tickers],
    sources: [...filters.sources],
    eventTypes: [...filters.eventTypes],
    statuses: [...filters.statuses],
    publishedFrom: filters.publishedFrom,
    publishedTo: filters.publishedTo,
  }
}

export function hasOfficialEventsFilters(
  filters: OfficialEventsFiltersV1
): boolean {
  return (
    filters.tickers.length > 0 ||
    filters.sources.length > 0 ||
    filters.eventTypes.length > 0 ||
    filters.statuses.length > 0 ||
    filters.publishedFrom !== '' ||
    filters.publishedTo !== ''
  )
}

export function isOfficialEventsDateRangeValid(
  filters: OfficialEventsFiltersV1
): boolean {
  return (
    filters.publishedFrom === '' ||
    filters.publishedTo === '' ||
    filters.publishedFrom <= filters.publishedTo
  )
}

function formatCivilDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return 'Data não informada'
  return `${match[3]}/${match[2]}/${match[1]}`
}

function formatUtcInstant(value: string, includeSeconds: boolean): string {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d{1,9})?Z$/.exec(
      value
    )
  if (!match) return 'Data não informada'
  const time = includeSeconds
    ? `${match[4]}:${match[5]}:${match[6] ?? '00'}`
    : `${match[4]}:${match[5]}`
  return `${match[3]}/${match[2]}/${match[1]} ${time} UTC`
}

export function formatOfficialEventTemporal(
  temporal: OfficialEventTemporalValueV1 | null
): string {
  if (temporal === null || temporal.precision === 'unknown') {
    return 'Data não informada'
  }
  if (temporal.precision === 'date') return formatCivilDate(temporal.date)
  return formatUtcInstant(temporal.instantUtc, temporal.precision === 'second')
}

const OFFICIAL_DOCUMENT_HOSTS = new Set(['www.rad.cvm.gov.br', 'www.sec.gov'])

export function getSafeOfficialDocumentUrl(
  event: Pick<OfficialAssetEventV1, 'canonicalUrl' | 'originalUrl'>
): string | null {
  const value = event.canonicalUrl ?? event.originalUrl
  if (value === null) return null
  try {
    const url = new URL(value)
    if (
      url.protocol !== 'https:' ||
      url.username !== '' ||
      url.password !== '' ||
      url.port !== '' ||
      !OFFICIAL_DOCUMENT_HOSTS.has(url.hostname)
    ) {
      return null
    }
    return value
  } catch {
    return null
  }
}

export function getDocumentIdentityLabel(
  kind: OfficialAssetEventV1['documentIdentity']['kind']
): string {
  if (kind === 'source-document-id') return 'Identificador da fonte'
  if (kind === 'regulatory-document-id') return 'Identificador regulatório'
  if (kind === 'accession-number') return 'Número de acesso SEC'
  if (kind === 'protocol-number') return 'Protocolo'
  if (kind === 'canonical-url') return 'Endereço oficial'
  return 'Identificação documental'
}
