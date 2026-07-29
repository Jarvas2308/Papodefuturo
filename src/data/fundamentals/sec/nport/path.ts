// Valida o campo primaryDocument da SEC Submissions API.
//
// Descoberto contra dado real (ver DEC-049/DEC-051): para NPORT-P e
// NPORT-P/A, a SEC sempre publica primaryDocument como um caminho relativo de
// dois segmentos, ex.: "xslFormNPORT-P_X01/primary_doc.xml" - o primeiro
// segmento e' o diretorio do visualizador XSLT dentro da pasta da accession, o
// segundo e' o documento primario em si. Um nome de arquivo sem barra nunca
// ocorreu em nenhum filing real observado. A validacao anterior rejeitava
// qualquer "/" e, por isso, rejeitava literalmente todo filing real da SEC.
//
// Este validador aceita um ou mais segmentos separados por "/", cada um
// restrito a um alfabeto seguro de nome de arquivo, e continua rejeitando
// path traversal, caminho absoluto, barra invertida e segmentos vazios - a
// URL final e' construida por concatenacao direta em buildSecPrimaryDocumentUrl.

const SAFE_PATH_SEGMENT_PATTERN = /^[A-Za-z0-9._-]+$/

export function isSafeSecPrimaryDocumentPath(value: string): boolean {
  if (value.trim() !== value || value.length === 0) return false
  if (value.includes('\\') || value.startsWith('/')) return false
  const segments = value.split('/')
  return segments.every(
    (segment) =>
      segment !== '.' &&
      segment !== '..' &&
      SAFE_PATH_SEGMENT_PATTERN.test(segment)
  )
}

/**
 * Quando primaryDocument tem mais de um segmento (ex.:
 * "xslFormNPORT-P_X01/primary_doc.xml"), o primeiro segmento identifica o
 * visualizador XSLT que renderiza o documento como HTML para leitura humana -
 * confirmado contra download real, que retorna `<!DOCTYPE html>`. O XML
 * estruturado (`<?xml ...?><edgarSubmission ...>`) fica na raiz da pasta da
 * accession, sob o nome do ultimo segmento apenas. Chame somente com um valor
 * ja validado por isSafeSecPrimaryDocumentPath.
 */
export function extractSecPrimaryDocumentFileName(value: string): string {
  const segments = value.split('/')
  return segments[segments.length - 1]!
}
