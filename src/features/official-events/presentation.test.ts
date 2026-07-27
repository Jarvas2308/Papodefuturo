import { describe, expect, it } from 'vitest'
import { createStorageTestEvent } from '../../data/context/official-events/storage/testFixtures'
import {
  EMPTY_OFFICIAL_EVENTS_FILTERS,
  OFFICIAL_EVENT_SOURCES,
  OFFICIAL_EVENT_STATUSES,
  OFFICIAL_EVENT_TICKER_GROUPS,
  OFFICIAL_EVENT_TYPES,
  formatOfficialEventTemporal,
  getOfficialEventSourceLabel,
  getOfficialEventStatusLabel,
  getOfficialEventTypeLabel,
  getSafeOfficialDocumentUrl,
  hasOfficialEventsFilters,
  isOfficialEventsDateRangeValid,
} from './presentation'

describe('official events presentation mappings', () => {
  it('maps the closed 12-asset universe without free tickers', () => {
    expect(
      OFFICIAL_EVENT_TICKER_GROUPS.flatMap((group) => group.tickers)
    ).toEqual([
      'BBAS3',
      'ITSA4',
      'TAEE11',
      'WEGE3',
      'PSSA3',
      'KNRI11',
      'VISC11',
      'XPLG11',
      'HGRU11',
      'VOO',
      'VNQ',
      'VEA',
    ])
  })

  it('maps all three sources exhaustively', () => {
    expect(OFFICIAL_EVENT_SOURCES.map(({ value }) => value)).toEqual([
      'cvm-ipe',
      'cvm-fund-delivery',
      'sec-edgar',
    ])
    expect(getOfficialEventSourceLabel('cvm-ipe')).toBe('CVM — Empresas')
    expect(getOfficialEventSourceLabel('cvm-fund-delivery')).toBe(
      'CVM — Fundos'
    )
    expect(getOfficialEventSourceLabel('sec-edgar')).toBe('SEC EDGAR')
  })

  it('maps all five statuses exhaustively', () => {
    expect(OFFICIAL_EVENT_STATUSES).toHaveLength(5)
    expect(getOfficialEventStatusLabel('original')).toBe('Original')
    expect(getOfficialEventStatusLabel('amendment')).toBe('Retificação')
    expect(getOfficialEventStatusLabel('correction')).toBe('Correção')
    expect(getOfficialEventStatusLabel('replacement')).toBe('Substituição')
    expect(getOfficialEventStatusLabel('cancellation')).toBe('Cancelamento')
  })

  it('maps all 15 event types without exposing raw enums', () => {
    expect(OFFICIAL_EVENT_TYPES).toHaveLength(15)
    for (const option of OFFICIAL_EVENT_TYPES) {
      expect(getOfficialEventTypeLabel(option.value)).toBe(option.label)
      expect(option.label).not.toBe(option.value)
    }
    expect(getOfficialEventTypeLabel('other-official-event')).toBe(
      'Outro evento oficial'
    )
  })
})

describe('official event temporal formatting', () => {
  it('formats a civil date without inventing midnight or timezone', () => {
    expect(
      formatOfficialEventTemporal({
        precision: 'date',
        date: '2024-02-29',
        raw: '2024-02-29',
      })
    ).toBe('29/02/2024')
  })

  it('formats minute and second instants in UTC without local conversion', () => {
    expect(
      formatOfficialEventTemporal({
        precision: 'minute',
        instantUtc: '2026-05-29T00:02:00Z',
        raw: '2026-05-28T21:02-03:00',
        sourceOffset: '-03:00',
      })
    ).toBe('29/05/2026 00:02 UTC')
    expect(
      formatOfficialEventTemporal({
        precision: 'second',
        instantUtc: '2026-05-28T16:39:55.123456789Z',
        raw: '2026-05-28T16:39:55.123456789Z',
        sourceOffset: 'Z',
      })
    ).toBe('28/05/2026 16:39:55 UTC')
  })

  it('represents missing and unknown occurrence explicitly', () => {
    expect(formatOfficialEventTemporal(null)).toBe('Data não informada')
    expect(
      formatOfficialEventTemporal({ precision: 'unknown', raw: 'sem data' })
    ).toBe('Data não informada')
  })
})

describe('official document links and filters', () => {
  it('prefers canonical URL and accepts only current audited HTTPS hosts', () => {
    expect(
      getSafeOfficialDocumentUrl({
        canonicalUrl: 'https://www.sec.gov/Archives/document.html',
        originalUrl: 'https://www.rad.cvm.gov.br/documento',
      })
    ).toBe('https://www.sec.gov/Archives/document.html')
    expect(
      getSafeOfficialDocumentUrl({
        canonicalUrl: null,
        originalUrl: 'https://www.rad.cvm.gov.br/documento',
      })
    ).toBe('https://www.rad.cvm.gov.br/documento')
  })

  it.each([
    'http://www.sec.gov/Archives/document.html',
    'https://www.sec.gov.evil.example/document.html',
    'https://user:secret@www.sec.gov/document.html',
    'https://localhost/document.html',
    'javascript:alert(1)',
  ])('rejects unsafe presentation URL %s', (url) => {
    expect(
      getSafeOfficialDocumentUrl({ canonicalUrl: url, originalUrl: null })
    ).toBeNull()
  })

  it('keeps absence of URL explicit', () => {
    const event = createStorageTestEvent({
      ticker: 'KNRI11',
      source: 'cvm-fund-delivery',
    })
    expect(getSafeOfficialDocumentUrl(event)).toBeNull()
  })

  it('detects active filters and invalid civil ranges', () => {
    expect(hasOfficialEventsFilters(EMPTY_OFFICIAL_EVENTS_FILTERS)).toBe(false)
    expect(
      hasOfficialEventsFilters({
        ...EMPTY_OFFICIAL_EVENTS_FILTERS,
        tickers: ['BBAS3'],
      })
    ).toBe(true)
    expect(
      isOfficialEventsDateRangeValid({
        ...EMPTY_OFFICIAL_EVENTS_FILTERS,
        publishedFrom: '2026-07-20',
        publishedTo: '2026-07-19',
      })
    ).toBe(false)
  })
})
