import { describe, expect, it } from 'vitest'
import { SEC_INTERNATIONAL_ETFS } from './etfs'
import {
  AUDITED_CLASS_IDS,
  AUDITED_FILINGS,
  createMinimalNportXml,
} from './testFixtures'
import {
  parseSecNportXml,
  SEC_NPORT_XML_NAMESPACE,
  SEC_NPORT_XML_PATHS,
} from './xml'

describe('parseSecNportXml', () => {
  it.each(SEC_INTERNATIONAL_ETFS)(
    'parses the audited minimal N-PORT structure for $ticker',
    (fund) => {
      const filing = AUDITED_FILINGS[fund.ticker]!
      const parsed = parseSecNportXml(
        createMinimalNportXml({ fund: { ...fund }, filing })
      )

      expect(parsed).toMatchObject({
        namespace: SEC_NPORT_XML_NAMESPACE,
        form: 'NPORT-P',
        registrantCik: fund.registrantCik,
        registrantName: fund.registrantName,
        seriesId: fund.seriesId,
        seriesName: fund.seriesName,
        classIds: AUDITED_CLASS_IDS[fund.ticker],
        reportDate: filing.reportDate,
        totalAssets: {
          path: SEC_NPORT_XML_PATHS.totalAssets,
          rawValue: '1000.00',
        },
        totalLiabilities: {
          path: SEC_NPORT_XML_PATHS.totalLiabilities,
          rawValue: '10.00',
        },
        netAssets: {
          path: SEC_NPORT_XML_PATHS.netAssets,
          rawValue: '990.00',
        },
      })
    }
  )

  it('preserves absent official facts as null', () => {
    const fund = { ...SEC_INTERNATIONAL_ETFS[0] }
    const parsed = parseSecNportXml(
      createMinimalNportXml({
        fund,
        filing: AUDITED_FILINGS.VOO!,
        totalAssets: null,
        totalLiabilities: null,
        netAssets: null,
      })
    )
    expect(parsed.totalAssets.rawValue).toBeNull()
    expect(parsed.totalLiabilities.rawValue).toBeNull()
    expect(parsed.netAssets.rawValue).toBeNull()
  })

  it('rejects malformed XML and an unexpected namespace', () => {
    expect(() => parseSecNportXml('<edgarSubmission>')).toThrow(
      'Malformed SEC N-PORT XML'
    )
    expect(() =>
      parseSecNportXml(
        createMinimalNportXml({
          fund: { ...SEC_INTERNATIONAL_ETFS[0] },
          filing: AUDITED_FILINGS.VOO!,
          namespace: 'https://example.invalid/nport',
        })
      )
    ).toThrow('Unexpected SEC N-PORT XML namespace')
  })

  it('rejects ambiguous facts and divergent header identity', () => {
    const fund = { ...SEC_INTERNATIONAL_ETFS[0] }
    const xml = createMinimalNportXml({
      fund,
      filing: AUDITED_FILINGS.VOO!,
    }).replace('</fundInfo>', '<totAssets>2.00</totAssets></fundInfo>')
    expect(() => parseSecNportXml(xml)).toThrow(
      'Ambiguous SEC N-PORT XML fact path'
    )
    expect(() =>
      parseSecNportXml(
        createMinimalNportXml({
          fund,
          filing: AUDITED_FILINGS.VOO!,
          headerSeriesId: 'S000000000',
        })
      )
    ).toThrow('header and form identities diverge')
  })

  it('allows multiple seriesClassInfo blocks for the same series', () => {
    const fund = { ...SEC_INTERNATIONAL_ETFS[0] }
    const parsed = parseSecNportXml(
      createMinimalNportXml({ fund, filing: AUDITED_FILINGS.VOO! })
    )

    expect(parsed.classIds).toEqual(AUDITED_CLASS_IDS.VOO)
    expect(parsed.classIds).toContain(fund.classId)
  })

  it('rejects duplicate, empty, invalid and cross-series class identities', () => {
    const fund = { ...SEC_INTERNATIONAL_ETFS[0] }
    const create = (classIds: readonly string[]) =>
      createMinimalNportXml({
        fund,
        filing: AUDITED_FILINGS.VOO!,
        classIds,
      })

    expect(() =>
      parseSecNportXml(create([fund.classId, fund.classId]))
    ).toThrow('duplicate class IDs')
    expect(() => parseSecNportXml(create(['']))).toThrow('official format')
    expect(() => parseSecNportXml(create(['not-a-class']))).toThrow(
      'official format'
    )
    expect(() =>
      parseSecNportXml(
        createMinimalNportXml({
          fund,
          filing: AUDITED_FILINGS.VOO!,
          seriesClassGroups: [
            { seriesId: fund.seriesId, classIds: [fund.classId] },
            { seriesId: 'S000099999', classIds: ['C000007773'] },
          ],
        })
      )
    ).toThrow('divergent values')
  })

  it('rejects unsupported forms and missing mandatory identity fields', () => {
    const fund = { ...SEC_INTERNATIONAL_ETFS[0] }
    expect(() =>
      parseSecNportXml(
        createMinimalNportXml({
          fund,
          filing: AUDITED_FILINGS.VOO!,
          form: 'NPORT-NP',
        })
      )
    ).toThrow('Unsupported SEC N-PORT form')
    expect(() =>
      parseSecNportXml(
        createMinimalNportXml({
          fund,
          filing: AUDITED_FILINGS.VOO!,
        }).replace('<regName>VANGUARD INDEX FUNDS</regName>', '')
      )
    ).toThrow('must occur exactly once')
  })
})
