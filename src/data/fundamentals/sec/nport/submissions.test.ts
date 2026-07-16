import { describe, expect, it } from 'vitest'
import {
  createHistoricalJson,
  createSubmissionsJson,
  AUDITED_FILINGS,
} from './testFixtures'
import {
  mergeSecNportFilings,
  parseSecHistoricalFilingsJson,
  parseSecSubmissionsJson,
  rankSecNportFilings,
} from './submissions'
import type { SecNportFiling } from './types'

const base = AUDITED_FILINGS.VOO!

function filing(overrides: Partial<SecNportFiling>): SecNportFiling {
  return { ...base, ...overrides }
}

describe('SEC submissions parser', () => {
  it('parses recent and historical NPORT-P/NPORT-P/A columns', () => {
    const amendment = filing({
      form: 'NPORT-P/A',
      accessionNumber: '0000036405-26-000326',
      acceptedAt: '2026-05-29T10:00:00.000Z',
    })
    const parsed = parseSecSubmissionsJson(
      createSubmissionsJson(
        [base, amendment],
        ['CIK0000036405-submissions-001.json']
      )
    )

    expect(parsed.filings).toEqual([base, amendment])
    expect(parsed.historicalFiles).toEqual([
      { name: 'CIK0000036405-submissions-001.json' },
    ])
    expect(parseSecHistoricalFilingsJson(createHistoricalJson([base]))).toEqual(
      [base]
    )
  })

  it('ignores unsupported forms in the mixed SEC response', () => {
    const json = JSON.parse(createSubmissionsJson([base]))
    json.filings.recent.form.push('10-K')
    for (const field of [
      'accessionNumber',
      'filingDate',
      'acceptanceDateTime',
      'reportDate',
      'primaryDocument',
    ]) {
      json.filings.recent[field].push('')
    }
    expect(parseSecSubmissionsJson(JSON.stringify(json)).filings).toEqual([
      base,
    ])
  })

  it('rejects invalid JSON, accession, dates and primary document', () => {
    expect(() => parseSecSubmissionsJson('{')).toThrow(
      'Invalid SEC submissions JSON'
    )
    expect(() =>
      parseSecSubmissionsJson(
        createSubmissionsJson([filing({ accessionNumber: 'bad' })])
      )
    ).toThrow('Invalid SEC N-PORT accession number')
    expect(() =>
      parseSecSubmissionsJson(
        createSubmissionsJson([filing({ reportDate: '2026-02-30' })])
      )
    ).toThrow('Invalid SEC N-PORT report date')
    expect(() =>
      parseSecSubmissionsJson(
        createSubmissionsJson([filing({ filingDate: '2026-02-30' })])
      )
    ).toThrow('Invalid SEC N-PORT filing date')
    expect(() =>
      parseSecSubmissionsJson(
        createSubmissionsJson([filing({ acceptedAt: 'not-a-timestamp' })])
      )
    ).toThrow('Invalid SEC N-PORT acceptedAt')
    expect(() =>
      parseSecSubmissionsJson(
        createSubmissionsJson([filing({ primaryDocument: '' })])
      )
    ).toThrow('primaryDocument')
  })
})

describe('rankSecNportFilings', () => {
  it('prioritizes latest report, later amendment, acceptedAt and accession', () => {
    const olderReport = filing({
      reportDate: '2025-12-31',
      accessionNumber: '0000036405-26-000063',
      acceptedAt: '2026-02-26T16:15:30.000Z',
    })
    const original = filing({
      accessionNumber: '0000036405-26-000323',
      acceptedAt: '2026-05-28T16:39:53.000Z',
    })
    const amendment = filing({
      form: 'NPORT-P/A',
      accessionNumber: '0000036405-26-000326',
      acceptedAt: '2026-05-29T10:00:00.000Z',
    })
    const accessionTieBreak = filing({
      form: 'NPORT-P/A',
      accessionNumber: '0000036405-26-000327',
      acceptedAt: amendment.acceptedAt,
    })

    expect(
      rankSecNportFilings([
        olderReport,
        original,
        amendment,
        accessionTieBreak,
      ]).map((item) => item.accessionNumber)
    ).toEqual([
      '0000036405-26-000327',
      '0000036405-26-000326',
      '0000036405-26-000323',
      '0000036405-26-000063',
    ])
  })

  it('does not mutate the source filing array', () => {
    const input = [base, filing({ reportDate: '2025-12-31' })]
    const before = structuredClone(input)
    rankSecNportFilings(input)
    expect(input).toEqual(before)
  })

  it('uses acceptedAt before form type and amendment on an exact time tie', () => {
    const laterOriginal = filing({
      form: 'NPORT-P',
      accessionNumber: '0000036405-26-000329',
      acceptedAt: '2026-05-30T10:00:00.000Z',
    })
    const earlierAmendment = filing({
      form: 'NPORT-P/A',
      accessionNumber: '0000036405-26-000328',
      acceptedAt: '2026-05-29T10:00:00.000Z',
    })
    const tiedOriginal = filing({
      form: 'NPORT-P',
      accessionNumber: '0000036405-26-000330',
      acceptedAt: '2026-05-31T10:00:00.000Z',
    })
    const tiedAmendment = filing({
      form: 'NPORT-P/A',
      accessionNumber: '0000036405-26-000329',
      acceptedAt: tiedOriginal.acceptedAt,
    })

    expect(
      rankSecNportFilings([earlierAmendment, laterOriginal])[0]?.form
    ).toBe('NPORT-P')
    expect(rankSecNportFilings([tiedOriginal, tiedAmendment])[0]?.form).toBe(
      'NPORT-P/A'
    )

    const exactSecond = filing({
      accessionNumber: '0000036405-26-000331',
      acceptedAt: '2026-05-31T10:00:00Z',
    })
    const fractionalSecond = filing({
      accessionNumber: '0000036405-26-000332',
      acceptedAt: '2026-05-31T10:00:00.1Z',
    })
    expect(
      rankSecNportFilings([exactSecond, fractionalSecond])[0]?.accessionNumber
    ).toBe(fractionalSecond.accessionNumber)
  })
})

describe('mergeSecNportFilings', () => {
  it('deduplicates the same accession across recent and historical filings', () => {
    expect(mergeSecNportFilings([[base], [{ ...base }]])).toEqual([base])
  })

  it('rejects divergent metadata for a duplicated accession', () => {
    expect(() =>
      mergeSecNportFilings([[base], [{ ...base, reportDate: '2026-02-28' }]])
    ).toThrow('Divergent SEC N-PORT metadata')
  })
})
