// Transporte RPC compartilhado pelos tres adapters de escrita de
// fundamental_snapshots (acoes brasileiras, FIIs e ETFs internacionais).
//
// A RPC upsert_fundamental_snapshots_v1 (migration
// 20260728120000_create_fundamental_snapshots_upsert_rpc_v1.sql) ainda nao foi
// aplicada ao Supabase real nem regenerada em src/lib/database.types.ts, entao
// o nome da funcao nao existe no union de Database['public']['Functions'].
// Por isso este arquivo define um tipo de cliente proprio e minimo, decoupled
// dos tipos gerados — mesmo padrao ja usado por
// OfficialAssetEventsSupabaseRpcClientV1 em
// src/data/context/official-events/storage/supabaseStorage.ts para o mesmo
// problema. Nao editar database.types.ts a mao (AGENTS.md).
import type { TablesInsert } from '../../lib/database.types'

export const FUNDAMENTAL_SNAPSHOTS_UPSERT_RPC_V1 =
  'upsert_fundamental_snapshots_v1' as const

export type FundamentalSnapshotUpsertRowV1 =
  TablesInsert<'fundamental_snapshots'>

export type FundamentalSnapshotsRpcClientV1 = {
  rpc(
    functionName: typeof FUNDAMENTAL_SNAPSHOTS_UPSERT_RPC_V1,
    args: { records: readonly FundamentalSnapshotUpsertRowV1[] }
  ): PromiseLike<{ data: unknown; error: { message: string } | null }>
}

function createQueryError(message: string): Error {
  return new Error(`Failed to upsert fundamental snapshots: ${message}`)
}

/**
 * Envia um lote ja normalizado (snake_case, contrato de linha completo) para a
 * RPC transacional. Nao valida o dominio — cada adapter ja validou o record
 * antes de chamar esta funcao. Batch vazio nao chama a rede.
 */
export async function upsertFundamentalSnapshotRowsV1(
  client: FundamentalSnapshotsRpcClientV1,
  rows: readonly FundamentalSnapshotUpsertRowV1[]
): Promise<void> {
  if (rows.length === 0) {
    return
  }

  const { error } = await client.rpc(FUNDAMENTAL_SNAPSHOTS_UPSERT_RPC_V1, {
    records: rows,
  })

  if (error) {
    throw createQueryError(error.message)
  }
}
