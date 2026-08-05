import { describe, expect, it, vi } from 'vitest'
import * as XLSX from 'xlsx'
import { ingestShillerCapeFundamentals } from './ingestShillerCape'
import type { ShillerCapeFetcher } from './shiller/types'
import type { ShillerCapeSnapshotStorage } from './supabaseShillerCapeSnapshots'

const HEADER_ROW = [
  'Date',
  'S&P Comp.',
  'Dividend',
  'Earnings',
  'CPI',
  'Fraction',
  'Long Rate',
  'Real Price',
  'Real Dividend',
  'Real Earnings',
  'CAPE',
]

function buildArchiveBuffer(): ArrayBuffer {
  const workbook = XLSX.utils.book_new()
  const sheet = XLSX.utils.aoa_to_sheet([
    HEADER_ROW,
    [2020.01, 1, 1, 1, 1, 1, 1, 1, 1, 1, 30.123456],
  ])
  XLSX.utils.book_append_sheet(workbook, sheet, 'Data')
  return XLSX.write(workbook, { type: 'array', bookType: 'xls' }) as ArrayBuffer
}

describe('ingestShillerCapeFundamentals', () => {
  it('downloads, extracts, persists and returns the single latest CAPE record', async () => {
    const buffer = buildArchiveBuffer()
    const fetcher: ShillerCapeFetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => buffer,
    })
    const upsertMany = vi.fn().mockResolvedValue(undefined)
    const storage: ShillerCapeSnapshotStorage = { upsertMany }

    const records = await ingestShillerCapeFundamentals({ storage, fetcher })

    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({
      series: 'shiller-cape-sp500',
      source: 'shiller-yale',
      referenceDate: '2020-01-01',
      valueScaled: 30_123_456,
    })
    expect(upsertMany).toHaveBeenCalledWith(records)
  })

  it('propagates a download failure without calling storage', async () => {
    const fetcher: ShillerCapeFetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      arrayBuffer: async () => new ArrayBuffer(0),
    })
    const upsertMany = vi.fn()
    const storage: ShillerCapeSnapshotStorage = { upsertMany }

    await expect(
      ingestShillerCapeFundamentals({ storage, fetcher })
    ).rejects.toThrow('Failed to download Shiller CAPE data: HTTP 500')
    expect(upsertMany).not.toHaveBeenCalled()
  })
})
