import { describe, expect, it } from 'vitest'
import * as publicApi from './index'

describe('CVM Fund Delivery FII public API', () => {
  it('exports only the approved runtime surface', () => {
    expect(Object.keys(publicApi).sort()).toEqual(
      [
        'CVM_FUND_DELIVERY_DATASET_LICENSE',
        'CVM_FUND_DELIVERY_FII_DOCUMENT_TYPES_V1_VERSION',
        'CVM_FUND_DELIVERY_FII_EVENTS_PARSER_V1_VERSION',
        'CVM_FUND_DELIVERY_FII_EVENTS_PROVIDER_V1_VERSION',
        'CVM_FUND_DELIVERY_TERMS_AUDITED_AT',
        'buildOfficialCvmFundDeliveryArchiveUrl',
        'downloadOfficialCvmFundDeliveryArchive',
        'extractCvmFundDeliveryFiiEvents',
        'fetchCvmFundDeliveryFiiEvents',
        'parseOfficialCvmFundDeliveryCsv',
        'readOfficialCvmFundDeliveryMonthlyCsvFromArchive',
      ].sort()
    )
  })

  it('keeps policy versions stable', () => {
    expect(publicApi).toMatchObject({
      CVM_FUND_DELIVERY_FII_EVENTS_PROVIDER_V1_VERSION:
        'cvm-fund-delivery-fii-events-provider.v1',
      CVM_FUND_DELIVERY_FII_EVENTS_PARSER_V1_VERSION:
        'cvm-fund-delivery-fii-events-parser.v1',
      CVM_FUND_DELIVERY_FII_DOCUMENT_TYPES_V1_VERSION:
        'cvm-fund-delivery-fii-document-types.v1',
      CVM_FUND_DELIVERY_TERMS_AUDITED_AT: '2026-07-17',
      CVM_FUND_DELIVERY_DATASET_LICENSE: 'ODbL-1.0',
    })
  })
})
