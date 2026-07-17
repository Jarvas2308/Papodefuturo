import { buildOfficialAssetEventV1 } from './buildOfficialAssetEventV1'
import type {
  BuildOfficialAssetEventV1Input,
  OfficialAssetEventV1,
  OfficialEventDocumentIdentifiersV1,
} from './types'
import { OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION } from './types'

export function createDocumentIdentifiers(
  overrides: Partial<OfficialEventDocumentIdentifiersV1> = {}
): OfficialEventDocumentIdentifiersV1 {
  return {
    sourceDocumentId: 'cvm:ipe:document-1',
    regulatoryDocumentId: null,
    accessionNumber: null,
    protocolNumber: null,
    canonicalUrl:
      'https://www.gov.br/cvm/documento?id=1&utm_source=test#section',
    fingerprint: null,
    ...overrides,
  }
}

export function createOfficialEventInput(
  overrides: Partial<BuildOfficialAssetEventV1Input> = {}
): BuildOfficialAssetEventV1Input {
  return {
    ticker: 'BBAS3',
    eventType: 'material-fact',
    classificationJustification: null,
    associationEvidence: [
      { reason: 'exact-cnpj', observedCnpj: '00000000000191' },
    ],
    occurredAt: { precision: 'date', value: '2026-07-15' },
    publishedAt: { precision: 'minute', value: '2026-07-15T14:30-03:00' },
    source: 'cvm-ipe',
    documentIdentifiers: createDocumentIdentifiers(),
    originalUrl: 'https://www.gov.br/cvm/documento?id=1&utm_medium=email#top',
    title: '  Fato   relevante   oficial  ',
    summary: '  Resumo   factual. ',
    status: 'original',
    supersedesEventId: null,
    relatedDocuments: [],
    ingestedAt: '2026-07-15T18:00:00Z',
    updatedAt: '2026-07-15T18:00:00.123456789Z',
    provenance: {
      sourceSystem: 'cvm-ipe',
      sourceType: 'regulator',
      rawDocumentType: '  Fato   Relevante ',
      rawDocumentCategory: '  Categoria   CVM ',
      parserVersion: ' parser.v1 ',
      mappingVersion: OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION,
      termsAuditedAt: '2026-07-14',
      attribution: '  Comissão   de Valores Mobiliários ',
      sourcePayloadHash: 'sha256:payload-1',
      rawFields: {
        protocol: '123',
        pages: 2,
        complete: true,
        optional: null,
      },
    },
    ...overrides,
  }
}

export function createOfficialEvent(
  overrides: Partial<BuildOfficialAssetEventV1Input> = {}
): OfficialAssetEventV1 {
  return buildOfficialAssetEventV1(createOfficialEventInput(overrides))
}
