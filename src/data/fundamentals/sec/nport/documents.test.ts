import { describe, expect, it, vi } from 'vitest'
import {
  assertValidSecUserAgent,
  buildSecHistoricalSubmissionsUrl,
  buildSecPrimaryDocumentUrl,
  buildSecSubmissionsUrl,
  downloadSecPrimaryDocumentXml,
  downloadSecSubmissionsJson,
} from './documents'
import { AUDITED_FILINGS } from './testFixtures'
import type { SecNportFetcher } from './types'

describe('SEC N-PORT documents', () => {
  it('builds official submissions, history and archive URLs', () => {
    expect(buildSecSubmissionsUrl('0000036405')).toBe(
      'https://data.sec.gov/submissions/CIK0000036405.json'
    )
    expect(
      buildSecHistoricalSubmissionsUrl('CIK0000036405-submissions-001.json')
    ).toBe(
      'https://data.sec.gov/submissions/CIK0000036405-submissions-001.json'
    )
    expect(buildSecPrimaryDocumentUrl('0000036405', AUDITED_FILINGS.VOO!)).toBe(
      'https://www.sec.gov/Archives/edgar/data/36405/000003640526000325/primary_doc.xml'
    )
  })

  it('requires application identity and contact in User-Agent', () => {
    expect(() => assertValidSecUserAgent('')).toThrow('SEC User-Agent')
    expect(() => assertValidSecUserAgent('PapoDeFuturo/1.0')).toThrow(
      'SEC User-Agent'
    )
    expect(() =>
      assertValidSecUserAgent('PapoDeFuturo/1.0 contato@example.com')
    ).not.toThrow()
  })

  it('sends explicit SEC headers through the injected fetcher', async () => {
    const fetcher = vi.fn(async (...request: Parameters<SecNportFetcher>) => {
      void request
      return {
        ok: true,
        status: 200,
        text: async () => '{}',
      }
    })
    await downloadSecSubmissionsJson({
      registrantCik: '0000036405',
      userAgent: 'PapoDeFuturo/1.0 contato@example.com',
      fetcher,
    })
    await downloadSecPrimaryDocumentXml({
      registrantCik: '0000036405',
      filing: AUDITED_FILINGS.VOO!,
      userAgent: 'PapoDeFuturo/1.0 contato@example.com',
      fetcher,
    })

    expect(fetcher.mock.calls[0]?.[1].headers).toEqual({
      'User-Agent': 'PapoDeFuturo/1.0 contato@example.com',
      'Accept-Encoding': 'gzip, deflate',
      Accept: 'application/json',
    })
    expect(fetcher.mock.calls[1]?.[1].headers.Accept).toBe(
      'application/xml, text/xml'
    )
  })

  it('reports HTTP failures without retrying', async () => {
    const fetcher = vi.fn(async (...request: Parameters<SecNportFetcher>) => {
      void request
      return {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: async () => '',
      }
    })
    await expect(
      downloadSecSubmissionsJson({
        registrantCik: '0000036405',
        userAgent: 'PapoDeFuturo/1.0 contato@example.com',
        fetcher,
      })
    ).rejects.toThrow('HTTP 429 Too Many Requests')
    expect(fetcher).toHaveBeenCalledOnce()
  })
})
