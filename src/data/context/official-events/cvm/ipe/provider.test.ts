import { zipSync } from 'fflate'
import { describe, expect, it, vi } from 'vitest'
import {
  OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION,
  getOfficialEventAssetIdentitiesV1,
} from '../../../../../domain/context/official-events'
import {
  CVM_IPE_STOCK_COMPANY_NAME_ALIASES_V1_VERSION,
  matchCvmIpeCompanyNameAlias,
} from './companyNames'
import {
  CVM_IPE_STOCK_EVENTS_PARSER_V1_VERSION,
  CVM_IPE_STOCK_EVENTS_PROVIDER_V1_VERSION,
} from './constants'
import { extractCvmIpeStockEvents, fetchCvmIpeStockEvents } from './provider'
import {
  createFixtureCsv,
  createFixtureRow,
  createFiveCompanyRows,
  encodeWindows1252,
  type FixtureRow,
} from './testFixtures'

const INGESTED_AT = '2026-07-16T18:00:00Z'
const UPDATED_AT = '2026-07-16T18:00:00Z'

function extract(rows: readonly FixtureRow[]) {
  return extractCvmIpeStockEvents({
    year: 2026,
    archiveFileName: 'ipe_cia_aberta_2026.zip',
    csvFileName: 'ipe_cia_aberta_2026.csv',
    csvContent: createFixtureCsv(rows),
    ingestedAt: INGESTED_AT,
    updatedAt: UPDATED_AT,
  })
}

const CATEGORY_CASES = [
  ['Acordo de Acionistas', 'regulatory-filing'],
  ['Assembleia', 'shareholder-meeting'],
  ['Aviso aos Acionistas', 'market-communication'],
  [
    'Comunicação sobre Transação entre Partes Relacionadas',
    'market-communication',
  ],
  ['Comunicado ao Mercado', 'market-communication'],
  ['Dados Econômico-Financeiros', 'regulatory-filing'],
  ['Documentos de Oferta de Distribuição Pública', 'offering-or-issuance'],
  ['Estatuto Social', 'regulatory-filing'],
  ['Fato Relevante', 'material-fact'],
  ['Informação Prestada às Bolsas Estrangeiras', 'market-communication'],
  ['Informações Companhias em Falência', 'legal-or-regulatory-action'],
  ['Informações Companhias em Liquidação', 'legal-or-regulatory-action'],
  [
    'Informações de Companhias em Recuperação Judicial ou Extrajudicial',
    'legal-or-regulatory-action',
  ],
  ['OPA - Edital de Oferta Pública de Ações', 'offering-or-issuance'],
  ['Reunião da Administração', 'regulatory-filing'],
] as const

describe('CVM IPE stock event identity', () => {
  it('accepts the five audited IPE names and preserves canonical identities', () => {
    const result = extract(createFiveCompanyRows())
    expect(
      result.events.map(({ assetIdentity }) => assetIdentity.ticker)
    ).toEqual(['BBAS3', 'ITSA4', 'TAEE11', 'WEGE3', 'PSSA3'])
    expect(
      result.events.map(({ assetIdentity }) => assetIdentity.officialName)
    ).toEqual([
      'BCO BRASIL S.A.',
      'ITAÚSA S.A.',
      'TRANSMISSORA ALIANÇA DE ENERGIA ELÉTRICA S.A.',
      'WEG S.A.',
      'PORTO SEGURO S.A.',
    ])
  })

  it.each([
    ['BBAS3', 'BCO BRASIL S.A.', 'BCO BRASIL S.A.'],
    ['BBAS3', '  banco   do brasil s.a. ', 'BANCO DO BRASIL S.A.'],
    ['ITSA4', 'ITAÚSA S.A.', 'ITAÚSA S.A.'],
    ['ITSA4', 'ITAUSA S.A.', 'ITAUSA S.A.'],
    [
      'TAEE11',
      'TRANSMISSORA ALIANÇA DE ENERGIA ELÉTRICA S.A.',
      'TRANSMISSORA ALIANÇA DE ENERGIA ELÉTRICA S.A.',
    ],
    ['WEGE3', 'WEG S.A.', 'WEG S.A.'],
    ['WEGE3', 'WEG SA', 'WEG SA'],
    ['PSSA3', 'PORTO SEGURO S.A.', 'PORTO SEGURO S.A.'],
    ['PSSA3', 'PORTO SEGURO SA', 'PORTO SEGURO SA'],
  ] as const)(
    'matches the closed alias for %s: %s',
    (ticker, observed, expected) => {
      const canonical = getOfficialEventAssetIdentitiesV1().find(
        (identity) => identity.ticker === ticker
      )
      if (!canonical || canonical.category !== 'brazilian-stock') {
        throw new Error(`Missing stock fixture for ${ticker}`)
      }
      expect(
        matchCvmIpeCompanyNameAlias(ticker, observed, canonical.officialName)
      ).toBe(expected)
    }
  )

  it('never emits event types outside the closed approved mapping', () => {
    const emitted = new Set(
      CATEGORY_CASES.map(
        ([Categoria], index) =>
          extract([
            createFixtureRow({
              Categoria,
              Protocolo_Entrega: `category-${index}`,
            }),
          ]).events[0].eventType
      )
    )
    for (const forbidden of [
      'other-official-event',
      'earnings-release',
      'dividend-or-distribution',
      'capital-structure-change',
      'management-change',
      'merger-acquisition-or-reorganization',
    ]) {
      expect([...emitted]).not.toContain(forbidden)
    }
  })

  it('preserves the matched alias and mapping version in provenance', () => {
    const event = extract([createFixtureRow()]).events[0]
    expect(event.provenance.rawFields).toMatchObject({
      observedCompanyName: 'BANCO DO BRASIL S.A.',
      observedCompanyCnpj: '00.000.000/0001-91',
      observedCvmCode: '1023',
      matchedCompanyNameAlias: 'BANCO DO BRASIL S.A.',
      companyNameAliasMappingVersion:
        CVM_IPE_STOCK_COMPANY_NAME_ALIASES_V1_VERSION,
    })
  })

  it('applies only NFKC, case and whitespace normalization to aliases', () => {
    const identities = getOfficialEventAssetIdentitiesV1()
    const weg = identities.find((identity) => identity.ticker === 'WEGE3')
    const taee = identities.find((identity) => identity.ticker === 'TAEE11')
    if (
      !weg ||
      weg.category !== 'brazilian-stock' ||
      !taee ||
      taee.category !== 'brazilian-stock'
    ) {
      throw new Error('Missing identity fixtures')
    }
    expect(
      matchCvmIpeCompanyNameAlias(
        'WEGE3',
        '  ｗｅｇ   ｓａ  ',
        weg.officialName
      )
    ).toBe('WEG SA')
    expect(
      matchCvmIpeCompanyNameAlias(
        'TAEE11',
        'TRANSMISSORA ALIANCA DE ENERGIA ELETRICA S.A.',
        taee.officialName
      )
    ).toBeNull()
    expect(
      matchCvmIpeCompanyNameAlias('WEGE3', 'WEG-S.A.', weg.officialName)
    ).toBeNull()
  })

  it('keeps alias matching deterministic across calls', () => {
    const canonical = getOfficialEventAssetIdentitiesV1().find(
      (identity) => identity.ticker === 'BBAS3'
    )
    if (!canonical || canonical.category !== 'brazilian-stock') {
      throw new Error('Missing BBAS3 identity fixture')
    }
    const first = matchCvmIpeCompanyNameAlias(
      'BBAS3',
      'BANCO DO BRASIL S.A.',
      canonical.officialName
    )
    const second = matchCvmIpeCompanyNameAlias(
      'BBAS3',
      'BANCO DO BRASIL S.A.',
      canonical.officialName
    )
    expect(second).toBe(first)
  })

  it('accepts formatted, unformatted and spaced CNPJ plus padded CVM code', () => {
    const rows = [
      createFixtureRow(),
      createFixtureRow({
        CNPJ_Companhia: '00000000000191',
        Codigo_CVM: '001023',
        Protocolo_Entrega: 'second-protocol',
      }),
      createFixtureRow({
        CNPJ_Companhia: '00 000 000 / 0001 - 91',
        Codigo_CVM: '1023',
        Protocolo_Entrega: 'third-protocol',
      }),
    ]
    expect(extract(rows).events).toHaveLength(3)
  })

  it('ignores companies outside the registry universe', () => {
    const result = extract([
      createFixtureRow({
        CNPJ_Companhia: '11.111.111/0001-11',
        Nome_Companhia: 'OUTRA COMPANHIA S.A.',
        Codigo_CVM: '999999',
      }),
    ])
    expect(result).toMatchObject({
      ignoredNonUniverseRows: 1,
      targetRows: 0,
      acceptedRows: 0,
    })
  })

  it.each([
    ['CNPJ', { CNPJ_Companhia: '00.000.000/0001-92' }],
    ['CNPJ', { CNPJ_Companhia: '' }],
    ['CNPJ', { CNPJ_Companhia: 'invalid' }],
    ['CNPJ', { CNPJ_Companhia: '00.000.000/0001-\t91' }],
    ['company name', { Nome_Companhia: 'BANCO DO BRASIL' }],
    ['company name', { Nome_Companhia: 'WEG SA' }],
  ] as const)('blocks the batch on %s mismatch', (detail, overrides) => {
    expect(() => extract([createFixtureRow(overrides)])).toThrow(
      `CVM IPE identity mismatch for BBAS3: ${detail}`
    )
  })

  it.each([
    { CNPJ_Companhia: '00.000.000/0001-910' },
    { CNPJ_Companhia: '00.000.000/000A-91' },
    { Nome_Companhia: 'BANCO DO BRASIL SA' },
    { Nome_Companhia: 'BANCO BRASIL S.A.' },
  ])('rejects a near but unauthorized identity %#', (overrides) => {
    expect(() => extract([createFixtureRow(overrides)])).toThrow(
      /CVM IPE identity mismatch for BBAS3/
    )
  })

  it.each(['not-numeric', '1234567'])(
    'treats invalid non-universe CVM code %s as ignored without truncation',
    (Codigo_CVM) => {
      const result = extract([createFixtureRow({ Codigo_CVM })])
      expect(result).toMatchObject({
        ignoredNonUniverseRows: 1,
        targetRows: 0,
      })
    }
  )

  it('namespaces the same protocol by asset without a structural collision', () => {
    const protocol = 'shared-protocol'
    const [bbas, itsa] = createFiveCompanyRows()
    const result = extract([
      { ...bbas, Protocolo_Entrega: protocol },
      { ...itsa, Protocolo_Entrega: protocol },
    ])

    expect(result.events).toHaveLength(2)
    expect(
      result.events.map(({ assetIdentity }) => assetIdentity.ticker)
    ).toEqual(['BBAS3', 'ITSA4'])
    expect(new Set(result.events.map(({ eventId }) => eventId)).size).toBe(2)
    expect(
      new Set(result.events.map(({ deduplicationKey }) => deduplicationKey))
        .size
    ).toBe(2)
    expect(result.duplicates).toEqual([])
    expect(result.conflicts).toEqual([])
  })

  it('uses only the domain registry version in association evidence', () => {
    const event = extract([createFixtureRow()]).events[0]
    expect(event.associationEvidence).toEqual([
      {
        reason: 'exact-regulatory-identity',
        observedRegulatoryIdentityKey: 'cvm:company:001023:00000000000191',
      },
      {
        reason: 'exact-ticker-provider-mapping',
        observedTicker: 'BBAS3',
        mappingVersion: OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION,
      },
      { reason: 'exact-cnpj', observedCnpj: '00000000000191' },
    ])
  })
})

describe('CVM IPE closed category mapping', () => {
  it.each(CATEGORY_CASES)('maps %s only to %s', (category, eventType) => {
    const result = extract([createFixtureRow({ Categoria: category })])
    expect(result.events[0].eventType).toBe(eventType)
  })

  it('rejects an unsupported category without emitting other-official-event', () => {
    const result = extract([
      createFixtureRow({ Categoria: 'Categoria futura' }),
    ])
    expect(result.events).toEqual([])
    expect(result.rejectedRows[0].reason).toBe('unsupported-category')
    expect(Object.keys(result.rejectedRows[0]).sort()).toEqual(
      [
        'rowNumber',
        'cvmCode',
        'ticker',
        'protocolNumber',
        'category',
        'reason',
        'message',
      ].sort()
    )
  })

  it.each([
    ' Fato Relevante',
    'Fato  Relevante',
    'fato relevante',
    'Fato Relevante.',
    'Fato Relevante adicional',
    'Prefixo Fato Relevante',
    'Fato',
    'Informacao Prestada às Bolsas Estrangeiras',
  ])('rejects non-exact category %s', (Categoria) => {
    const result = extract([createFixtureRow({ Categoria })])
    expect(result.rejectedRows[0].reason).toBe('unsupported-category')
  })

  it.each([
    [
      'Comunicado ao Mercado',
      'Dividendos extraordinários',
      'market-communication',
    ],
    ['Fato Relevante', 'Fusão societária', 'material-fact'],
    ['Dados Econômico-Financeiros', 'Resultado anual', 'regulatory-filing'],
    ['Aviso aos Acionistas', 'Distribuição aprovada', 'market-communication'],
  ] as const)(
    'does not classify %s by the subject %s',
    (category, subject, eventType) => {
      const event = extract([
        createFixtureRow({ Categoria: category, Assunto: subject }),
      ]).events[0]
      expect(event.eventType).toBe(eventType)
      expect(event.eventType).not.toBe('other-official-event')
    }
  )
})

describe('CVM IPE dates, documents and status', () => {
  it('uses civil publication and reference dates without inventing an instant', () => {
    const event = extract([
      createFixtureRow({
        Data_Entrega: '2026-07-16 15:42:10',
        Data_Referencia: '2026-07-15',
      }),
    ]).events[0]
    expect(event.publishedAt).toEqual({
      precision: 'date',
      date: '2026-07-16',
      raw: '2026-07-16',
    })
    expect(event.occurredAt).toEqual({
      precision: 'date',
      date: '2026-07-15',
      raw: '2026-07-15',
    })
    expect(event.provenance.rawFields.dataEntregaRaw).toBe(
      '2026-07-16 15:42:10'
    )
  })

  it('maps empty and unrecognized reference dates without inference', () => {
    const empty = extract([createFixtureRow({ Data_Referencia: '' })]).events[0]
    const unknown = extract([
      createFixtureRow({ Data_Referencia: 'competência não estruturada' }),
    ]).events[0]
    expect(empty.occurredAt).toBeNull()
    expect(unknown.occurredAt).toEqual({
      precision: 'unknown',
      raw: 'competência não estruturada',
    })
  })

  it.each([
    [{ Data_Entrega: '' }, 'missing-published-date'],
    [{ Data_Entrega: '2026-02-30' }, 'invalid-published-date'],
    [{ Data_Referencia: '2026-02-30' }, 'invalid-reference-date'],
  ] as const)('rejects invalid temporal content %#', (overrides, reason) => {
    expect(extract([createFixtureRow(overrides)]).rejectedRows[0].reason).toBe(
      reason
    )
  })

  it.each([
    '2026-07-16T15:42:10Z',
    '2026-07-16T15:42:10-03:00',
    '16/07/2026',
    'publicado em 2026-07-16',
    '2026-07-16 24:00:00',
    '2026-07-16 15:60:00',
    '2026-07-16 15:42:60',
    '0000-01-01',
  ])('rejects unsupported publication value %s', (Data_Entrega) => {
    expect(
      extract([createFixtureRow({ Data_Entrega })]).rejectedRows[0].reason
    ).toBe('invalid-published-date')
  })

  it.each([
    ['1900-02-28', true],
    ['1900-02-29', false],
    ['2000-02-29', true],
    ['2100-02-29', false],
    ['2026-04-31', false],
    ['2025-12-31', true],
    ['2026-01-01', true],
  ] as const)('validates Gregorian date %s', (Data_Entrega, accepted) => {
    const result = extract([createFixtureRow({ Data_Entrega })])
    expect(result.events.length === 1).toBe(accepted)
  })

  it('keeps an unrecognized reference datetime as unknown', () => {
    const event = extract([
      createFixtureRow({ Data_Referencia: '2026-07-15 10:30:00' }),
    ]).events[0]
    expect(event.occurredAt).toEqual({
      precision: 'unknown',
      raw: '2026-07-15 10:30:00',
    })
  })

  it('namespaces and preserves the official protocol', () => {
    const event = extract([createFixtureRow()]).events[0]
    expect(event.sourceDocumentId).toBe(
      'cvm-ipe:001023IPE160720260000000001-01'
    )
    expect(event.documentIdentifiers.protocolNumber).toBe(
      '001023IPE160720260000000001-01'
    )
  })

  it('accepts an official URL and lets the domain normalize it', () => {
    const event = extract([createFixtureRow()]).events[0]
    expect(event.originalUrl).toBe(
      'https://www.rad.cvm.gov.br/ENET/frmDownloadDocumento.aspx?numProtocolo=1'
    )
    expect(event.canonicalUrl).toBe(event.originalUrl)
  })

  it.each([
    ['http://www.rad.cvm.gov.br/documento', 'invalid-document-url'],
    ['https://example.com/documento', 'unapproved-document-host'],
    ['not-a-url', 'invalid-document-url'],
  ] as const)('rejects document URL %s', (url, reason) => {
    expect(
      extract([createFixtureRow({ Link_Download: url })]).rejectedRows[0].reason
    ).toBe(reason)
  })

  it.each([
    'https://www.rad.cvm.gov.br.evil.example/documento',
    'https://evilwww.rad.cvm.gov.br/documento',
    'https://rad.cvm.gov.br/documento',
    'https://www.rad.cvm.gov.br./documento',
    'https://127.0.0.1/documento',
    'https://localhost/documento',
    'https://www.rad.cvm.gov.br:444/documento',
    'https://www.rad.cvm.gov.br\\evil.example/documento',
    'https://www%2Erad.cvm.gov.br/documento',
    '//www.rad.cvm.gov.br/documento',
    'javascript:alert(1)',
  ])('rejects spoofed or noncanonical URL %s', (Link_Download) => {
    expect(
      extract([createFixtureRow({ Link_Download })]).rejectedRows[0].reason
    ).toMatch(/document-url|document-host/)
  })

  it('rejects URL credentials but accepts the default HTTPS port', () => {
    const rejected = extract([
      createFixtureRow({
        Link_Download: 'https://user:pass@www.rad.cvm.gov.br/documento',
      }),
    ])
    const accepted = extract([
      createFixtureRow({
        Link_Download: 'https://www.rad.cvm.gov.br:443/documento',
      }),
    ])
    expect(rejected.rejectedRows[0].reason).toBe('invalid-document-url')
    expect(accepted.events).toHaveLength(1)
  })

  it('accepts uppercase official host and percent-encoded path content', () => {
    const event = extract([
      createFixtureRow({
        Link_Download: 'https://WWW.RAD.CVM.GOV.BR/documento/arquivo%20oficial',
      }),
    ]).events[0]
    expect(event.canonicalUrl).toBe(
      'https://www.rad.cvm.gov.br/documento/arquivo%20oficial'
    )
  })

  it('accepts protocol without URL and URL without protocol', () => {
    const protocolOnly = extract([createFixtureRow({ Link_Download: '' })])
      .events[0]
    const urlOnly = extract([createFixtureRow({ Protocolo_Entrega: '' })])
      .events[0]
    expect(protocolOnly.documentIdentity.kind).toBe('source-document-id')
    expect(urlOnly.documentIdentity.kind).toBe('canonical-url')
  })

  it('uses the domain fingerprint only when no official identifier exists', () => {
    const event = extract([
      createFixtureRow({ Protocolo_Entrega: '', Link_Download: '' }),
    ]).events[0]
    expect(event.documentIdentity).toMatchObject({ kind: 'fingerprint' })
    expect(event.documentIdentity.value).toMatch(/^fnv1a64:[0-9a-f]{16}$/)
  })

  it('normalizes outer protocol whitespace and safely accepts a colon', () => {
    const event = extract([
      createFixtureRow({ Protocolo_Entrega: '  protocolo:oficial  ' }),
    ]).events[0]
    expect(event.documentIdentifiers.protocolNumber).toBe('protocolo:oficial')
    expect(event.sourceDocumentId).toBe('cvm-ipe:protocolo:oficial')
    expect(event.eventId).toContain('source-document-id')
  })

  it.each(['controle\u0001interno', '\nprotocolo', 'x'.repeat(1_001)])(
    'rejects invalid protocol %j',
    (Protocolo_Entrega) => {
      const result = extract([createFixtureRow({ Protocolo_Entrega })])
      expect(result.rejectedRows[0].reason).toBe('invalid-document-identifiers')
    }
  )

  it('keeps versioned presentations original and never infers a revision', () => {
    const event = extract([
      createFixtureRow({
        Tipo_Apresentacao: 'RE - Reapresentação Espontânea',
        Versao: '4',
      }),
    ]).events[0]
    expect(event.status).toBe('original')
    expect(event.supersedesEventId).toBeNull()
    expect(event.relatedDocuments).toEqual([])
    expect(event.provenance.rawFields.versaoRaw).toBe('4')
  })

  it('rejects an unsupported presentation status', () => {
    const result = extract([
      createFixtureRow({ Tipo_Apresentacao: 'CA - Cancelado' }),
    ])
    expect(result.rejectedRows[0]).toMatchObject({
      reason: 'unsupported-document-status',
    })
  })

  it('rejects an unknown neutral presentation without calling it cancellation', () => {
    const rejected = extract([
      createFixtureRow({ Tipo_Apresentacao: 'XX - Estado futuro' }),
    ]).rejectedRows[0]
    expect(rejected.reason).toBe('unsupported-document-status')
    expect(rejected.message).not.toMatch(/cancel/i)
  })

  it('builds a deterministic title by subject, species and type', () => {
    const subject = extract([
      createFixtureRow({ Assunto: '  Evento   oficial ' }),
    ]).events[0]
    const species = extract([
      createFixtureRow({ Assunto: '', Especie: ' Ata ' }),
    ]).events[0]
    const type = extract([
      createFixtureRow({ Assunto: '', Especie: '', Tipo: ' Documento ' }),
    ]).events[0]
    expect(subject.title).toBe('Fato Relevante — Evento oficial')
    expect(species.title).toBe('Fato Relevante — Ata')
    expect(type.title).toBe('Fato Relevante — Documento')
    expect(subject.summary).toBeNull()
  })

  it.each([
    ['Assunto; oficial', 'Fato Relevante — Assunto; oficial'],
    ['Assunto "oficial"', 'Fato Relevante — Assunto "oficial"'],
    ['Assunto\ncom quebra', 'Fato Relevante — Assunto com quebra'],
    ['Informação econômica', 'Fato Relevante — Informação econômica'],
  ] as const)('preserves safe title content %j', (Assunto, title) => {
    const event = extract([createFixtureRow({ Assunto })]).events[0]
    expect(event.title).toBe(title)
    expect(event.summary).toBeNull()
  })

  it.each(['<p>conteúdo</p>', 'x'.repeat(501)])(
    'rejects invalid title content',
    (subject) => {
      expect(
        extract([createFixtureRow({ Assunto: subject })]).rejectedRows[0].reason
      ).toBe('invalid-title')
    }
  )

  it('rejects evident HTML preserved only in provenance', () => {
    const result = extract([
      createFixtureRow({ Tipo: '<p>documento</p>', Assunto: 'Assunto seguro' }),
    ])
    expect(result.rejectedRows[0].reason).toBe('invalid-event')
    expect(result.rejectedRows[0].message).toMatch(/HTML/)
  })
})

describe('CVM IPE event extraction and deduplication', () => {
  it('returns the complete deterministic provider result', () => {
    const rows = createFiveCompanyRows()
    const first = extract(rows)
    const second = extract(rows)
    expect(first).toEqual(second)
    expect(first).toMatchObject({
      providerVersion: CVM_IPE_STOCK_EVENTS_PROVIDER_V1_VERSION,
      source: 'cvm-ipe',
      year: 2026,
      totalRows: 5,
      targetRows: 5,
      acceptedRows: 5,
      exactDuplicateRows: 0,
      conflictingPayloadRows: 0,
      ignoredNonUniverseRows: 0,
    })
    expect(first.events[0]).toMatchObject({
      source: 'cvm-ipe',
      sourceType: 'regulator',
      language: 'pt-BR',
      jurisdiction: 'BR',
      summary: null,
      status: 'original',
      provenance: {
        sourceSystem: 'cvm-ipe',
        parserVersion: CVM_IPE_STOCK_EVENTS_PARSER_V1_VERSION,
        mappingVersion: OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION,
      },
    })
    expect(first.events.every(({ source }) => source === 'cvm-ipe')).toBe(true)
  })

  it('preserves the exact audited provenance surface and fixed payload hash', () => {
    const event = extract([createFixtureRow()]).events[0]
    expect(event.provenance).toMatchObject({
      sourceSystem: 'cvm-ipe',
      sourceType: 'regulator',
      rawDocumentType: 'Fato Relevante',
      rawDocumentCategory: 'Fato Relevante',
      parserVersion: 'cvm-ipe-stock-events-parser.v1',
      mappingVersion: 'official-event-asset-identities.v1',
      termsAuditedAt: '2026-07-16',
      attribution: 'CVM Dados Abertos — ODbL-1.0',
      rawFields: {
        observedCompanyName: 'BANCO DO BRASIL S.A.',
        observedCompanyCnpj: '00.000.000/0001-91',
        observedCvmCode: '1023',
        matchedCompanyNameAlias: 'BANCO DO BRASIL S.A.',
        companyNameAliasMappingVersion: 'cvm-ipe-stock-company-name-aliases.v1',
        dataReferenciaRaw: '2026-07-15',
        dataEntregaRaw: '2026-07-16',
        categoriaRaw: 'Fato Relevante',
        tipoRaw: '',
        especieRaw: '',
        assuntoRaw: 'Evento oficial',
        tipoApresentacaoRaw: 'AP - Apresentação',
        protocoloEntregaRaw: '001023IPE160720260000000001-01',
        versaoRaw: '1',
        linkDownloadRaw:
          'https://www.rad.cvm.gov.br/ENET/frmDownloadDocumento.aspx?numProtocolo=1&utm_source=test#top',
      },
    })
    expect(event.provenance.sourcePayloadHash).toBe('fnv1a64:78cb4a09d63e1653')
  })

  it('changes the payload hash for each of the thirteen official fields', () => {
    const base = createFixtureRow()
    const baseHash = extract([base]).events[0].provenance.sourcePayloadHash
    const changedValues = {
      CNPJ_Companhia: '00 000 000/0001-91',
      Nome_Companhia: 'BCO BRASIL S.A.',
      Codigo_CVM: '001023',
      Data_Referencia: '2026-07-14',
      Categoria: 'Comunicado ao Mercado',
      Tipo: 'Tipo oficial',
      Especie: 'Espécie oficial',
      Assunto: 'Outro assunto',
      Data_Entrega: '2026-07-17',
      Tipo_Apresentacao: 'RE - Reapresentação Espontânea',
      Protocolo_Entrega: 'outro-protocolo',
      Versao: '2',
      Link_Download: 'https://www.rad.cvm.gov.br/documento?id=2',
    } satisfies FixtureRow
    for (const [field, value] of Object.entries(changedValues)) {
      const row = { ...base, [field]: value }
      expect(extract([row]).events[0].provenance.sourcePayloadHash).not.toBe(
        baseHash
      )
    }
  })

  it('does not include row order or execution timestamps in the payload hash', () => {
    const row = createFixtureRow()
    const first = extract([row]).events[0].provenance.sourcePayloadHash
    const second = extractCvmIpeStockEvents({
      year: 2026,
      archiveFileName: 'ipe_cia_aberta_2026.zip',
      csvFileName: 'ipe_cia_aberta_2026.csv',
      csvContent: createFixtureCsv([
        createFixtureRow({
          CNPJ_Companhia: '11.111.111/0001-11',
          Nome_Companhia: 'OUTRA S.A.',
          Codigo_CVM: '999999',
        }),
        row,
      ]),
      ingestedAt: '2026-07-17T00:00:00.123456789Z',
      updatedAt: '2026-07-17T00:00:00.123456789Z',
    }).events[0].provenance.sourcePayloadHash
    expect(second).toBe(first)
  })

  it('does not mutate rows and returns defensive event copies', () => {
    const rows = createFiveCompanyRows()
    const snapshot = structuredClone(rows)
    const first = extract(rows)
    first.events[0].assetIdentity.officialName = 'changed'
    expect(rows).toEqual(snapshot)
    expect(extract(rows).events[0].assetIdentity.officialName).toBe(
      'BCO BRASIL S.A.'
    )
  })

  it('reports an exact duplicate and preserves the first occurrence', () => {
    const row = createFixtureRow()
    const result = extract([row, structuredClone(row)])
    expect(result.events).toHaveLength(1)
    expect(result.duplicates).toHaveLength(1)
    expect(result.conflicts).toEqual([])
    expect(result.exactDuplicateRows).toBe(1)
    expect(result.conflictingPayloadRows).toBe(0)
    expect(result.duplicates[0]).toMatchObject({
      keptInputIndex: 0,
      duplicateInputIndex: 1,
    })
  })

  it('reports a payload conflict without replacing the first occurrence', () => {
    const first = createFixtureRow({ Assunto: 'Primeiro payload' })
    const conflict = createFixtureRow({ Assunto: 'Payload divergente' })
    const result = extract([first, conflict])
    const secondHash = extract([conflict]).events[0].provenance
      .sourcePayloadHash
    expect(result.events).toHaveLength(1)
    expect(result.events[0].title).toContain('Primeiro payload')
    expect(result.conflicts).toHaveLength(1)
    expect(result.exactDuplicateRows).toBe(0)
    expect(result.conflictingPayloadRows).toBe(1)
    expect(result.conflicts[0].inputIndexes).toEqual([0, 1])
    expect(result.conflicts[0].sourcePayloadHashes).toEqual([
      result.events[0].provenance.sourcePayloadHash,
      secondHash,
    ])
  })

  it('deduplicates equal URL payloads without a protocol', () => {
    const row = createFixtureRow({ Protocolo_Entrega: '' })
    const result = extract([row, structuredClone(row)])
    expect(result.events).toHaveLength(1)
    expect(result.exactDuplicateRows).toBe(1)
  })

  it('reports fingerprint conflicts when nonidentity payload fields differ', () => {
    const first = createFixtureRow({
      Protocolo_Entrega: '',
      Link_Download: '',
      Versao: '1',
    })
    const second = { ...first, Versao: '2' }
    const result = extract([first, second])
    expect(result.events).toHaveLength(1)
    expect(result.conflictingPayloadRows).toBe(1)
    expect(result.conflicts).toHaveLength(1)
  })

  it('counts three exact duplicates and preserves the first occurrence', () => {
    const row = createFixtureRow()
    const result = extract([row, structuredClone(row), structuredClone(row)])
    expect(result.events).toHaveLength(1)
    expect(result.exactDuplicateRows).toBe(2)
    expect(
      result.duplicates.map(({ duplicateInputIndex }) => duplicateInputIndex)
    ).toEqual([1, 2])
  })

  it('preserves multiple conflicting hashes in first-seen order', () => {
    const rows = ['A', 'B', 'C'].map((Versao) => createFixtureRow({ Versao }))
    const result = extract(rows)
    expect(result.events).toHaveLength(1)
    expect(result.conflictingPayloadRows).toBe(2)
    expect(result.conflicts[0].sourcePayloadHashes).toHaveLength(3)
  })

  it('makes counter semantics explicit for mixed rows', () => {
    const accepted = createFixtureRow()
    const result = extract([
      accepted,
      structuredClone(accepted),
      createFixtureRow({ Assunto: 'Conflito' }),
      createFixtureRow({
        Categoria: 'Categoria futura',
        Protocolo_Entrega: 'r',
      }),
      createFixtureRow({ Codigo_CVM: '999999' }),
    ])
    expect(result).toMatchObject({
      totalRows: 5,
      ignoredNonUniverseRows: 1,
      targetRows: 4,
      acceptedRows: 3,
      exactDuplicateRows: 1,
      conflictingPayloadRows: 1,
    })
    expect(result.rejectedRows).toHaveLength(1)
    expect(result.events).toHaveLength(1)
  })

  it('returns defensive rejection, duplicate and conflict metadata', () => {
    const accepted = createFixtureRow()
    const result = extract([
      accepted,
      structuredClone(accepted),
      createFixtureRow({ Assunto: 'Conflito' }),
      createFixtureRow({
        Categoria: 'Categoria futura',
        Protocolo_Entrega: 'r',
      }),
    ])
    result.rejectedRows[0].message = 'changed'
    result.duplicates[0].duplicateInputIndex = 99
    result.conflicts[0].inputIndexes.push(99)
    const repeated = extract([
      accepted,
      structuredClone(accepted),
      createFixtureRow({ Assunto: 'Conflito' }),
      createFixtureRow({
        Categoria: 'Categoria futura',
        Protocolo_Entrega: 'r',
      }),
    ])
    expect(repeated.rejectedRows[0].message).not.toBe('changed')
    expect(repeated.duplicates[0].duplicateInputIndex).toBe(1)
    expect(repeated.conflicts[0].inputIndexes).toEqual([0, 2])
  })

  it('keeps unique event order', () => {
    const rows = createFiveCompanyRows().reverse()
    expect(
      extract(rows).events.map(({ assetIdentity }) => assetIdentity.ticker)
    ).toEqual(['PSSA3', 'WEGE3', 'TAEE11', 'ITSA4', 'BBAS3'])
  })

  it('composes download, archive and extraction without fetching document links', async () => {
    const csv = createFixtureCsv([createFixtureRow()])
    const archive = zipSync({
      'ipe_cia_aberta_2026.csv': encodeWindows1252(csv),
    })
    const fetcher = vi.fn(async () => {
      const bytes = archive.slice()
      return {
        ok: true,
        status: 200,
        headers: { get: () => null },
        arrayBuffer: async () => bytes.buffer,
      }
    })
    const result = await fetchCvmIpeStockEvents({
      year: 2026,
      fetcher,
      ingestedAt: INGESTED_AT,
      updatedAt: UPDATED_AT,
    })
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(result.events).toHaveLength(1)
  })

  it('validates year and timestamps before the injected network call', async () => {
    const fetcher = vi.fn(async () => {
      throw new Error('must not run')
    })
    await expect(
      fetchCvmIpeStockEvents({
        year: 2002,
        fetcher,
        ingestedAt: INGESTED_AT,
        updatedAt: UPDATED_AT,
      })
    ).rejects.toThrow(/year/)
    await expect(
      fetchCvmIpeStockEvents({
        year: 2026,
        fetcher,
        ingestedAt: 'invalid',
        updatedAt: UPDATED_AT,
      })
    ).rejects.toThrow(/ingestedAt/)
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('validates execution timestamps even when the CSV has no records', () => {
    expect(() =>
      extractCvmIpeStockEvents({
        year: 2026,
        archiveFileName: 'ipe_cia_aberta_2026.zip',
        csvFileName: 'ipe_cia_aberta_2026.csv',
        csvContent: createFixtureCsv([]),
        ingestedAt: '2026-07-16T24:00:00Z',
        updatedAt: UPDATED_AT,
      })
    ).toThrow(/ingestedAt/)
  })

  it('rejects execution timestamps in reverse order', () => {
    expect(() =>
      extractCvmIpeStockEvents({
        year: 2026,
        archiveFileName: 'ipe_cia_aberta_2026.zip',
        csvFileName: 'ipe_cia_aberta_2026.csv',
        csvContent: createFixtureCsv([]),
        ingestedAt: '2026-07-16T18:00:00.1Z',
        updatedAt: '2026-07-16T18:00:00.01Z',
      })
    ).toThrow(/earlier/)
  })

  it.each([
    ['wrong.zip', 'ipe_cia_aberta_2026.csv'],
    ['ipe_cia_aberta_2026.zip', 'wrong.csv'],
  ])(
    'rejects incoherent extraction filenames',
    (archiveFileName, csvFileName) => {
      expect(() =>
        extractCvmIpeStockEvents({
          year: 2026,
          archiveFileName,
          csvFileName,
          csvContent: createFixtureCsv([]),
          ingestedAt: INGESTED_AT,
          updatedAt: UPDATED_AT,
        })
      ).toThrow(/filename/)
    }
  )
})
