import type { SupabaseClient } from '@supabase/supabase-js'
import type { StockClosePriceHistoryPointV1 } from '../../domain/fundamentals/score'

// `stock_historical_close_prices` migration
// (supabase/migrations/20260807140000_create_stock_historical_close_prices.sql)
// is versioned but NOT yet applied to production Supabase, so the table
// does not exist in the real generated `Database` type yet (AGENTS.md
// seção 11: não editar o type gerado manualmente para fingir que uma
// tabela existe). This row shape is defined locally, matching the
// migration's columns exactly, and the client is untyped for this
// repository. Once the migration is applied and types are regenerated
// for real, switch back to `SupabaseClient<Database>` and drop this
// local type, same discipline as
// `supabaseEtfDistributionValues.ts`/`supabaseFiiMonthlyDividendYield.ts`.
type StockHistoricalClosePriceRow = {
  ticker: string
  fiscal_year_end_date: string
  close_price_in_minor_units: number
}

export type StockHistoricalClosePriceSupabaseClient = SupabaseClient

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

      const rows = (data ?? []) as StockHistoricalClosePriceRow[]

      return rows.map((row) => ({
        referenceDate: row.fiscal_year_end_date,
        closePriceInMinorUnits: row.close_price_in_minor_units,
      }))
    },
  }
}
