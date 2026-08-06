import { PDFParse } from 'pdf-parse'

type FetchLike = typeof fetch

// Mesmo host já confiado pelo provider CVM IPE pra montar `canonical_url`/
// `original_url` dos eventos de dividendo/JCP - allowlist fechada, nunca
// segue link pra fora do domínio oficial da CVM.
const ALLOWED_HOST = 'www.rad.cvm.gov.br'

// Defensivo contra documento anormalmente grande (o maior real observado
// nesta sessão tinha ~136 KB) - falha fechada em vez de consumir memória
// sem limite.
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024

export async function fetchProventoDocumentText(
  documentUrl: string,
  fetchImplementation: FetchLike = fetch
): Promise<string> {
  const url = new URL(documentUrl)

  if (url.hostname !== ALLOWED_HOST) {
    throw new Error(
      `Provento document host not allowed: ${url.hostname} (expected ${ALLOWED_HOST})`
    )
  }

  const response = await fetchImplementation(url.toString())

  if (!response.ok) {
    throw new Error(
      `CVM respondeu ${response.status} ao baixar o documento de provento.`
    )
  }

  const buffer = await response.arrayBuffer()

  if (buffer.byteLength > MAX_DOCUMENT_BYTES) {
    throw new Error(
      `Documento de provento excede o limite defensivo de tamanho: ${buffer.byteLength} bytes`
    )
  }

  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  try {
    const result = await parser.getText()
    return result.text
  } finally {
    await parser.destroy()
  }
}
