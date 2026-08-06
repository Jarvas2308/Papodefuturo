import { describe, expect, it, vi } from 'vitest'
import {
  createFredProvider,
  parseFredDfii10Percent,
  parseFredDfii10Rate,
  selectLatestFredObservation,
} from './fredProvider.ts'

describe('parseFredDfii10Percent', () => {
  it('scales a positive percent to 6 decimal places', () => {
    expect(parseFredDfii10Percent('1.85')).toBe(1_850_000)
  })

  it('scales a negative percent (real yield can go negative)', () => {
    expect(parseFredDfii10Percent('-0.35')).toBe(-350_000)
  })

  it('rounds half-away-from-zero on the discarded digit', () => {
    expect(parseFredDfii10Percent('1.8500005')).toBe(1_850_001)
  })

  it('throws on an unparseable value', () => {
    expect(() => parseFredDfii10Percent('.')).toThrow(/invalid format/)
  })
})

describe('selectLatestFredObservation', () => {
  it('picks the most recent date among several observations', () => {
    const selected = selectLatestFredObservation([
      { date: '2026-08-01', value: '1.80' },
      { date: '2026-08-04', value: '1.85' },
      { date: '2026-08-03', value: '1.82' },
    ])

    expect(selected).toEqual({ date: '2026-08-04', value: '1.85' })
  })

  it('skips missing observations marked with "."', () => {
    const selected = selectLatestFredObservation([
      { date: '2026-08-04', value: '.' },
      { date: '2026-08-03', value: '1.82' },
    ])

    expect(selected).toEqual({ date: '2026-08-03', value: '1.82' })
  })

  it('throws when every observation is missing', () => {
    expect(() =>
      selectLatestFredObservation([{ date: '2026-08-04', value: '.' }])
    ).toThrow(/Nenhuma observação/)
  })
})

describe('parseFredDfii10Rate', () => {
  it('builds a reference rate from the latest observation', () => {
    const rate = parseFredDfii10Rate({
      observations: [
        { date: '2026-08-03', value: '1.82' },
        { date: '2026-08-04', value: '1.85' },
      ],
    })

    expect(rate).toEqual({
      series: 'fred-dfii10',
      rateScaled: 1_850_000,
      rateScale: 1_000_000,
      pricedAt: '2026-08-04',
      source: 'fred',
    })
  })

  it('throws when the response has no observations', () => {
    expect(() => parseFredDfii10Rate({ observations: [] })).toThrow(
      /sem observações/
    )
    expect(() => parseFredDfii10Rate({})).toThrow(/sem observações/)
  })
})

describe('createFredProvider', () => {
  it('requests DFII10 with the api key and parses the latest observation', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        observations: [{ date: '2026-08-04', value: '1.85' }],
      }),
    })

    const provider = createFredProvider('secret-key', fetchMock as never)
    const rate = await provider.getDfii10Rate()

    expect(rate).toEqual({
      series: 'fred-dfii10',
      rateScaled: 1_850_000,
      rateScale: 1_000_000,
      pricedAt: '2026-08-04',
      source: 'fred',
    })

    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string)
    expect(requestedUrl.origin + requestedUrl.pathname).toBe(
      'https://api.stlouisfed.org/fred/series/observations'
    )
    expect(requestedUrl.searchParams.get('series_id')).toBe('DFII10')
    expect(requestedUrl.searchParams.get('api_key')).toBe('secret-key')
    expect(requestedUrl.searchParams.get('file_type')).toBe('json')
  })

  it('throws when FRED responds with a non-ok status', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 429 })
    const provider = createFredProvider('secret-key', fetchMock as never)

    await expect(provider.getDfii10Rate()).rejects.toThrow(/429/)
  })

  it('never leaks the api key in a thrown error message', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 403 })
    const provider = createFredProvider('super-secret-key', fetchMock as never)

    await expect(provider.getDfii10Rate()).rejects.toThrow(
      /^(?!.*super-secret-key).*$/
    )
  })
})
