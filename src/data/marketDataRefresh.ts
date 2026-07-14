import type {
  MarketDataRepository,
  MarketDataRefreshResult,
} from './repositories/contracts'

export const MARKET_DATA_REFRESH_WARNING =
  'Algumas cotações não puderam ser atualizadas. Os últimos dados disponíveis continuam sendo usados.'

export async function refreshMarketDataBestEffort(
  repository: MarketDataRepository
): Promise<{ result: MarketDataRefreshResult | null; warning: string | null }> {
  try {
    const result = await repository.refresh()

    return {
      result,
      warning: result.warnings.length > 0 ? MARKET_DATA_REFRESH_WARNING : null,
    }
  } catch {
    return { result: null, warning: MARKET_DATA_REFRESH_WARNING }
  }
}
