import { describe, expect, it, vi } from 'vitest'
import {
  buildSecArchiveDocumentUrlV1,
  buildSecSubmissionsUrlV1,
  fetchEtfDistributionValueRowV1,
  readRecentAnnualReportFilingsV1,
} from './fetchEtfDistributionValueRowV1'
import { findEtfNcsrFundIdentityV1 } from './etfNcsrFundIdentityV1'
import { VNQ_ETF_SHARES_FINANCIAL_HIGHLIGHTS_TEXT_V1 } from './testFixtures'

const VNQ_IDENTITY = findEtfNcsrFundIdentityV1('VNQ')!
const USER_AGENT = 'PapoDeFuturo/1.0 (contato@exemplo.com)'

// Forma real do índice `filings.recent` de data.sec.gov, com os valores
// reais observados para o CIK 0000734383 em 07/08/2026.
const SUBMISSIONS = {
  filings: {
    recent: {
      form: ['NPORT-P', 'N-CSR', 'N-CSRS'],
      filingDate: ['2026-05-29', '2026-03-27', '2025-09-26'],
      accessionNumber: [
        '0001752724-26-100001',
        '0001104659-26-036013',
        '0001104659-25-090000',
      ],
      primaryDocument: [
        'primary_doc.xml',
        'tm265717d2_ncsr.htm',
        'tm2519836d2_ncsrs.htm',
      ],
    },
  },
}

function jsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    arrayBuffer: async () =>
      new TextEncoder().encode(JSON.stringify(body)).buffer,
  } as unknown as Response
}

function htmlResponse(html: string) {
  return {
    ok: true,
    status: 200,
    arrayBuffer: async () => new TextEncoder().encode(html).buffer,
  } as unknown as Response
}

describe('buildSecSubmissionsUrlV1 / buildSecArchiveDocumentUrlV1', () => {
  it('builds the real submissions and archive URLs of the VNQ filing', () => {
    expect(buildSecSubmissionsUrlV1('0000734383')).toBe(
      'https://data.sec.gov/submissions/CIK0000734383.json'
    )
    expect(
      buildSecArchiveDocumentUrlV1({
        registrantCik: '0000734383',
        accessionNumber: '0001104659-26-036013',
        primaryDocument: 'tm265717d2_ncsr.htm',
      })
    ).toBe(
      'https://www.sec.gov/Archives/edgar/data/734383/000110465926036013/tm265717d2_ncsr.htm'
    )
  })

  it('rejects a malformed CIK, accession or document name', () => {
    expect(() => buildSecSubmissionsUrlV1('734383')).toThrow()
    expect(() =>
      buildSecArchiveDocumentUrlV1({
        registrantCik: '0000734383',
        accessionNumber: 'not-an-accession',
        primaryDocument: 'a.htm',
      })
    ).toThrow()
    expect(() =>
      buildSecArchiveDocumentUrlV1({
        registrantCik: '0000734383',
        accessionNumber: '0001104659-26-036013',
        primaryDocument: '../../etc/passwd',
      })
    ).toThrow()
  })
})

describe('readRecentAnnualReportFilingsV1', () => {
  it('keeps only annual reports, newest first', () => {
    expect(readRecentAnnualReportFilingsV1(SUBMISSIONS)).toEqual([
      {
        form: 'N-CSR',
        filingDate: '2026-03-27',
        accessionNumber: '0001104659-26-036013',
        primaryDocument: 'tm265717d2_ncsr.htm',
      },
    ])
  })

  it('ignores the semi-annual N-CSRS (half a fiscal year is not comparable)', () => {
    const entries = readRecentAnnualReportFilingsV1(SUBMISSIONS)!
    expect(entries.some((entry) => entry.form === 'N-CSRS')).toBe(false)
  })

  it('fails closed when the columnar index is inconsistent', () => {
    expect(
      readRecentAnnualReportFilingsV1({
        filings: {
          recent: {
            form: ['N-CSR'],
            filingDate: [],
            accessionNumber: ['0001104659-26-036013'],
            primaryDocument: ['a.htm'],
          },
        },
      })
    ).toBeNull()
    expect(readRecentAnnualReportFilingsV1({})).toBeNull()
    expect(readRecentAnnualReportFilingsV1(null)).toBeNull()
  })
})

describe('fetchEtfDistributionValueRowV1', () => {
  it('picks the first filing whose document really contains the fund block', async () => {
    const decoy = { ...SUBMISSIONS }
    decoy.filings.recent.form = ['N-CSR', 'N-CSR']
    decoy.filings.recent.filingDate = ['2026-03-27', '2026-03-27']
    decoy.filings.recent.accessionNumber = [
      '0001104659-26-036012',
      '0001104659-26-036013',
    ]
    decoy.filings.recent.primaryDocument = ['other.htm', 'tm265717d2_ncsr.htm']

    const fetchImplementation = vi.fn(async (url: string | URL | Request) => {
      const href = String(url)
      if (href.includes('data.sec.gov')) return jsonResponse(decoy)
      if (href.includes('other.htm')) {
        return htmlResponse('<td>7 Global Capital Cycles Fund</td>')
      }
      return htmlResponse(
        `<td>${VNQ_ETF_SHARES_FINANCIAL_HIGHLIGHTS_TEXT_V1}</td>`
      )
    }) as unknown as typeof fetch

    const row = await fetchEtfDistributionValueRowV1(
      { identity: VNQ_IDENTITY, userAgent: USER_AGENT },
      fetchImplementation
    )

    expect(row).toMatchObject({
      ticker: 'VNQ',
      accession_number: '0001104659-26-036013',
      fiscal_year_end_date: '2026-01-31',
      total_distributions_per_share_unscaled: 3472,
    })
  })

  it('returns null when no inspected filing contains the fund block', async () => {
    const fetchImplementation = vi.fn(async (url: string | URL | Request) =>
      String(url).includes('data.sec.gov')
        ? jsonResponse(SUBMISSIONS)
        : htmlResponse('<td>7 Global Capital Cycles Fund</td>')
    ) as unknown as typeof fetch

    await expect(
      fetchEtfDistributionValueRowV1(
        { identity: VNQ_IDENTITY, userAgent: USER_AGENT },
        fetchImplementation
      )
    ).resolves.toBeNull()
  })

  it('sends an identifiable User-Agent on every SEC request (fair access)', async () => {
    const fetchImplementation = vi.fn(async (url: string | URL | Request) =>
      String(url).includes('data.sec.gov')
        ? jsonResponse(SUBMISSIONS)
        : htmlResponse(
            `<td>${VNQ_ETF_SHARES_FINANCIAL_HIGHLIGHTS_TEXT_V1}</td>`
          )
    ) as unknown as typeof fetch

    await fetchEtfDistributionValueRowV1(
      { identity: VNQ_IDENTITY, userAgent: USER_AGENT },
      fetchImplementation
    )

    for (const call of vi.mocked(fetchImplementation).mock.calls) {
      expect(
        (call[1] as RequestInit & { headers: Record<string, string> }).headers[
          'User-Agent'
        ]
      ).toBe(USER_AGENT)
    }
  })

  it('waits between document requests when a delay is injected', async () => {
    const delay = vi.fn(async () => {})
    const fetchImplementation = vi.fn(async (url: string | URL | Request) =>
      String(url).includes('data.sec.gov')
        ? jsonResponse(SUBMISSIONS)
        : htmlResponse(
            `<td>${VNQ_ETF_SHARES_FINANCIAL_HIGHLIGHTS_TEXT_V1}</td>`
          )
    ) as unknown as typeof fetch

    await fetchEtfDistributionValueRowV1(
      { identity: VNQ_IDENTITY, userAgent: USER_AGENT, delay },
      fetchImplementation
    )

    expect(delay).toHaveBeenCalledWith(500)
  })

  it('rejects a non-SEC host', async () => {
    const fetchImplementation = vi.fn(async () =>
      jsonResponse(SUBMISSIONS)
    ) as unknown as typeof fetch

    await expect(
      fetchEtfDistributionValueRowV1(
        {
          identity: { ...VNQ_IDENTITY, registrantCik: '000073438x' },
          userAgent: USER_AGENT,
        },
        fetchImplementation
      )
    ).rejects.toThrow()
  })

  it('propagates a non-OK SEC response instead of writing a partial row', async () => {
    const fetchImplementation = vi.fn(async () => ({
      ok: false,
      status: 403,
    })) as unknown as typeof fetch

    await expect(
      fetchEtfDistributionValueRowV1(
        { identity: VNQ_IDENTITY, userAgent: USER_AGENT },
        fetchImplementation
      )
    ).rejects.toThrow('SEC responded 403')
  })
})
