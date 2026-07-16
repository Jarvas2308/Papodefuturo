import { unzipSync } from 'fflate'
import type {
  CvmFiiArchiveFetcher,
  CvmFiiMonthlyDocument,
  CvmFiiMonthlyDocumentType,
} from './types'

const DOCUMENT_PATTERN = /inf_mensal_fii_(geral|complemento)_\d{4}\.csv$/i
const DOCUMENT_ORDER: Record<CvmFiiMonthlyDocumentType, number> = {
  general: 0,
  complement: 1,
}

export function buildOfficialCvmFiiArchiveUrl(year: number): string {
  if (!Number.isSafeInteger(year) || year < 2016 || year > 9999) {
    throw new RangeError(`Invalid CVM FII archive year: ${year}`)
  }

  return `https://dados.cvm.gov.br/dados/FII/DOC/INF_MENSAL/DADOS/inf_mensal_fii_${year}.zip`
}

export async function downloadOfficialCvmFiiArchive(
  year: number,
  fetcher: CvmFiiArchiveFetcher = fetch
): Promise<Uint8Array> {
  const response = await fetcher(buildOfficialCvmFiiArchiveUrl(year))
  if (!response.ok) {
    throw new Error(
      `Failed to download official CVM FII archive: HTTP ${response.status}`
    )
  }

  return new Uint8Array(await response.arrayBuffer())
}

function toDocumentType(value: string): CvmFiiMonthlyDocumentType {
  return value.toLowerCase() === 'geral' ? 'general' : 'complement'
}

export function readCvmFiiMonthlyDocuments(
  archiveBytes: Uint8Array
): CvmFiiMonthlyDocument[] {
  const decoder = new TextDecoder('windows-1252')
  const documents = Object.entries(unzipSync(archiveBytes))
    .map(([fileName, content]) => {
      const match = DOCUMENT_PATTERN.exec(fileName)
      if (!match) {
        return null
      }

      return {
        fileName,
        type: toDocumentType(match[1]!),
        content: decoder.decode(content),
      }
    })
    .filter((document): document is CvmFiiMonthlyDocument => document !== null)
    .sort(
      (left, right) => DOCUMENT_ORDER[left.type] - DOCUMENT_ORDER[right.type]
    )

  for (const type of ['general', 'complement'] as const) {
    const matchingDocuments = documents.filter(
      (document) => document.type === type
    )
    if (matchingDocuments.length !== 1) {
      throw new Error(
        `Official CVM FII archive must contain exactly one ${type} document`
      )
    }
  }

  return documents
}
