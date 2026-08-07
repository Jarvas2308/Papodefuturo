import { describe, expect, it } from 'vitest'
import { buildEtfDistributionValueRowV1 } from './buildEtfDistributionValueRowV1'
import { findEtfNcsrFundIdentityV1 } from './etfNcsrFundIdentityV1'
import { VNQ_ETF_SHARES_FINANCIAL_HIGHLIGHTS_TEXT_V1 } from './testFixtures'

// A fixture já está normalizada; embrulhá-la em `<td>` reconstrói uma
// entrada plausível para o normalizador sem inventar nenhum número.
const VNQ_DOCUMENT_HTML = `<html><body><td>${VNQ_ETF_SHARES_FINANCIAL_HIGHLIGHTS_TEXT_V1}</td></body></html>`

const VNQ_IDENTITY = findEtfNcsrFundIdentityV1('VNQ')!
const VNQ_URL =
  'https://www.sec.gov/Archives/edgar/data/734383/000110465926036013/tm265717d2_ncsr.htm'

describe('buildEtfDistributionValueRowV1', () => {
  it('builds the snake_case row the upsert RPC expects', () => {
    expect(
      buildEtfDistributionValueRowV1({
        identity: VNQ_IDENTITY,
        accessionNumber: '0001104659-26-036013',
        documentUrl: VNQ_URL,
        documentHtml: VNQ_DOCUMENT_HTML,
      })
    ).toEqual({
      ticker: 'VNQ',
      registrant_cik: '0000734383',
      accession_number: '0001104659-26-036013',
      fund_name: 'Real Estate Index Fund',
      share_class_label: 'ETF Shares',
      fiscal_year_end_date: '2026-01-31',
      total_distributions_per_share_unscaled: 3472,
      total_distributions_per_share_scale: 3,
      net_asset_value_end_of_period_unscaled: 9081,
      net_asset_value_end_of_period_scale: 2,
      source_document_url: VNQ_URL,
    })
  })

  it('emits exactly the 11 fields the RPC accepts, no more', () => {
    const row = buildEtfDistributionValueRowV1({
      identity: VNQ_IDENTITY,
      accessionNumber: '0001104659-26-036013',
      documentUrl: VNQ_URL,
      documentHtml: VNQ_DOCUMENT_HTML,
    })!

    expect(Object.keys(row)).toHaveLength(11)
    expect(row).not.toHaveProperty('id')
    expect(row).not.toHaveProperty('extracted_at')
  })

  it('returns null (skips the whole filing) when the fund block is absent', () => {
    expect(
      buildEtfDistributionValueRowV1({
        identity: findEtfNcsrFundIdentityV1('VOO')!,
        accessionNumber: '0001104659-26-036013',
        documentUrl: VNQ_URL,
        documentHtml: VNQ_DOCUMENT_HTML,
      })
    ).toBeNull()
  })
})
