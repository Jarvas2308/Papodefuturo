import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProventoDeclarationPointV1 } from '../../domain/fundamentals/score/computeProventoTrailingTwelveMonthValueV1'
import type { Database } from '../../lib/database.types'

export type ProventoDeclarationValueSupabaseClient = SupabaseClient<Database>

export type ProventoDeclarationValueRepository = {
  listProventoDeclarationsByIsin(
    isin: string
  ): Promise<ProventoDeclarationPointV1[]>
}

// Read-only, global table (RLS grants select to authenticated, mirrors
// market_etf_valuations - ver toProventoDeclarationValueRowV1.ts). Writes
// happen exclusively via upsert_provento_declaration_values_v1
// (backfill script), never through this client.
export function createSupabaseProventoDeclarationValueRepository(
  client: ProventoDeclarationValueSupabaseClient
): ProventoDeclarationValueRepository {
  return {
    async listProventoDeclarationsByIsin(isin) {
      const { data, error } = await client
        .from('provento_declaration_values')
        .select(
          'protocol, version, gross_value_per_share_unscaled, gross_value_per_share_scale, payment_date'
        )
        .eq('isin', isin)

      if (error) {
        throw new Error(
          `Failed to load provento declarations: ${error.message}`
        )
      }

      return (data ?? []).map((row) => ({
        protocol: row.protocol,
        version: row.version,
        grossValuePerShare: {
          unscaledValue: row.gross_value_per_share_unscaled,
          scale: row.gross_value_per_share_scale,
        },
        paymentDate: row.payment_date,
      }))
    },
  }
}
