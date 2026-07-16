import {
  buildOfficialCvmFiiArchiveUrl,
  downloadOfficialCvmFiiArchive,
  readCvmFiiMonthlyDocuments,
} from './cvm/fii/archive'
import { extractCvmRealEstateFundFundamentals } from './cvm/fii/provider'
import type { CvmFiiArchiveFetcher } from './cvm/fii/types'
import type { RealEstateFundFundamentalSnapshotStorage } from './contracts'

export async function ingestCvmRealEstateFundFundamentals(input: {
  year: number
  storage: RealEstateFundFundamentalSnapshotStorage
  fetcher?: CvmFiiArchiveFetcher
}) {
  const archiveUrl = buildOfficialCvmFiiArchiveUrl(input.year)
  const archiveBytes = await downloadOfficialCvmFiiArchive(
    input.year,
    input.fetcher
  )
  const documents = readCvmFiiMonthlyDocuments(archiveBytes)
  const records = extractCvmRealEstateFundFundamentals({
    archiveId: archiveUrl.split('/').at(-1)!,
    documents,
  })

  await input.storage.upsertMany(records)
  return records
}
