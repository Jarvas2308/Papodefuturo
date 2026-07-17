import { describe, expect, it } from 'vitest'
import * as publicApi from './index'

describe('CVM IPE public API', () => {
  it('exports only the approved runtime surface', () => {
    expect(Object.keys(publicApi).sort()).toEqual(
      [
        'CVM_IPE_DATASET_LICENSE',
        'CVM_IPE_STOCK_COMPANY_NAME_ALIASES_V1_VERSION',
        'CVM_IPE_STOCK_EVENTS_PARSER_V1_VERSION',
        'CVM_IPE_STOCK_EVENTS_PROVIDER_V1_VERSION',
        'CVM_IPE_TERMS_AUDITED_AT',
        'buildOfficialCvmIpeArchiveUrl',
        'downloadOfficialCvmIpeArchive',
        'extractCvmIpeStockEvents',
        'fetchCvmIpeStockEvents',
        'parseOfficialCvmIpeCsv',
        'readOfficialCvmIpeCsvFromArchive',
      ].sort()
    )
  })

  it('keeps every public version and policy literal stable', () => {
    expect(publicApi).toMatchObject({
      CVM_IPE_STOCK_EVENTS_PROVIDER_V1_VERSION:
        'cvm-ipe-stock-events-provider.v1',
      CVM_IPE_STOCK_EVENTS_PARSER_V1_VERSION: 'cvm-ipe-stock-events-parser.v1',
      CVM_IPE_STOCK_COMPANY_NAME_ALIASES_V1_VERSION:
        'cvm-ipe-stock-company-name-aliases.v1',
      CVM_IPE_TERMS_AUDITED_AT: '2026-07-16',
      CVM_IPE_DATASET_LICENSE: 'ODbL-1.0',
    })
  })
})
