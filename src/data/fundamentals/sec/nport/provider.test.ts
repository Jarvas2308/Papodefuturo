import { describe, expect, it, vi } from 'vitest'
import { buildFundamentalFactsV1 } from '../../../../domain/fundamentals'
import type { Asset } from '../../../../domain/models'
import {
  buildSecHistoricalSubmissionsUrl,
  buildSecPrimaryDocumentUrl,
  buildSecSubmissionsUrl,
} from './documents'
import { getSecInternationalEtf, SEC_INTERNATIONAL_ETFS } from './etfs'
import {
  assertSecNportFundIdentity,
  loadLatestSecNportFundamentalRecord,
  loadSecInternationalEtfFundamentals,
} from './provider'
import {
  AUDITED_CLASS_IDS,
  AUDITED_FILINGS,
  createHistoricalJson,
  createMinimalNportXml,
  createSubmissionsJson,
} from './testFixtures'
import type { SecNportFetcher, SecNportFiling } from './types'
import { parseSecNportXml, SEC_NPORT_XML_PATHS } from './xml'

const USER_AGENT = 'PapoDeFuturo/1.0 contato@example.com'

function response(body: string) {
  return { ok: true, status: 200, text: async () => body }
}

function createFetcher(): SecNportFetcher {
  const bodies = new Map<string, string>()
  for (const fund of SEC_INTERNATIONAL_ETFS) {
    const filing = AUDITED_FILINGS[fund.ticker]!
    bodies.set(
      buildSecSubmissionsUrl(fund.registrantCik),
      createSubmissionsJson([filing])
    )
    bodies.set(
      buildSecPrimaryDocumentUrl(fund.registrantCik, filing),
      createMinimalNportXml({
        fund: { ...fund },
        filing,
        totalAssets: fund.ticker === 'VEA' ? '282420399171.71' : '1000000.00',
        totalLiabilities: fund.ticker === 'VEA' ? '285153841.52' : '10000.00',
        netAssets: fund.ticker === 'VEA' ? '282135245330.19' : '990000.00',
      })
    )
  }

  return vi.fn(async (url) => {
    const body = bodies.get(url)
    if (body === undefined) {
      return { ok: false, status: 404, text: async () => '' }
    }
    return response(body)
  })
}

describe('SEC N-PORT closed fund identity', () => {
  it('preserves the official VOO, VNQ and VEA CIK, series and class identities', () => {
    expect(SEC_INTERNATIONAL_ETFS).toMatchObject([
      {
        ticker: 'VOO',
        registrantCik: '0000036405',
        seriesId: 'S000002839',
        classId: 'C000092055',
      },
      {
        ticker: 'VNQ',
        registrantCik: '0000734383',
        seriesId: 'S000002924',
        classId: 'C000032424',
      },
      {
        ticker: 'VEA',
        registrantCik: '0000923202',
        seriesId: 'S000004386',
        classId: 'C000051262',
      },
    ])
    expect(getSecInternationalEtf(' voo ').ticker).toBe('VOO')
    expect(() => getSecInternationalEtf('VT')).toThrow(
      'Unsupported SEC international ETF ticker'
    )
  })

  it.each([
    ['registrantCik', '0000000000', 'registrant CIK'],
    ['registrantName', 'OTHER REGISTRANT', 'registrant name'],
    ['seriesId', 'S000000000', 'series ID'],
    ['seriesName', 'Other Series', 'series name'],
  ] as const)('rejects divergent %s', (field, value, expectedMessage) => {
    const fund = { ...SEC_INTERNATIONAL_ETFS[0] }
    const parsed = parseSecNportXml(
      createMinimalNportXml({
        fund,
        filing: AUDITED_FILINGS.VOO!,
        [field]: value,
        ...(field === 'seriesId' ? { headerSeriesId: value } : {}),
      })
    )
    expect(() => assertSecNportFundIdentity(parsed, fund)).toThrow(
      expectedMessage
    )
  })

  it('rejects divergent class mapping and currency', () => {
    const fund = { ...SEC_INTERNATIONAL_ETFS[0] }
    const parsed = parseSecNportXml(
      createMinimalNportXml({
        fund,
        filing: AUDITED_FILINGS.VOO!,
        classIds: ['C000000000'],
      })
    )
    expect(() => assertSecNportFundIdentity(parsed, fund)).toThrow(
      'class mapping'
    )
    expect(() =>
      assertSecNportFundIdentity(parsed, {
        ...fund,
        classId: 'C000000000',
        currency: 'BRL',
      })
    ).toThrow('Invalid closed SEC fund identity')
  })
})

describe('SEC N-PORT provider', () => {
  it('loads VOO, VNQ and VEA sequentially with deterministic identities', async () => {
    const fetcher = createFetcher()
    const records = await loadSecInternationalEtfFundamentals({
      userAgent: USER_AGENT,
      fetcher,
    })

    expect(records.map((record) => record.ticker)).toEqual([
      'VOO',
      'VNQ',
      'VEA',
    ])
    expect(records.every((record) => record.filingVersion === null)).toBe(true)
    expect(records.every((record) => record.exerciseOrder === null)).toBe(true)
    expect(records[0]?.sourceDocumentId).toBe(
      'sec-nport:0000036405:S000002839:C000092055:2026-03-31:0000036405-26-000325'
    )
    expect(fetcher).toHaveBeenCalledTimes(6)
  })

  it('preserves complete official provenance and exact USD facts', async () => {
    const records = await loadSecInternationalEtfFundamentals({
      userAgent: USER_AGENT,
      fetcher: createFetcher(),
    })
    const vea = records[2]!

    expect(vea.facts).toEqual({
      totalAssets: {
        amountInMinorUnits: 28_242_039_917_171,
        currency: 'USD',
      },
      totalLiabilities: {
        amountInMinorUnits: 28_515_384_152,
        currency: 'USD',
      },
      netAssets: {
        amountInMinorUnits: 28_213_524_533_019,
        currency: 'USD',
      },
    })
    expect(vea.provenance).toMatchObject({
      dataset: 'SEC EDGAR Form N-PORT',
      factualScope: 'series',
      factualIdentity: {
        registrantCik: '0000923202',
        registrantName: 'VANGUARD TAX-MANAGED FUNDS',
        seriesId: 'S000004386',
        classIds: AUDITED_CLASS_IDS.VEA,
      },
      productMapping: {
        ticker: 'VEA',
        expectedClassId: 'C000051262',
        expectedClassName: 'ETF Shares',
        category: 'international-etf',
        market: 'US',
        currency: 'USD',
      },
      expectedClassPresent: true,
      form: 'NPORT-P',
      accessionNumber: '0000923202-26-000098',
      reportDate: '2026-03-31',
      primaryDocument: 'primary_doc.xml',
      isAmendment: false,
      currency: 'USD',
      xmlPaths: SEC_NPORT_XML_PATHS,
      facts: {
        totalAssets: {
          path: SEC_NPORT_XML_PATHS.totalAssets,
          rawValue: '282420399171.71',
          normalizedAmountInMinorUnits: 28_242_039_917_171,
        },
      },
    })
  })

  it.each(SEC_INTERNATIONAL_ETFS)(
    'maps $ticker through its expected ETF class while preserving series-level facts',
    async (fund) => {
      const record = await loadLatestSecNportFundamentalRecord({
        fund: { ...fund },
        userAgent: USER_AGENT,
        fetcher: createFetcher(),
      })

      expect(record.provenance.factualScope).toBe('series')
      expect(record.provenance.factualIdentity.classIds).toEqual(
        AUDITED_CLASS_IDS[fund.ticker]
      )
      expect(record.provenance.productMapping.expectedClassId).toBe(
        fund.classId
      )
      expect(record.provenance.expectedClassPresent).toBe(true)
    }
  )

  it('uses a later amendment for the same report period', async () => {
    const fund = { ...SEC_INTERNATIONAL_ETFS[0] }
    const original = AUDITED_FILINGS.VOO!
    const amendment: SecNportFiling = {
      ...original,
      form: 'NPORT-P/A',
      accessionNumber: '0000036405-26-000326',
      acceptedAt: '2026-05-29T10:00:00.000Z',
    }
    const bodies = new Map([
      [
        buildSecSubmissionsUrl(fund.registrantCik),
        createSubmissionsJson([original, amendment]),
      ],
      [
        buildSecPrimaryDocumentUrl(fund.registrantCik, amendment),
        createMinimalNportXml({ fund, filing: amendment, form: 'NPORT-P/A' }),
      ],
    ])
    const fetcher: SecNportFetcher = vi.fn(async (url) => {
      const body = bodies.get(url)
      return body === undefined
        ? { ok: false, status: 404, text: async () => '' }
        : response(body)
    })

    const record = await loadLatestSecNportFundamentalRecord({
      fund,
      userAgent: USER_AGENT,
      fetcher,
    })
    expect(record.sourceArchive).toBe(amendment.accessionNumber)
    expect(record.provenance.isAmendment).toBe(true)
  })

  it('falls back to an official historical submissions file', async () => {
    const fund = { ...SEC_INTERNATIONAL_ETFS[0] }
    const filing = AUDITED_FILINGS.VOO!
    const historyName = 'CIK0000036405-submissions-001.json'
    const bodies = new Map([
      [
        buildSecSubmissionsUrl(fund.registrantCik),
        createSubmissionsJson([], [historyName]),
      ],
      [
        buildSecHistoricalSubmissionsUrl(historyName),
        createHistoricalJson([filing]),
      ],
      [
        buildSecPrimaryDocumentUrl(fund.registrantCik, filing),
        createMinimalNportXml({ fund, filing }),
      ],
    ])
    const fetcher: SecNportFetcher = vi.fn(async (url) => {
      const body = bodies.get(url)
      return body === undefined
        ? { ok: false, status: 404, text: async () => '' }
        : response(body)
    })

    await expect(
      loadLatestSecNportFundamentalRecord({
        fund,
        userAgent: USER_AGENT,
        fetcher,
      })
    ).resolves.toMatchObject({ ticker: 'VOO' })
    expect(fetcher).toHaveBeenCalledTimes(3)
  })

  it('does not select a different series from the same registrant', async () => {
    const fund = { ...SEC_INTERNATIONAL_ETFS[0] }
    const filing = AUDITED_FILINGS.VOO!
    const fetcher: SecNportFetcher = vi.fn(async (url) => {
      if (url === buildSecSubmissionsUrl(fund.registrantCik)) {
        return response(createSubmissionsJson([filing]))
      }
      return response(
        createMinimalNportXml({
          fund,
          filing,
          seriesId: 'S000099999',
          headerSeriesId: 'S000099999',
        })
      )
    })

    await expect(
      loadLatestSecNportFundamentalRecord({
        fund,
        userAgent: USER_AGENT,
        fetcher,
      })
    ).rejects.toThrow('No official SEC N-PORT filing found')
  })

  it('rejects a report period divergent from submissions metadata', async () => {
    const fund = { ...SEC_INTERNATIONAL_ETFS[0] }
    const filing = AUDITED_FILINGS.VOO!
    const fetcher: SecNportFetcher = vi.fn(async (url) => {
      if (url === buildSecSubmissionsUrl(fund.registrantCik)) {
        return response(createSubmissionsJson([filing]))
      }
      return response(
        createMinimalNportXml({
          fund,
          filing,
          reportDate: '2026-02-28',
        })
      )
    })

    await expect(
      loadLatestSecNportFundamentalRecord({
        fund,
        userAgent: USER_AGENT,
        fetcher,
      })
    ).rejects.toThrow('report period diverges')
  })

  it('produces snapshots accepted by Fundamental Facts V1', async () => {
    const records = await loadSecInternationalEtfFundamentals({
      userAgent: USER_AGENT,
      fetcher: createFetcher(),
    })
    const assets: Asset[] = records.map((record) => ({
      id: `asset-${record.ticker.toLowerCase()}`,
      ticker: record.ticker,
      name: record.ticker,
      category: 'international-etf',
      market: 'US',
      status: 'active',
    }))
    const facts = buildFundamentalFactsV1({
      generatedAt: '2026-07-16T15:00:00.000Z',
      assets,
      snapshots: records.map((record, index) => ({
        assetId: assets[index]!.id,
        kind: record.kind,
        referenceDate: record.referenceDate,
        period: record.period,
        source: record.source,
        sourceDocumentId: record.sourceDocumentId,
        facts: record.facts,
      })),
    })

    expect(facts.dataCoverage.internationalEtfSnapshotCount).toBe(3)
  })
})
