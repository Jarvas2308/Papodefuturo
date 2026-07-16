import type { InternationalEtfFundamentalSnapshotStorage } from './contracts'
import { loadSecInternationalEtfFundamentals } from './sec/nport/provider'
import type { SecNportFetcher } from './sec/nport/types'

export async function ingestSecInternationalEtfFundamentals(input: {
  userAgent: string
  fetcher: SecNportFetcher
  storage: InternationalEtfFundamentalSnapshotStorage
}) {
  const records = await loadSecInternationalEtfFundamentals({
    userAgent: input.userAgent,
    fetcher: input.fetcher,
  })
  await input.storage.upsertMany(records)
  return records
}
