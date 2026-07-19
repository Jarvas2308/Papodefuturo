import { describe, expect, it } from 'vitest'

import {
  buildSecEdgarFilingDetailUrl,
  buildSecEdgarSubmissionsUrl,
} from './urls'

describe('SEC EDGAR URL builders', () => {
  it('builds the canonical submissions URL from a 10-digit CIK', () => {
    expect(buildSecEdgarSubmissionsUrl({ registrantCik: '0000036405' })).toBe(
      'https://data.sec.gov/submissions/CIK0000036405.json'
    )
  })

  it.each(['36405', '0000000000', '00000364050', '00000364A5', ' 0000036405'])(
    'rejects non-canonical submissions CIK %j',
    (cik) =>
      expect(() =>
        buildSecEdgarSubmissionsUrl({ registrantCik: cik })
      ).toThrow()
  )

  it('derives the archive CIK only from the accession number', () => {
    expect(
      buildSecEdgarFilingDetailUrl({
        accessionNumber: '0000036405-26-000001',
      })
    ).toBe(
      'https://www.sec.gov/Archives/edgar/data/36405/000003640526000001/0000036405-26-000001-index.html'
    )
  })

  it.each([
    '0000036405-2026-000001',
    '0000036405-26-1',
    '0000000000-26-000001',
    '../0000036405-26-000001',
  ])('rejects invalid accession %j', (accession) => {
    expect(() =>
      buildSecEdgarFilingDetailUrl({ accessionNumber: accession })
    ).toThrow()
  })
})
