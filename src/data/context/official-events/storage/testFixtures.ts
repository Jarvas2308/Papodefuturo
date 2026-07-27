import {
  OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION,
  buildOfficialAssetEventV1,
  getOfficialEventAssetIdentityByTicker,
  type BuildOfficialAssetEventV1Input,
  type OfficialAssetEventV1,
  type OfficialEventSourceV1,
} from '../../../../domain/context/official-events'

type TestEventOptions = {
  ticker?: 'BBAS3' | 'KNRI11' | 'VOO'
  source?: OfficialEventSourceV1
  documentId?: string
  title?: string
  sourcePayloadHash?: string
  ingestedAt?: string
  updatedAt?: string
  occurredAt?: BuildOfficialAssetEventV1Input['occurredAt']
  publishedAt?: BuildOfficialAssetEventV1Input['publishedAt']
  status?: BuildOfficialAssetEventV1Input['status']
  supersedesEventId?: string | null
}

export function createStorageTestEvent(
  options: TestEventOptions = {}
): OfficialAssetEventV1 {
  const ticker = options.ticker ?? 'BBAS3'
  const source = options.source ?? 'cvm-ipe'
  const identity = getOfficialEventAssetIdentityByTicker(ticker)
  const documentId = options.documentId ?? `${source}:document-1`
  const isSec = source === 'sec-edgar'
  return buildOfficialAssetEventV1({
    ticker,
    eventType: ticker === 'BBAS3' ? 'material-fact' : 'periodic-report',
    associationEvidence: [
      {
        reason: 'exact-regulatory-identity',
        observedRegulatoryIdentityKey: identity.regulatoryIdentityKey,
      },
    ],
    occurredAt: Object.hasOwn(options, 'occurredAt')
      ? (options.occurredAt ?? null)
      : { precision: 'date', value: '2026-07-17' },
    publishedAt:
      options.publishedAt ??
      (isSec
        ? { precision: 'second', value: '2026-07-18T13:08:55.123456789Z' }
        : { precision: 'minute', value: '2026-07-18T10:08-03:00' }),
    source,
    documentIdentifiers: {
      sourceDocumentId: isSec ? null : documentId,
      regulatoryDocumentId: source === 'cvm-fund-delivery' ? documentId : null,
      accessionNumber: isSec ? documentId : null,
      protocolNumber: null,
      canonicalUrl: isSec ? `https://www.sec.gov/Archives/${documentId}` : null,
      fingerprint: null,
    },
    originalUrl: isSec ? `https://www.sec.gov/Archives/${documentId}` : null,
    title: options.title ?? `Evento oficial ${ticker}`,
    summary: ticker === 'VOO' ? null : 'Resumo factual permitido.',
    status: options.status ?? 'original',
    supersedesEventId: options.supersedesEventId ?? null,
    relatedDocuments: [],
    ingestedAt: options.ingestedAt ?? '2026-07-18T14:00:00Z',
    updatedAt: options.updatedAt ?? '2026-07-18T14:00:00.123456789Z',
    provenance: {
      sourceSystem: source,
      sourceType: 'regulator',
      rawDocumentType: ticker === 'BBAS3' ? 'Fato Relevante' : 'Relatório',
      rawDocumentCategory: ticker === 'VOO' ? null : 'Documento periódico',
      parserVersion: `${source}-parser.v1`,
      mappingVersion: OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION,
      termsAuditedAt: '2026-07-18',
      attribution: isSec ? 'U.S. Securities and Exchange Commission' : 'CVM',
      sourcePayloadHash: options.sourcePayloadHash ?? 'sha256:payload-1',
      rawFields: {
        documentId,
        row: 7,
        accepted: true,
        optional: null,
      },
    },
  })
}
