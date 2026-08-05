import { describe, expect, it, vi } from 'vitest'
import { downloadShillerCapeArchive, SHILLER_CAPE_URL } from './archive'
import type { ShillerCapeFetcher } from './types'

describe('SHILLER_CAPE_URL', () => {
  it('points at the real Yale econ HTTP endpoint', () => {
    expect(SHILLER_CAPE_URL).toBe(
      'http://www.econ.yale.edu/~shiller/data/ie_data.xls'
    )
  })
})

describe('downloadShillerCapeArchive', () => {
  it('fetches the Shiller CAPE URL and returns the response body as an ArrayBuffer', async () => {
    const buffer = new ArrayBuffer(8)
    const fetcher: ShillerCapeFetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => buffer,
    })

    const result = await downloadShillerCapeArchive(fetcher)

    expect(fetcher).toHaveBeenCalledWith(SHILLER_CAPE_URL)
    expect(result).toBe(buffer)
  })

  it('throws with the HTTP status when the response is not ok', async () => {
    const fetcher: ShillerCapeFetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      arrayBuffer: async () => new ArrayBuffer(0),
    })

    await expect(downloadShillerCapeArchive(fetcher)).rejects.toThrow(
      'Failed to download Shiller CAPE data: HTTP 503'
    )
  })
})
