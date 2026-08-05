import { downloadShillerCapeArchive } from './shiller/archive'
import { extractShillerCapeRecord } from './shiller/provider'
import type { ShillerCapeFetcher } from './shiller/types'
import type { ShillerCapeSnapshotStorage } from './supabaseShillerCapeSnapshots'

export async function ingestShillerCapeFundamentals(input: {
  storage: ShillerCapeSnapshotStorage
  fetcher?: ShillerCapeFetcher
}) {
  const archiveBuffer = await downloadShillerCapeArchive(input.fetcher)
  const record = extractShillerCapeRecord(archiveBuffer)

  await input.storage.upsertMany([record])
  return [record]
}
