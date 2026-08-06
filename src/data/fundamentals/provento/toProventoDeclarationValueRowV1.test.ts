import { describe, expect, it } from 'vitest'
import type { ProventoDeclarationIdentityV1 } from './extractProventoDeclarationIdentityV1'
import type { ProventoFormRowV1 } from './extractProventoFormV1'
import {
  PROVENTO_DECLARATION_VALUE_PARSER_VERSION,
  toProventoDeclarationValueRowV1,
} from './toProventoDeclarationValueRowV1'

// formRow/identity shapes mirror real extraction output confirmed against
// the ITSA4 fixture in extractProventoFormV1.test.ts /
// extractProventoDeclarationIdentityV1.test.ts (same PDF, same session).
const FORM_ROW: ProventoFormRowV1 = {
  isin: 'BRITSAACNOR0',
  grossValuePerShareDecimal: '0.02424250000',
  periodBase: '4º Trimestre 2026',
  fiscalYear: 2026,
  paymentDate: '04/01/2027',
}

const IDENTITY: ProventoDeclarationIdentityV1 = {
  protocol: '1475856',
  version: 1,
  sentAt: '09/02/2026',
}

describe('toProventoDeclarationValueRowV1', () => {
  it('builds the insert row with unscaled+scale and ISO dates', () => {
    const row = toProventoDeclarationValueRowV1({
      eventId: 'event-1',
      formRow: FORM_ROW,
      identity: IDENTITY,
    })

    expect(row).toEqual({
      event_id: 'event-1',
      isin: 'BRITSAACNOR0',
      protocol: '1475856',
      version: 1,
      gross_value_per_share_unscaled: 242425,
      gross_value_per_share_scale: 7,
      period_base: '4º Trimestre 2026',
      fiscal_year: 2026,
      payment_date: '2027-01-04',
      sent_at: '2026-02-09',
      parser_version: PROVENTO_DECLARATION_VALUE_PARSER_VERSION,
    })
  })

  it('throws on a malformed payment date', () => {
    expect(() =>
      toProventoDeclarationValueRowV1({
        eventId: 'event-1',
        formRow: { ...FORM_ROW, paymentDate: '2027-01-04' },
        identity: IDENTITY,
      })
    ).toThrow(/DD\/MM\/YYYY/)
  })
})
