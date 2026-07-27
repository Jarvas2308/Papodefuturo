import { describe, expect, it } from 'vitest'
import {
  OFFICIAL_ASSET_EVENT_STORAGE_RECORD_V1_SCHEMA_VERSION,
  assertOfficialAssetEventStorageRecordV1,
  fromOfficialAssetEventStorageRecordV1,
  toOfficialAssetEventStorageRecordV1,
} from './index'
import { createStorageTestEvent } from './testFixtures'

describe('OfficialAssetEventStorageRecordV1', () => {
  it.each([
    ['ação CVM IPE', createStorageTestEvent()],
    [
      'FII CVM Fund Delivery',
      createStorageTestEvent({ ticker: 'KNRI11', source: 'cvm-fund-delivery' }),
    ],
    [
      'ETF SEC EDGAR',
      createStorageTestEvent({
        ticker: 'VOO',
        source: 'sec-edgar',
        documentId: '0000036405-26-000001',
      }),
    ],
  ])('faz round-trip lossless de %s', (_, event) => {
    const record = toOfficialAssetEventStorageRecordV1(event)
    expect(record.storageSchemaVersion).toBe(
      OFFICIAL_ASSET_EVENT_STORAGE_RECORD_V1_SCHEMA_VERSION
    )
    expect(fromOfficialAssetEventStorageRecordV1(record)).toEqual(event)
    expect(
      toOfficialAssetEventStorageRecordV1(
        fromOfficialAssetEventStorageRecordV1(record)
      )
    ).toEqual(record)
  })

  it.each([
    [{ precision: 'date', value: '2026-07-17' } as const],
    [{ precision: 'minute', value: '2026-07-17T10:08-03:00' } as const],
    [{ precision: 'second', value: '2026-07-17T13:08:55.123456789Z' } as const],
    [{ precision: 'unknown', raw: 'sem data oficial' } as const],
  ])('preserva occurredAt com precisão explícita', (occurredAt) => {
    const event = createStorageTestEvent({ occurredAt })
    expect(
      fromOfficialAssetEventStorageRecordV1(
        toOfficialAssetEventStorageRecordV1(event)
      ).occurredAt
    ).toEqual(event.occurredAt)
  })

  it('preserva nulls e toda a proveniência', () => {
    const event = createStorageTestEvent({
      ticker: 'VOO',
      source: 'sec-edgar',
      occurredAt: null,
    })
    const restored = fromOfficialAssetEventStorageRecordV1(
      toOfficialAssetEventStorageRecordV1(event)
    )
    expect(restored.occurredAt).toBeNull()
    expect(restored.summary).toBeNull()
    expect(restored.provenance).toEqual(event.provenance)
  })

  it('produz cópias defensivas em ambas as direções', () => {
    const event = createStorageTestEvent()
    const record = toOfficialAssetEventStorageRecordV1(event)
    record.provenanceRawFields.row = 99
    record.associationEvidence[0] = { ...record.associationEvidence[0] }
    expect(event.provenance.rawFields.row).toBe(7)

    const cleanRecord = toOfficialAssetEventStorageRecordV1(event)
    const restored = fromOfficialAssetEventStorageRecordV1(cleanRecord)
    restored.provenance.rawFields.row = 100
    expect(cleanRecord.provenanceRawFields.row).toBe(7)
  })

  it.each([
    [
      'schema',
      (record: ReturnType<typeof toOfficialAssetEventStorageRecordV1>) => {
        record.storageSchemaVersion =
          'invalid' as typeof record.storageSchemaVersion
      },
    ],
    [
      'eventId',
      (record: ReturnType<typeof toOfficialAssetEventStorageRecordV1>) => {
        record.eventId = 'adulterado'
      },
    ],
    [
      'deduplicationKey',
      (record: ReturnType<typeof toOfficialAssetEventStorageRecordV1>) => {
        record.deduplicationKey = 'adulterada'
      },
    ],
    [
      'source/provenance',
      (record: ReturnType<typeof toOfficialAssetEventStorageRecordV1>) => {
        record.provenanceSourceSystem = 'sec-edgar'
      },
    ],
    [
      'hash vazio',
      (record: ReturnType<typeof toOfficialAssetEventStorageRecordV1>) => {
        record.sourcePayloadHash = ''
      },
    ],
    [
      'timestamp inválido',
      (record: ReturnType<typeof toOfficialAssetEventStorageRecordV1>) => {
        record.updatedAt = '2026-02-30T10:00:00Z'
      },
    ],
    [
      'publishedAt unknown',
      (record: ReturnType<typeof toOfficialAssetEventStorageRecordV1>) => {
        record.publishedAtPrecision =
          'unknown' as typeof record.publishedAtPrecision
      },
    ],
    [
      'identidade misturada',
      (record: ReturnType<typeof toOfficialAssetEventStorageRecordV1>) => {
        record.registrantCik = '0000036405'
      },
    ],
  ])('rejeita %s adulterado', (_, mutate) => {
    const record = toOfficialAssetEventStorageRecordV1(createStorageTestEvent())
    mutate(record)
    expect(() => assertOfficialAssetEventStorageRecordV1(record)).toThrow()
  })

  it('rejeita -0, NaN, Infinity, rawFields aninhado, array esparso e prototype perigoso', () => {
    for (const badValue of [
      -0,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      { nested: true },
    ]) {
      const record = toOfficialAssetEventStorageRecordV1(
        createStorageTestEvent()
      )
      record.provenanceRawFields.row = badValue as never
      expect(() => assertOfficialAssetEventStorageRecordV1(record)).toThrow()
    }
    const sparse = toOfficialAssetEventStorageRecordV1(createStorageTestEvent())
    delete sparse.associationEvidence[0]
    expect(() => assertOfficialAssetEventStorageRecordV1(sparse)).toThrow()
    const polluted = toOfficialAssetEventStorageRecordV1(
      createStorageTestEvent()
    )
    Object.setPrototypeOf(polluted, { dangerous: true })
    expect(() => assertOfficialAssetEventStorageRecordV1(polluted)).toThrow()
  })

  it('rejeita campos temporais incompatíveis, self-supersedes e relatedDocuments inválidos', () => {
    const temporal = toOfficialAssetEventStorageRecordV1(
      createStorageTestEvent()
    )
    temporal.occurredAtInstantUtc = '2026-07-17T00:00:00Z'
    expect(() => assertOfficialAssetEventStorageRecordV1(temporal)).toThrow()

    const self = toOfficialAssetEventStorageRecordV1(createStorageTestEvent())
    self.status = 'amendment'
    self.supersedesEventId = self.eventId
    expect(() => assertOfficialAssetEventStorageRecordV1(self)).toThrow()

    const related = toOfficialAssetEventStorageRecordV1(
      createStorageTestEvent()
    )
    related.relatedDocuments = [
      { relation: 'references', eventId: related.eventId },
      { relation: 'references', eventId: related.eventId },
    ]
    expect(() => assertOfficialAssetEventStorageRecordV1(related)).toThrow()
  })
})
