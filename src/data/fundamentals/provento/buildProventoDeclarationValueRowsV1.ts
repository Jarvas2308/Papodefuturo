import { extractProventoDeclarationIdentityV1 } from './extractProventoDeclarationIdentityV1'
import { extractProventoFormV1 } from './extractProventoFormV1'
import {
  toProventoDeclarationValueRowV1,
  type ProventoDeclarationValueRowV1,
} from './toProventoDeclarationValueRowV1'

// Combines both provento extractors into the rows ready for
// provento_declaration_values, one per document. Deliberately does NOT
// filter down to a single ISIN here: a stock's asset identity has no
// verified ISIN anywhere in this codebase (brazilian-stock identity is
// cnpj/cvmCode, not ISIN - only real-estate-fund carries one), so a
// document declaring both ON and PN classes stores both rows under the
// same event_id (matches the migration's (event_id, isin) primary key).
// Resolving which ISIN belongs to which ticker is a read-side concern
// for whichever signal consumes this table, not an extraction-time one.
export function buildProventoDeclarationValueRowsV1(params: {
  eventId: string
  documentText: string
}): ProventoDeclarationValueRowV1[] | null {
  const { eventId, documentText } = params

  const formRows = extractProventoFormV1(documentText)
  if (formRows === null) {
    return null
  }
  if (formRows.length === 0) {
    return []
  }

  const identity = extractProventoDeclarationIdentityV1(documentText)
  if (identity === null) {
    throw new Error(
      `Provento document for event ${eventId} has value rows but no declaration identity (Protocolo Provento) - refusing to store dedup-blind data.`
    )
  }

  return formRows.map((formRow) =>
    toProventoDeclarationValueRowV1({ eventId, formRow, identity })
  )
}
