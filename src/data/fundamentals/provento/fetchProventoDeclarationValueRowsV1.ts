import { buildProventoDeclarationValueRowsV1 } from './buildProventoDeclarationValueRowsV1'
import { fetchProventoDocumentText } from './fetchProventoDocumentText'
import type { ProventoDeclarationValueRowV1 } from './toProventoDeclarationValueRowV1'

type FetchLike = typeof fetch

// Network wrapper: downloads the document and runs it through
// buildProventoDeclarationValueRowsV1. Kept thin and separate from the
// pure extraction so tests exercise real fixture text without needing to
// mock pdf-parse (see buildProventoDeclarationValueRowsV1.test.ts).
export async function fetchProventoDeclarationValueRowsV1(
  params: { eventId: string; documentUrl: string },
  fetchImplementation: FetchLike = fetch
): Promise<ProventoDeclarationValueRowV1[] | null> {
  const documentText = await fetchProventoDocumentText(
    params.documentUrl,
    fetchImplementation
  )

  return buildProventoDeclarationValueRowsV1({
    eventId: params.eventId,
    documentText,
  })
}
