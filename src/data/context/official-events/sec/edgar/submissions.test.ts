import { describe, expect, it } from 'vitest'

import { parseSecEdgarSubmissionsJson } from './submissions'
import {
  createRecentFiling,
  createSubmissionsJson,
  TEST_IDENTITIES,
} from './testFixtures'

function parse(
  jsonText: string,
  expectedRegistrantCik: string = TEST_IDENTITIES[0].cik
) {
  return parseSecEdgarSubmissionsJson({ jsonText, expectedRegistrantCik })
}

describe('SEC EDGAR submissions parser', () => {
  it('parses aligned recent arrays and preserves the source index', () => {
    const filings = [
      createRecentFiling(),
      createRecentFiling({
        sourceIndex: 1,
        accessionNumber: '0000036405-26-000002',
        isXbrlNumeric: 1,
      }),
    ]
    const parsed = parse(createSubmissionsJson(0, filings))
    expect(parsed.registrantCik).toBe(TEST_IDENTITIES[0].cik)
    expect(parsed.recentFilings.map((filing) => filing.sourceIndex)).toEqual([
      0, 1,
    ])
    expect(parsed.recentFilings[1].isXbrlNumeric).toBe(1)
  })

  it('allows unknown root and recent fields without leaking them', () => {
    const value = JSON.parse(createSubmissionsJson())
    value.unknown = 'ignored'
    value.filings.recent.futureField = ['ignored']
    expect(parse(JSON.stringify(value))).not.toHaveProperty('unknown')
  })

  it('accepts an absent optional isXBRLNumeric array as null', () => {
    const value = JSON.parse(createSubmissionsJson())
    delete value.filings.recent.isXBRLNumeric
    expect(
      parse(JSON.stringify(value)).recentFilings[0].isXbrlNumeric
    ).toBeNull()
  })

  it('rejects a numeric root CIK without coercion', () => {
    const value = JSON.parse(createSubmissionsJson())
    value.cik = 36_405
    expect(() => parse(JSON.stringify(value))).toThrow(/string/)
  })

  it('parses the closed historical file contract', () => {
    const parsed = parse(
      createSubmissionsJson(0, undefined, [
        {
          name: 'CIK0000036405-submissions-001.json',
          filingCount: 100,
          filingFrom: '2010-01-01',
          filingTo: '2019-12-31',
        },
      ])
    )
    expect(parsed.historicalFiles).toEqual([
      {
        name: 'CIK0000036405-submissions-001.json',
        filingCount: 100,
        filingFrom: '2010-01-01',
        filingTo: '2019-12-31',
      },
    ])
  })

  it('rejects a mismatched root CIK', () => {
    expect(() =>
      parse(createSubmissionsJson(0), TEST_IDENTITIES[1].cik)
    ).toThrow(/diverges/)
  })

  it('rejects invalid JSON and non-object roots', () => {
    expect(() => parse('{')).toThrow(/valid JSON/)
    expect(() => parse('[]')).toThrow(/plain object/)
  })

  it('rejects arrays with divergent lengths', () => {
    const value = JSON.parse(createSubmissionsJson())
    value.filings.recent.form = []
    expect(() => parse(JSON.stringify(value))).toThrow(/not aligned/)
  })

  it('rejects sparse JSON array syntax instead of normalizing it', () => {
    const jsonText = createSubmissionsJson().replace(
      '"size":[12345]',
      '"size":[,]'
    )
    expect(() => parse(jsonText)).toThrow(/valid JSON/)
  })

  it.each(['-0', '1.5', '1e309'])(
    'rejects non-canonical or unsafe numeric value %s',
    (value) => {
      const jsonText = createSubmissionsJson().replace(
        '"size":[12345]',
        `"size":[${value}]`
      )
      expect(() => parse(jsonText)).toThrow(/safe integer/)
    }
  )

  it('preserves duplicate accessions and their original order', () => {
    const duplicate = createRecentFiling()
    const parsed = parse(
      createSubmissionsJson(0, [duplicate, { ...duplicate, sourceIndex: 1 }])
    )
    expect(parsed.recentFilings).toHaveLength(2)
    expect(parsed.recentFilings.map((filing) => filing.sourceIndex)).toEqual([
      0, 1,
    ])
  })

  it('rejects more than 2,000 recent filings', () => {
    const filings = Array.from({ length: 2_001 }, (_, sourceIndex) =>
      createRecentFiling({ sourceIndex })
    )
    expect(() => parse(createSubmissionsJson(0, filings))).toThrow(
      /supported limit/
    )
  })

  it('rejects more than ten historical files', () => {
    const files = Array.from({ length: 11 }, (_, index) => ({
      name: `CIK0000036405-submissions-${String(index).padStart(3, '0')}.json`,
      filingCount: 1,
      filingFrom: '2020-01-01',
      filingTo: '2020-12-31',
    }))
    expect(() => parse(createSubmissionsJson(0, [], files))).toThrow(
      /supported limit/
    )
  })

  it.each([
    ['filingDate', '2026-02-30'],
    ['reportDate', '2026-13-01'],
    ['acceptanceDateTime', '2026-05-28T16:39:55Z'],
    ['acceptanceDateTime', '2026-05-28T16:39:55.1234Z'],
    ['acceptanceDateTime', '2026-05-28T16:39:55.123-03:00'],
    ['acceptanceDateTime', '2026-05-28T24:00:00.000Z'],
    ['acceptanceDateTime', '2026-04-31T16:39:55.000Z'],
    ['acceptanceDateTime', '1900-02-29T16:39:55.000Z'],
    ['acceptanceDateTime', '2100-02-29T16:39:55.000Z'],
    ['form', ' NPORT-P'],
  ])('rejects invalid strict filing field %s', (field, invalidValue) => {
    const value = JSON.parse(createSubmissionsJson())
    value.filings.recent[field][0] = invalidValue
    expect(() => parse(JSON.stringify(value))).toThrow()
  })

  it('accepts the Gregorian leap date in year 2000', () => {
    const value = JSON.parse(createSubmissionsJson())
    value.filings.recent.acceptanceDateTime[0] = '2000-02-29T16:39:55.000Z'
    expect(
      parse(JSON.stringify(value)).recentFilings[0].acceptanceDateTime
    ).toBe('2000-02-29T16:39:55.000Z')
  })

  it.each([
    '2026-00-01',
    '2026-01-00',
    '2026-04-31',
    '2026-06-31',
    '2026-09-31',
    '2026-11-31',
  ])('rejects impossible filing civil date %s', (filingDate) => {
    const value = JSON.parse(createSubmissionsJson())
    value.filings.recent.filingDate[0] = filingDate
    expect(() => parse(JSON.stringify(value))).toThrow(/filingDate/)
  })

  it('returns normalized objects independent across parses', () => {
    const payload = createSubmissionsJson()
    const first = parse(payload)
    first.recentFilings[0].form = 'mutated'
    const second = parse(payload)
    expect(second.recentFilings[0].form).toBe('NPORT-P')
    expect(second.historicalFiles).toEqual([])
  })

  it.each([
    '../CIK0000036405-submissions-001.json',
    'ＣＩＫ0000036405-submissions-001.json',
    'CIK0000036405-submissions-1.json',
  ])('rejects unsafe historical filename %j', (name) => {
    expect(() =>
      parse(
        createSubmissionsJson(0, undefined, [
          {
            name,
            filingCount: 1,
            filingFrom: '2020-01-01',
            filingTo: '2020-12-31',
          },
        ])
      )
    ).toThrow(/safe SEC basename/)
  })
})
