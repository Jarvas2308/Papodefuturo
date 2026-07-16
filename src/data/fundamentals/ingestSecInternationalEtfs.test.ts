import { describe, expect, it, vi } from 'vitest'
import {
  buildSecPrimaryDocumentUrl,
  buildSecSubmissionsUrl,
} from './sec/nport/documents'
import { SEC_INTERNATIONAL_ETFS } from './sec/nport/etfs'
import {
  AUDITED_FILINGS,
  createMinimalNportXml,
  createSubmissionsJson,
} from './sec/nport/testFixtures'
import type { SecNportFetcher } from './sec/nport/types'
import { ingestSecInternationalEtfFundamentals } from './ingestSecInternationalEtfs'

describe('ingestSecInternationalEtfFundamentals', () => {
  it('loads and persists the closed universe through injected boundaries', async () => {
    const bodies = new Map<string, string>()
    for (const fund of SEC_INTERNATIONAL_ETFS) {
      const filing = AUDITED_FILINGS[fund.ticker]!
      bodies.set(
        buildSecSubmissionsUrl(fund.registrantCik),
        createSubmissionsJson([filing])
      )
      bodies.set(
        buildSecPrimaryDocumentUrl(fund.registrantCik, filing),
        createMinimalNportXml({ fund: { ...fund }, filing })
      )
    }
    const fetcher: SecNportFetcher = vi.fn(async (url) => ({
      ok: bodies.has(url),
      status: bodies.has(url) ? 200 : 404,
      text: async () => bodies.get(url) ?? '',
    }))
    const storage = { upsertMany: vi.fn(async () => undefined) }

    const records = await ingestSecInternationalEtfFundamentals({
      userAgent: 'PapoDeFuturo/1.0 contato@example.com',
      fetcher,
      storage,
    })

    expect(records.map((record) => record.ticker)).toEqual([
      'VOO',
      'VNQ',
      'VEA',
    ])
    expect(storage.upsertMany).toHaveBeenCalledOnce()
    expect(storage.upsertMany).toHaveBeenCalledWith(records)
    expect(fetcher).toHaveBeenCalledTimes(6)
  })
})
