import { unzipSync } from 'fflate'
import type {
  CvmArchiveFetcher,
  CvmArchiveSource,
  CvmStatement,
  CvmStatementDocument,
} from './types'

const STATEMENT_FILE_PATTERN = /_(BPA|BPP|DRE|DFC_MD|DFC_MI)_con_\d{4}\.csv$/i

export function buildOfficialCvmArchiveUrl(
  source: CvmArchiveSource,
  year: number
): string {
  if (!Number.isSafeInteger(year) || year < 2000 || year > 9999) {
    throw new RangeError(`Invalid CVM archive year: ${year}`)
  }

  const documentType = source.toUpperCase()
  const filePrefix = source.toLowerCase()
  return `https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/${documentType}/DADOS/${filePrefix}_cia_aberta_${year}.zip`
}

export async function downloadOfficialCvmArchive(
  source: CvmArchiveSource,
  year: number,
  fetcher: CvmArchiveFetcher = fetch
): Promise<Uint8Array> {
  const url = buildOfficialCvmArchiveUrl(source, year)
  const response = await fetcher(url)

  if (!response.ok) {
    throw new Error(
      `Failed to download official CVM archive: HTTP ${response.status}`
    )
  }

  return new Uint8Array(await response.arrayBuffer())
}

export function readCvmConsolidatedDocuments(
  archiveBytes: Uint8Array
): CvmStatementDocument[] {
  const files = unzipSync(archiveBytes)
  const decoder = new TextDecoder('windows-1252')
  const documents = Object.entries(files)
    .map(([fileName, content]) => {
      const match = STATEMENT_FILE_PATTERN.exec(fileName)
      if (!match) {
        return null
      }

      return {
        fileName,
        statement: match[1]!.toUpperCase() as CvmStatement,
        content: decoder.decode(content),
      }
    })
    .filter((document): document is CvmStatementDocument => document !== null)

  for (const requiredStatement of ['BPA', 'BPP', 'DRE'] as const) {
    if (
      !documents.some((document) => document.statement === requiredStatement)
    ) {
      throw new Error(
        `Official CVM archive is missing consolidated ${requiredStatement}`
      )
    }
  }

  if (
    !documents.some(
      (document) =>
        document.statement === 'DFC_MI' || document.statement === 'DFC_MD'
    )
  ) {
    throw new Error('Official CVM archive is missing consolidated cash flow')
  }

  return documents
}
