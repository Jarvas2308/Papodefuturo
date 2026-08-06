import { downloadShillerCapeArchive } from './shiller/archive'
import { extractShillerCapeHistoryV1 } from './shiller/provider'
import type { ShillerCapeFetcher } from './shiller/types'
import type { ShillerCapeSnapshotStorage } from './supabaseShillerCapeSnapshots'

// Ingere 11 anos de historico, nao so o ponto mais recente (Sprint 16,
// Fase 5 fatia ETF, DEC-091) - o sinal "CAPE vs propria media historica de
// 10 anos" precisa da serie. O ponto mais recente continua sendo o
// primeiro consumidor pratico (ex.: exibicao do valor atual), mas agora
// vem do mesmo array, nao de uma extracao separada.
export async function ingestShillerCapeFundamentals(input: {
  storage: ShillerCapeSnapshotStorage
  fetcher?: ShillerCapeFetcher
}) {
  const archiveBuffer = await downloadShillerCapeArchive(input.fetcher)
  const records = extractShillerCapeHistoryV1(archiveBuffer)

  await input.storage.upsertMany(records)
  return records
}
