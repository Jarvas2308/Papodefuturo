import { describe, expect, it } from 'vitest'

import * as publicApi from './index'
import * as contextApi from '../../../index'
import * as officialEventsApi from '../../index'
import * as secApi from '../index'

const APPROVED_RUNTIME_EXPORTS = [
  'SEC_EDGAR_ETF_EVENTS_PROVIDER_V1_VERSION',
  'SEC_EDGAR_SUBMISSIONS_PARSER_V1_VERSION',
  'SEC_EDGAR_FILING_DETAIL_PARSER_V1_VERSION',
  'SEC_EDGAR_ETF_FORM_MAPPING_V1_VERSION',
  'SEC_EDGAR_TERMS_AUDITED_AT',
  'buildSecEdgarSubmissionsUrl',
  'buildSecEdgarFilingDetailUrl',
  'parseSecEdgarSubmissionsJson',
  'parseSecEdgarFilingDetailHtml',
  'extractSecEdgarEtfEvents',
  'fetchSecEdgarEtfEvents',
] as const

describe('SEC EDGAR ETF events public API', () => {
  it('exports exactly the approved runtime contract', () => {
    expect(Object.keys(publicApi).sort()).toEqual(
      [...APPROVED_RUNTIME_EXPORTS].sort()
    )
  })

  it('preserves approved exports through every public barrel', () => {
    for (const api of [secApi, officialEventsApi, contextApi]) {
      for (const name of APPROVED_RUNTIME_EXPORTS) {
        expect(api).toHaveProperty(name, publicApi[name])
      }
      expect(api).not.toHaveProperty('mapSecEdgarFormToEventType')
      expect(api).not.toHaveProperty('buildPayloadHash')
      expect(api).not.toHaveProperty('tokenizeHtml')
      expect(api).not.toHaveProperty('SEC_EDGAR_MAX_UNIQUE_REQUESTS')
    }
  })

  it('does not expose internal mapping, hashing, tokenizer, cache or limits', () => {
    expect(Object.keys(publicApi)).not.toContain('mapSecEdgarFormToEventType')
    expect(Object.keys(publicApi)).not.toContain('buildPayloadHash')
    expect(Object.keys(publicApi)).not.toContain('tokenizeHtml')
    expect(Object.keys(publicApi)).not.toContain(
      'SEC_EDGAR_MAX_UNIQUE_REQUESTS'
    )
  })
})
