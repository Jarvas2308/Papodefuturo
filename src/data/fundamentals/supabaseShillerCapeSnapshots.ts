// Escrita do CAPE (Shiller P/E) do S&P 500 - Sprint 16, Fase 4 (DEC-084).
// Tabela global nova (`market_valuation_ratios`), fora de
// `fundamental_snapshots` - CAPE nao e' um fato por-ativo, e' um dado de
// mercado agregado (mesma categoria de `market_reference_rates`,
// DEC-075), so que sem conceito de vencimento. Leitura (Sprint 16, Fase 5
// fatia ETF, DEC-091) adicionada no mesmo arquivo - so autenticados podem
// ler (RLS), nenhum privilegio especial exigido, ao contrario da escrita.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../lib/database.types'
import type { ShillerCapeHistoryPoint } from '../../domain/fundamentals/score'
import type { ShillerCapeRecord } from './shiller/types'

export type ShillerCapeUpsertRowV1 = {
  series: 'shiller-cape-sp500'
  reference_date: string
  value_scaled: number
  value_scale: number
  source: 'shiller-yale'
}

export const UPSERT_MARKET_VALUATION_RATIOS_RPC_V1 =
  'upsert_market_valuation_ratios_v1' as const

export type MarketValuationRatiosRpcClientV1 = {
  rpc(
    functionName: typeof UPSERT_MARKET_VALUATION_RATIOS_RPC_V1,
    args: { records: readonly ShillerCapeUpsertRowV1[] }
  ): PromiseLike<{ data: unknown; error: { message: string } | null }>
}

export type ShillerCapeSnapshotStorage = {
  upsertMany(records: readonly ShillerCapeRecord[]): Promise<void>
}

function toInsertRow(record: ShillerCapeRecord): ShillerCapeUpsertRowV1 {
  if (!Number.isSafeInteger(record.valueScaled) || record.valueScaled <= 0) {
    throw new RangeError(
      `Invalid Shiller CAPE scaled value: ${record.valueScaled}`
    )
  }
  if (record.valueScale !== 1_000_000) {
    throw new RangeError(
      `Invalid Shiller CAPE value scale: ${record.valueScale}`
    )
  }

  return {
    series: record.series,
    reference_date: record.referenceDate,
    value_scaled: record.valueScaled,
    value_scale: record.valueScale,
    source: record.source,
  }
}

// RPC valida lote <= 20 (upsert_market_valuation_ratios_v1, DEC-084) -
// historico de 11 anos mensais (~132 linhas, DEC-091) excede isso, entao
// upsertMany quebra em lotes sequenciais. Sequencial, nao paralelo: o RPC
// ja serializa via pg_advisory_xact_lock, paralelizar so competiria pelo
// mesmo lock sem ganho.
const MAX_BATCH_SIZE = 20

function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

export type ShillerCapeHistorySupabaseClient = SupabaseClient<Database>

export type ShillerCapeHistoryRepository = {
  listShillerCapeHistory(): Promise<ShillerCapeHistoryPoint[]>
}

export function createSupabaseShillerCapeHistoryRepository(
  client: ShillerCapeHistorySupabaseClient
): ShillerCapeHistoryRepository {
  return {
    async listShillerCapeHistory() {
      const { data, error } = await client
        .from('market_valuation_ratios')
        .select('*')
        .eq('series', 'shiller-cape-sp500')
        .order('reference_date', { ascending: true })

      if (error) {
        throw new Error(`Failed to load Shiller CAPE history: ${error.message}`)
      }

      return (data ?? []).map((row) => ({
        referenceDate: row.reference_date,
        valueScaled: row.value_scaled,
      }))
    },
  }
}

export function createSupabaseShillerCapeSnapshotStorage(
  privilegedClient: MarketValuationRatiosRpcClientV1
): ShillerCapeSnapshotStorage {
  return {
    async upsertMany(records) {
      if (records.length === 0) {
        return
      }
      const rows = records.map(toInsertRow)
      for (const batch of chunk(rows, MAX_BATCH_SIZE)) {
        const { error } = await privilegedClient.rpc(
          UPSERT_MARKET_VALUATION_RATIOS_RPC_V1,
          { records: batch }
        )
        if (error) {
          throw new Error(
            `Failed to upsert Shiller CAPE valuation ratios: ${error.message}`
          )
        }
      }
    },
  }
}
