import {
  buildOfficialCvmArchiveUrl,
  downloadOfficialCvmArchive,
  readCvmConsolidatedDocuments,
} from './cvm/archive'
import { extractCvmBrazilianStockFundamentals } from './cvm/provider'
import type { CvmArchiveFetcher, CvmArchiveSource } from './cvm/types'
import type { FundamentalSnapshotStorage } from './contracts'

export async function ingestCvmBrazilianStockFundamentals(input: {
  source: CvmArchiveSource
  year: number
  storage: FundamentalSnapshotStorage
  fetcher?: CvmArchiveFetcher
}) {
  const archiveUrl = buildOfficialCvmArchiveUrl(input.source, input.year)
  const archiveBytes = await downloadOfficialCvmArchive(
    input.source,
    input.year,
    input.fetcher
  )
  const documents = readCvmConsolidatedDocuments(archiveBytes)
  const records = extractCvmBrazilianStockFundamentals({
    source: input.source,
    archiveId: archiveUrl.split('/').at(-1)!,
    documents,
  })

  await input.storage.upsertMany(records)
  return records
}
