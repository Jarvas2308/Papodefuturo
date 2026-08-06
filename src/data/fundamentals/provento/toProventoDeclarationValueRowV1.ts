import { parseExactDecimalString } from '../../../domain/fundamentals'
import type { ProventoDeclarationIdentityV1 } from './extractProventoDeclarationIdentityV1'
import type { ProventoFormRowV1 } from './extractProventoFormV1'

// Storage adapter: domain extraction result (extractProventoFormV1 +
// extractProventoDeclarationIdentityV1) -> insert row for
// provento_declaration_values (migration
// 20260806140000_create_provento_declaration_values.sql). Mirrors the
// unscaled+scale write pattern already used for issued shares
// (supabaseRealEstateFundSnapshots.ts) - never truncates the source
// precision (up to 11 decimal places on real CVM documents).
export const PROVENTO_DECLARATION_VALUE_PARSER_VERSION = 'provento-form-v1'

export type ProventoDeclarationValueRowV1 = {
  event_id: string
  isin: string
  protocol: string
  version: number
  gross_value_per_share_unscaled: number
  gross_value_per_share_scale: number
  period_base: string
  fiscal_year: number
  payment_date: string
  sent_at: string
  parser_version: string
}

const BR_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/

/**
 * Converts a CVM-form date ("DD/MM/YYYY") to an ISO date ("YYYY-MM-DD")
 * for the Postgres `date` column. Fails closed on anything else - the
 * two extractors already validate this shape, this is a second gate,
 * not the primary one.
 */
function toIsoDate(brDate: string, description: string): string {
  const match = BR_DATE_PATTERN.exec(brDate)
  if (!match) {
    throw new Error(`${description} is not a DD/MM/YYYY date: ${brDate}`)
  }
  const [, day, month, year] = match
  return `${year}-${month}-${day}`
}

/**
 * Builds a `provento_declaration_values` insert row from one form row
 * (already selected by the caller for the event's ISIN) and the
 * declaration identity extracted from the same document. Both inputs
 * come from the same PDF text, so no defensive cross-check of ISIN
 * membership happens here - that responsibility belongs to the caller
 * that picks `formRow` out of `extractProventoFormV1`'s result.
 */
export function toProventoDeclarationValueRowV1(params: {
  eventId: string
  formRow: ProventoFormRowV1
  identity: ProventoDeclarationIdentityV1
}): ProventoDeclarationValueRowV1 {
  const { eventId, formRow, identity } = params

  const grossValue = parseExactDecimalString(
    formRow.grossValuePerShareDecimal,
    'Provento gross value per share'
  )

  return {
    event_id: eventId,
    isin: formRow.isin,
    protocol: identity.protocol,
    version: identity.version,
    gross_value_per_share_unscaled: grossValue.unscaledValue,
    gross_value_per_share_scale: grossValue.scale,
    period_base: formRow.periodBase,
    fiscal_year: formRow.fiscalYear,
    payment_date: toIsoDate(formRow.paymentDate, 'Provento payment date'),
    sent_at: toIsoDate(identity.sentAt, 'Provento declaration sent-at date'),
    parser_version: PROVENTO_DECLARATION_VALUE_PARSER_VERSION,
  }
}
