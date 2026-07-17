import { zipSync } from 'fflate'
import { describe, expect, it, vi } from 'vitest'
import { OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION } from '../../../../../domain/context'
import {
  CVM_FUND_DELIVERY_FII_EVENTS_PARSER_V1_VERSION,
  CVM_FUND_DELIVERY_FII_EVENTS_PROVIDER_V1_VERSION,
} from './constants'
import {
  extractCvmFundDeliveryFiiEvents,
  fetchCvmFundDeliveryFiiEvents,
} from './provider'
import {
  createFourFundRows,
  createFundDeliveryFixtureCsv,
  createFundDeliveryFixtureRow,
  encodeWindows1252,
  type FundDeliveryFixtureRow,
} from './testFixtures'

const INGESTED_AT = '2026-07-17T12:00:00Z'
const UPDATED_AT = '2026-07-17T12:00:00Z'

function extract(rows: readonly FundDeliveryFixtureRow[]) {
  return extractCvmFundDeliveryFiiEvents({
    year: 2026,
    month: 7,
    archiveFileName: 'fi_entrega_documento_202607.zip',
    csvFileName: 'fi_entrega_documento_202607.csv',
    csvContent: createFundDeliveryFixtureCsv(rows),
    ingestedAt: INGESTED_AT,
    updatedAt: UPDATED_AT,
  })
}

describe('CVM Fund Delivery FII identity and taxonomy', () => {
  it('covers exactly the four approved FIIs by exact registry CNPJ', () => {
    const result = extract(createFourFundRows())
    expect(
      result.events.map(({ assetIdentity }) => assetIdentity.ticker)
    ).toEqual(['KNRI11', 'VISC11', 'XPLG11', 'HGRU11'])
    expect(
      result.events.map(({ associationEvidence }) => associationEvidence)
    ).toEqual(
      ['KNRI11', 'VISC11', 'XPLG11', 'HGRU11'].map((ticker, index) => [
        {
          reason: 'exact-ticker-provider-mapping',
          observedTicker: ticker,
          mappingVersion: OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION,
        },
        {
          reason: 'exact-cnpj',
          observedCnpj: createFourFundRows()[index].CNPJ_Fundo_Classe,
        },
      ])
    )
  })

  it.each(['INFORM MENSAL', 'INFO TRIM FII'])(
    'maps exact document type %s to periodic-report',
    (Tipo_Documento) => {
      expect(
        extract([createFundDeliveryFixtureRow({ Tipo_Documento })]).events[0]
          .eventType
      ).toBe('periodic-report')
    }
  )

  it.each(['REGUL FDO', 'SGF ANEXO', 'inform mensal', ' INFORM MENSAL '])(
    'rejects unsupported exact document type %j',
    (Tipo_Documento) => {
      const result = extract([createFundDeliveryFixtureRow({ Tipo_Documento })])
      expect(result.events).toEqual([])
      expect(result.rejectedRows[0].reason).toBe('unsupported-document-type')
    }
  )

  it('accepts canonical and officially punctuated CNPJ with canonical evidence', () => {
    const canonical = extract([createFundDeliveryFixtureRow()]).events[0]
    const punctuated = extract([
      createFundDeliveryFixtureRow({
        CNPJ_Fundo_Classe: '12.005.956/0001-65',
      }),
    ]).events[0]
    expect(canonical.associationEvidence[1]).toEqual({
      reason: 'exact-cnpj',
      observedCnpj: '12005956000165',
    })
    expect(punctuated.associationEvidence[1]).toEqual({
      reason: 'exact-cnpj',
      observedCnpj: '12005956000165',
    })
    expect(punctuated.provenance.rawFields.cnpjFundoClasseRaw).toBe(
      '12.005.956/0001-65'
    )
  })

  it('ignores malformed and non-registry CNPJs without creating rejections', () => {
    const result = extract([
      createFundDeliveryFixtureRow({ CNPJ_Fundo_Classe: '99999999999999' }),
      createFundDeliveryFixtureRow({ CNPJ_Fundo_Classe: '12.005.956/0001-6X' }),
      createFundDeliveryFixtureRow({ CNPJ_Fundo_Classe: '12.005956/0001-65' }),
      createFundDeliveryFixtureRow({ CNPJ_Fundo_Classe: '12005 956000165' }),
      createFundDeliveryFixtureRow({ CNPJ_Fundo_Classe: ' 12005956000165 ' }),
    ])
    expect(result).toMatchObject({
      totalRows: 5,
      ignoredNonUniverseRows: 5,
      targetRows: 0,
    })
    expect(result.rejectedRows).toEqual([])
  })
})

describe('CVM Fund Delivery FII event mapping', () => {
  it('maps identifiers, civil dates and immutable original status', () => {
    const event = extract([createFundDeliveryFixtureRow()]).events[0]
    expect(event).toMatchObject({
      source: 'cvm-fund-delivery',
      eventType: 'periodic-report',
      occurredAt: { precision: 'date', date: '2026-06-30' },
      publishedAt: { precision: 'date', date: '2026-07-14' },
      sourceDocumentId: 'cvm-fund-delivery:FNET:1247762',
      originalUrl: null,
      canonicalUrl: null,
      title: 'INFORM MENSAL — 2026-06-01 a 2026-06-30',
      summary: null,
      status: 'original',
      supersedesEventId: null,
      relatedDocuments: [],
    })
    expect(event.documentIdentifiers).toEqual({
      sourceDocumentId: 'cvm-fund-delivery:FNET:1247762',
      regulatoryDocumentId: '1247762',
      accessionNumber: null,
      protocolNumber: null,
      canonicalUrl: null,
      fingerprint: null,
    })
  })

  it('trims source system for identity and preserves its raw value', () => {
    const event = extract([
      createFundDeliveryFixtureRow({ Sistema_Origem: '  FNET  ' }),
    ]).events[0]
    expect(event.sourceDocumentId).toBe('cvm-fund-delivery:FNET:1247762')
    expect(event.provenance.rawFields.sistemaOrigemRaw).toBe('  FNET  ')
  })

  it('preserves internal source system spaces and encodes them safely', () => {
    const event = extract([
      createFundDeliveryFixtureRow({ Sistema_Origem: 'F NET' }),
    ]).events[0]
    expect(event.sourceDocumentId).toBe('cvm-fund-delivery:F%20NET:1247762')
    expect(event.provenance.rawFields.sistemaOrigemRaw).toBe('F NET')
  })

  it('canonicalizes document IDs without padding and preserves the raw ID', () => {
    const event = extract([
      createFundDeliveryFixtureRow({ ID_Documento: '000123' }),
    ]).events[0]
    expect(event.sourceDocumentId).toBe('cvm-fund-delivery:FNET:123')
    expect(event.documentIdentifiers.regulatoryDocumentId).toBe('123')
    expect(event.provenance.rawFields.idDocumentoRaw).toBe('000123')

    const rejected = extract([
      createFundDeliveryFixtureRow({
        ID_Documento: '000123',
        Tipo_Documento: 'REGUL FDO',
      }),
    ]).rejectedRows[0]
    expect(rejected.documentId).toBe('123')
  })

  it.each([
    ['2026-07-14 18:34:42.067', true],
    ['2026-07-14 18:34:42', false],
    ['2026-07-14T18:34:42.067', false],
    ['2026-07-14 24:00:00.000', false],
    ['2026-07-14 18:60:00.000', false],
    ['2026-07-14 18:34:60.000', false],
    ['2026-02-30 18:34:42.067', false],
  ] as const)('validates delivery datetime %s', (Data_Hora_Entrega, valid) => {
    const result = extract([
      createFundDeliveryFixtureRow({ Data_Hora_Entrega }),
    ])
    expect(result.events.length === 1).toBe(valid)
  })

  it('distinguishes missing and invalid delivery datetime', () => {
    expect(
      extract([createFundDeliveryFixtureRow({ Data_Hora_Entrega: '' })])
        .rejectedRows[0].reason
    ).toBe('missing-delivery-datetime')
    expect(
      extract([
        createFundDeliveryFixtureRow({
          Data_Hora_Entrega: '2026-07-14 18:34:42',
        }),
      ]).rejectedRows[0].reason
    ).toBe('invalid-delivery-datetime')
  })

  it.each([
    {
      Data_Inicio_Competencia: '2026-06-31',
      Data_Fim_Competencia: '2026-07-01',
    },
    {
      Data_Inicio_Competencia: '2026-07-01',
      Data_Fim_Competencia: '2026-06-30',
    },
  ])('rejects invalid competence period %#', (overrides) => {
    expect(
      extract([createFundDeliveryFixtureRow(overrides)]).rejectedRows[0].reason
    ).toBe('invalid-competence-period')
  })

  it.each([
    { Data_Inicio_Competencia: '', Data_Fim_Competencia: '2026-06-30' },
    { Data_Inicio_Competencia: '2026-06-01', Data_Fim_Competencia: '' },
  ])('reports missing competence period %#', (overrides) => {
    expect(
      extract([createFundDeliveryFixtureRow(overrides)]).rejectedRows[0].reason
    ).toBe('missing-competence-period')
  })

  it.each([
    { ID_Documento: '' },
    { ID_Documento: '0' },
    { ID_Documento: 'abc' },
    { ID_Documento: '12345678901' },
    { Sistema_Origem: '' },
    { Sistema_Origem: '   ' },
    { Sistema_Origem: '1234567' },
    { Sistema_Origem: 'FN\u0001ET' },
    { Sistema_Origem: 'FN\u0085ET' },
  ])('rejects invalid document identity %#', (overrides) => {
    expect(
      extract([createFundDeliveryFixtureRow(overrides)]).rejectedRows[0].reason
    ).toBe('invalid-document-identifiers')
  })

  it('preserves presentation and active indicator only as raw provenance', () => {
    const event = extract([
      createFundDeliveryFixtureRow({
        Tipo_Apresentacao: 'Reapresentação futura',
        Ativo: 'N',
      }),
    ]).events[0]
    expect(event.status).toBe('original')
    expect(event.provenance.rawFields).toMatchObject({
      tipoApresentacaoRaw: 'Reapresentação futura',
      ativoRaw: 'N',
    })
  })

  it('preserves all 11 raw fields and a deterministic payload hash', () => {
    const first = extract([createFundDeliveryFixtureRow()]).events[0]
    const second = extract([createFundDeliveryFixtureRow()]).events[0]
    expect(first.provenance).toMatchObject({
      sourceSystem: 'cvm-fund-delivery',
      rawDocumentType: 'INFORM MENSAL',
      rawDocumentCategory: null,
      parserVersion: CVM_FUND_DELIVERY_FII_EVENTS_PARSER_V1_VERSION,
      mappingVersion: OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION,
      rawFields: {
        tipoFundoClasseRaw: 'CLASSES - FII',
        cnpjFundoClasseRaw: '12005956000165',
        idSubclasseRaw: '',
        tipoDocumentoRaw: 'INFORM MENSAL',
        dataInicioCompetenciaRaw: '2026-06-01',
        dataFimCompetenciaRaw: '2026-06-30',
        idDocumentoRaw: '1247762',
        dataHoraEntregaRaw: '2026-07-14 18:34:42.067',
        tipoApresentacaoRaw: 'Apresentação',
        ativoRaw: 'S',
        sistemaOrigemRaw: 'FNET',
      },
    })
    expect(Object.keys(first.provenance.rawFields).sort()).toEqual(
      [
        'ativoRaw',
        'cnpjFundoClasseRaw',
        'dataFimCompetenciaRaw',
        'dataHoraEntregaRaw',
        'dataInicioCompetenciaRaw',
        'idDocumentoRaw',
        'idSubclasseRaw',
        'sistemaOrigemRaw',
        'tipoApresentacaoRaw',
        'tipoDocumentoRaw',
        'tipoFundoClasseRaw',
      ].sort()
    )
    expect(first.provenance.sourcePayloadHash).toBe(
      second.provenance.sourcePayloadHash
    )
    expect(first.provenance.sourcePayloadHash).toMatch(/^fnv1a64:[0-9a-f]{16}$/)
  })
})

describe('CVM Fund Delivery extraction and composition', () => {
  it('is deterministic, preserves input and returns the complete result', () => {
    const rows = createFourFundRows()
    const snapshot = structuredClone(rows)
    const first = extract(rows)
    expect(first).toEqual(extract(rows))
    expect(rows).toEqual(snapshot)
    expect(first).toMatchObject({
      providerVersion: CVM_FUND_DELIVERY_FII_EVENTS_PROVIDER_V1_VERSION,
      source: 'cvm-fund-delivery',
      year: 2026,
      month: 7,
      referenceMonth: '202607',
      totalRows: 4,
      targetRows: 4,
      acceptedRows: 4,
      exactDuplicateRows: 0,
      conflictingPayloadRows: 0,
    })
  })

  it('reports exact duplicates and payload conflicts without overwriting', () => {
    const row = createFundDeliveryFixtureRow()
    const duplicate = extract([row, structuredClone(row)])
    expect(duplicate.events).toHaveLength(1)
    expect(duplicate.duplicates[0]).toMatchObject({
      keptInputIndex: 0,
      duplicateInputIndex: 1,
    })
    const conflict = extract([
      row,
      { ...row, Tipo_Apresentacao: 'Outro payload' },
    ])
    expect(conflict.events).toHaveLength(1)
    expect(conflict.conflicts[0].inputIndexes).toEqual([0, 1])
    expect(conflict.conflicts[0].sourcePayloadHashes).toHaveLength(2)
    expect(conflict.conflictingPayloadRows).toBe(1)
  })

  it('counts three conflicting payload rows and preserves every index and hash', () => {
    const rows = ['A', 'B', 'C', 'D'].map((Tipo_Apresentacao) =>
      createFundDeliveryFixtureRow({ Tipo_Apresentacao })
    )
    const result = extract(rows)
    expect(result).toMatchObject({
      totalRows: 4,
      targetRows: 4,
      acceptedRows: 4,
      exactDuplicateRows: 0,
      conflictingPayloadRows: 3,
    })
    expect(result.events).toHaveLength(1)
    expect(result.conflicts).toHaveLength(1)
    expect(result.conflicts[0].inputIndexes).toEqual([0, 1, 2, 3])
    expect(result.conflicts[0].sourcePayloadHashes).toHaveLength(4)
    expect(new Set(result.conflicts[0].sourcePayloadHashes).size).toBe(4)
  })

  it('returns defensive event, rejection, duplicate and conflict metadata', () => {
    const accepted = createFundDeliveryFixtureRow()
    const rows = [
      accepted,
      structuredClone(accepted),
      { ...accepted, Tipo_Apresentacao: 'payload conflitante' },
      createFundDeliveryFixtureRow({
        ID_Documento: '1247763',
        Tipo_Documento: 'REGUL FDO',
      }),
    ]
    const snapshot = structuredClone(rows)
    const result = extract(rows)
    result.events[0].assetIdentity.officialName = 'alterado'
    result.rejectedRows[0].message = 'alterado'
    result.duplicates[0].duplicateInputIndex = 99
    result.conflicts[0].inputIndexes.push(99)

    const repeated = extract(rows)
    expect(rows).toEqual(snapshot)
    expect(repeated.events[0].assetIdentity.officialName).not.toBe('alterado')
    expect(repeated.rejectedRows[0].message).not.toBe('alterado')
    expect(repeated.duplicates[0].duplicateInputIndex).toBe(1)
    expect(repeated.conflicts[0].inputIndexes).toEqual([0, 2])
  })

  it('composes one archive fetch and ignores the daily CSV', async () => {
    const archive = zipSync({
      'fi_entrega_documento_202607.csv': encodeWindows1252(
        createFundDeliveryFixtureCsv([createFundDeliveryFixtureRow()])
      ),
      'fi_entrega_documento_diario_202607.csv': Uint8Array.of(0xff),
    })
    const fetcher = vi.fn(async () => {
      const copy = archive.slice()
      return {
        ok: true,
        status: 200,
        headers: { get: () => null },
        arrayBuffer: async () => copy.buffer,
      }
    })
    const result = await fetchCvmFundDeliveryFiiEvents({
      year: 2026,
      month: 7,
      fetcher,
      ingestedAt: INGESTED_AT,
      updatedAt: UPDATED_AT,
    })
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(result.events).toHaveLength(1)
  })

  it('validates parameters before invoking the fetcher', async () => {
    const fetcher = vi.fn(async () => {
      throw new Error('must not run')
    })
    await expect(
      fetchCvmFundDeliveryFiiEvents({
        year: 2020,
        month: 7,
        fetcher,
        ingestedAt: INGESTED_AT,
        updatedAt: UPDATED_AT,
      })
    ).rejects.toThrow(/year/)
    await expect(
      fetchCvmFundDeliveryFiiEvents({
        year: 2026,
        month: 13,
        fetcher,
        ingestedAt: INGESTED_AT,
        updatedAt: UPDATED_AT,
      })
    ).rejects.toThrow(/month/)
    await expect(
      fetchCvmFundDeliveryFiiEvents({
        year: 2026,
        month: 7,
        fetcher,
        ingestedAt: 'invalid',
        updatedAt: UPDATED_AT,
      })
    ).rejects.toThrow(/ingestedAt/)
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('rejects reverse execution timestamps and incoherent filenames', () => {
    expect(() =>
      extractCvmFundDeliveryFiiEvents({
        year: 2026,
        month: 7,
        archiveFileName: 'wrong.zip',
        csvFileName: 'fi_entrega_documento_202607.csv',
        csvContent: createFundDeliveryFixtureCsv([]),
        ingestedAt: INGESTED_AT,
        updatedAt: UPDATED_AT,
      })
    ).toThrow(/filename/)
    expect(() =>
      extractCvmFundDeliveryFiiEvents({
        year: 2026,
        month: 7,
        archiveFileName: 'fi_entrega_documento_202607.zip',
        csvFileName: 'fi_entrega_documento_202607.csv',
        csvContent: createFundDeliveryFixtureCsv([]),
        ingestedAt: '2026-07-17T12:00:00.1Z',
        updatedAt: '2026-07-17T12:00:00.01Z',
      })
    ).toThrow(/earlier/)
  })
})
