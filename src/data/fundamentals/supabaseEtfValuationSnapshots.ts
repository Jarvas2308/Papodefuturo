// Leitura de prêmio/desconto de ETF sobre o NAV - Sprint 16, Fase 4 fatia
// ETF (DEC-092). Só leitura: a escrita é feita exclusivamente pelo cron
// `refresh-market-data` (Deno, service_role via
// `upsert_market_etf_valuations_v1`) - não existe ingestão via CLI/script
// Node para esta fonte, mesmo padrão de `market_reference_rates` (NTN-B).
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../lib/database.types'
import type { EtfPremiumDiscountPoint } from '../../domain/fundamentals/score'

export type EtfValuationSupabaseClient = SupabaseClient<Database>

export type EtfValuationRepository = {
  listEtfValuations(): Promise<EtfPremiumDiscountPoint[]>
}

export function createSupabaseEtfValuationRepository(
  client: EtfValuationSupabaseClient
): EtfValuationRepository {
  return {
    async listEtfValuations() {
      const { data, error } = await client
        .from('market_etf_valuations')
        .select('*')
        .eq('source', 'vanguard-site')

      if (error) {
        throw new Error(`Failed to load ETF valuations: ${error.message}`)
      }

      return (data ?? []).map((row) => ({
        ticker: row.ticker,
        referenceDate: row.reference_date,
        premiumDiscountBasisPoints: row.premium_discount_basis_points,
      }))
    },
  }
}
