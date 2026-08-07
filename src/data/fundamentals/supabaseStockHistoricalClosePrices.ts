import type { SupabaseClient } from '@supabase/supabase-js'
import type { StockClosePriceHistoryPointV1 } from '../../domain/fundamentals/score'
import type { Database } from '../../lib/database.types'

// Migration `20260807140000_create_stock_historical_close_prices.sql`
// aplicada em produção em 07/08/2026; `database.types.ts` regenerado
// pelo mecanismo oficial (Database já inclui
// `stock_historical_close_prices`).

export type StockHistoricalClosePriceSupabaseClient = SupabaseClient<Database>

export type StockHistoricalClosePriceRepository = {
  listStockHistoricalClosePricesByTicker(
    ticker: string
  ): Promise<StockClosePriceHistoryPointV1[]>
}

// Read-only, global table (RLS concede select a `authenticated`, mesmo
// padrão de etf_distribution_values/fii_monthly_dividend_yield). Escrita
// só via upsert_stock_historical_close_prices_v1 (script de backfill).
export function createSupabaseStockHistoricalClosePriceRepository(
  client: StockHistoricalClosePriceSupabaseClient
): StockHistoricalClosePriceRepository {
  return {
    async listStockHistoricalClosePricesByTicker(ticker: string) {
      const { data, error } = await client
        .from('stock_historical_close_prices')
        .select('ticker, fiscal_year_end_date, close_price_in_minor_units')
        .eq('ticker', ticker)

      if (error) {
        throw new Error(
          `Failed to load stock historical close prices: ${error.message}`
        )
      }

      return (data ?? []).map((row) => ({
        referenceDate: row.fiscal_year_end_date,
        closePriceInMinorUnits: row.close_price_in_minor_units,
      }))
    },
  }
}
