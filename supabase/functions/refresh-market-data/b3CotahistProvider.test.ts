import { describe, expect, it, vi } from 'vitest'
import {
  buildCotahistCandidateUrls,
  createB3CotahistProvider,
} from './b3CotahistProvider.ts'

function buildRecord(ticker: string, bdiCode: string, price: string): string {
  const record = Array<string>(245).fill(' ')
  const write = (offset: number, value: string) =>
    value.split('').forEach((character, index) => {
      record[offset + index] = character
    })

  write(0, '01')
  write(2, '20260714')
  write(10, bdiCode)
  write(12, ticker.padEnd(12, ' '))
  write(24, '010')
  write(108, price)
  return record.join('')
}

function response(ok: boolean): Response {
  return {
    ok,
    arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer),
  } as unknown as Response
}

describe('B3 COTAHIST provider', () => {
  it('builds deterministic official candidates from recent daily and monthly files', () => {
    const urls = buildCotahistCandidateUrls(
      new Date('2026-07-14T16:00:00.000Z')
    )
    expect(urls[0]?.toString()).toBe(
      'https://bvmf.bmfbovespa.com.br/InstDados/SerHist/COTAHIST_D14072026.ZIP'
    )
    expect(urls.at(-2)?.pathname).toContain('COTAHIST_M072026.ZIP')
    expect(urls.at(-1)?.pathname).toContain('COTAHIST_M062026.ZIP')
  })

  it('keeps the candidate list bounded', () => {
    expect(
      buildCotahistCandidateUrls(new Date('2026-07-14T16:00:00.000Z'))
    ).toHaveLength(9)
  })

  it('processes multiple requested tickers from one archive download', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(response(true))
    const extractText = vi
      .fn()
      .mockReturnValue(
        [
          buildRecord('BBAS3', '02', '0000000003817'),
          buildRecord('KNRI11', '12', '0000000014210'),
        ].join('\n')
      )
    const provider = createB3CotahistProvider({
      extractText,
      fetchImplementation,
      now: () => new Date('2026-07-14T16:00:00.000Z'),
    })

    await expect(provider.getAssetQuotes(['BBAS3', 'KNRI11'])).resolves.toEqual(
      [
        {
          ticker: 'BBAS3',
          currency: 'BRL',
          priceInMinorUnits: 3_817,
          pricedAt: '2026-07-14T21:00:00.000Z',
        },
        {
          ticker: 'KNRI11',
          currency: 'BRL',
          priceInMinorUnits: 14_210,
          pricedAt: '2026-07-14T21:00:00.000Z',
        },
      ]
    )
    expect(fetchImplementation).toHaveBeenCalledOnce()
    expect(extractText).toHaveBeenCalledOnce()
  })

  it('tries the next candidate when the first download is unavailable', async () => {
    const fetchImplementation = vi
      .fn()
      .mockResolvedValueOnce(response(false))
      .mockResolvedValueOnce(response(true))
    const provider = createB3CotahistProvider({
      extractText: () => buildRecord('BBAS3', '02', '0000000003817'),
      fetchImplementation,
    })

    await expect(provider.getAssetQuotes(['BBAS3'])).resolves.toHaveLength(1)
    expect(fetchImplementation).toHaveBeenCalledTimes(2)
  })

  it('rejects invalid ZIP content and can continue to a valid candidate', async () => {
    const extractText = vi
      .fn()
      .mockRejectedValueOnce(new Error('invalid zip'))
      .mockReturnValueOnce(buildRecord('BBAS3', '02', '0000000003817'))
    const provider = createB3CotahistProvider({
      extractText,
      fetchImplementation: vi.fn().mockResolvedValue(response(true)),
    })

    await expect(provider.getAssetQuotes(['BBAS3'])).resolves.toHaveLength(1)
    expect(extractText).toHaveBeenCalledTimes(2)
  })

  it('rejects the refresh when every candidate contains an invalid ZIP', async () => {
    const extractText = vi.fn().mockRejectedValue(new Error('invalid zip'))
    const provider = createB3CotahistProvider({
      extractText,
      fetchImplementation: vi.fn().mockResolvedValue(response(true)),
    })

    await expect(provider.getAssetQuotes(['BBAS3'])).rejects.toThrow(
      'B3 COTAHIST indisponível'
    )
    expect(extractText).toHaveBeenCalledTimes(9)
  })

  it('returns only requested tickers', async () => {
    const provider = createB3CotahistProvider({
      extractText: () =>
        [
          buildRecord('BBAS3', '02', '0000000003817'),
          buildRecord('ITSA4', '02', '0000000001200'),
        ].join('\n'),
      fetchImplementation: vi.fn().mockResolvedValue(response(true)),
    })

    await expect(provider.getAssetQuotes(['BBAS3'])).resolves.toEqual([
      expect.objectContaining({ ticker: 'BBAS3', currency: 'BRL' }),
    ])
  })

  it('returns an empty result without downloading when no ticker is requested', async () => {
    const fetchImplementation = vi.fn()
    const provider = createB3CotahistProvider({
      extractText: vi.fn(),
      fetchImplementation,
    })
    await expect(provider.getAssetQuotes([])).resolves.toEqual([])
    expect(fetchImplementation).not.toHaveBeenCalled()
  })

  it('fails with a sanitized message after exhausting candidates', async () => {
    const provider = createB3CotahistProvider({
      extractText: vi.fn(),
      fetchImplementation: vi.fn().mockResolvedValue(response(false)),
    })
    await expect(provider.getAssetQuotes(['BBAS3'])).rejects.toThrow(
      'B3 COTAHIST indisponível'
    )
  })
})
