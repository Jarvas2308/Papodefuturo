import { unzipSync } from 'fflate'
import type {
  CvmFiiTrimestralArchiveFetcher,
  CvmFiiTrimestralDocument,
  CvmFiiTrimestralDocumentType,
} from './types'

const GENERAL_PATTERN = /inf_trimestral_fii_geral_\d{4}\.csv$/i
const PROPERTY_PATTERN = /inf_trimestral_fii_imovel_\d{4}\.csv$/i
const COMPLEMENT_PATTERN = /inf_trimestral_fii_complemento_\d{4}\.csv$/i
const TENANT_PATTERN =
  /inf_trimestral_fii_imovel_renda_acabado_inquilino_\d{4}\.csv$/i
const RESULT_PATTERN =
  /inf_trimestral_fii_resultado_contabil_financeiro_\d{4}\.csv$/i
const DOCUMENT_ORDER: Record<CvmFiiTrimestralDocumentType, number> = {
  general: 0,
  property: 1,
  complement: 2,
  tenant: 3,
  result: 4,
}

export function buildOfficialCvmFiiTrimestralArchiveUrl(year: number): string {
  if (!Number.isSafeInteger(year) || year < 2016 || year > 9999) {
    throw new RangeError(`Invalid CVM FII trimestral archive year: ${year}`)
  }

  return `https://dados.cvm.gov.br/dados/FII/DOC/INF_TRIMESTRAL/DADOS/inf_trimestral_fii_${year}.zip`
}

export async function downloadOfficialCvmFiiTrimestralArchive(
  year: number,
  fetcher: CvmFiiTrimestralArchiveFetcher = fetch
): Promise<Uint8Array> {
  const response = await fetcher(buildOfficialCvmFiiTrimestralArchiveUrl(year))
  if (!response.ok) {
    throw new Error(
      `Failed to download official CVM FII trimestral archive: HTTP ${response.status}`
    )
  }

  return new Uint8Array(await response.arrayBuffer())
}

function matchDocumentType(
  fileName: string
): CvmFiiTrimestralDocumentType | null {
  if (GENERAL_PATTERN.test(fileName)) {
    return 'general'
  }
  if (PROPERTY_PATTERN.test(fileName)) {
    return 'property'
  }
  if (COMPLEMENT_PATTERN.test(fileName)) {
    return 'complement'
  }
  if (TENANT_PATTERN.test(fileName)) {
    return 'tenant'
  }
  if (RESULT_PATTERN.test(fileName)) {
    return 'result'
  }
  return null
}

/**
 * O arquivo trimestral tem 16 CSVs (aquisicao/alienacao de imovel e terreno,
 * ativo, direito, rentabilidade efetiva, etc). Esta fatia (Sprint 16
 * Fase 2) so precisa de `geral` (identidade do fundo), `imovel` (vacancia
 * por imovel), `complemento` (indexador da carteira, DEC-077),
 * `imovel_renda_acabado_inquilino` (concentracao por setor de inquilino,
 * DEC-078) e `resultado_contabil_financeiro` (resultado financeiro
 * trimestral, DEC-079) - os demais ficam fora do escopo desta extracao.
 */
export function readCvmFiiTrimestralDocuments(
  archiveBytes: Uint8Array
): CvmFiiTrimestralDocument[] {
  const decoder = new TextDecoder('windows-1252')
  const documents = Object.entries(unzipSync(archiveBytes))
    .map(([fileName, content]) => {
      const type = matchDocumentType(fileName)
      if (!type) {
        return null
      }

      return {
        fileName,
        type,
        content: decoder.decode(content),
      }
    })
    .filter(
      (document): document is CvmFiiTrimestralDocument => document !== null
    )
    .sort(
      (left, right) => DOCUMENT_ORDER[left.type] - DOCUMENT_ORDER[right.type]
    )

  for (const type of [
    'general',
    'property',
    'complement',
    'tenant',
    'result',
  ] as const) {
    const matchingDocuments = documents.filter(
      (document) => document.type === type
    )
    if (matchingDocuments.length !== 1) {
      throw new Error(
        `Official CVM FII trimestral archive must contain exactly one ${type} document`
      )
    }
  }

  return documents
}
