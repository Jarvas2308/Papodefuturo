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
    // `stale-quote` é o estado normal quando os preços já estão em dia: o
    // provider respondeu, mas nada mais recente havia para gravar. Mostrar o
    // banner nesse caso o tornava permanente em qualquer tela com cotação
    // atualizada — o próprio caso comum do dia a dia.
    const hasRealDegradation = result.warnings.some(
      (warning) => warning.kind !== 'stale-quote'
    )

    return {
      result,
      warning: hasRealDegradation ? MARKET_DATA_REFRESH_WARNING : null,
    }
  } catch {
    return { result: null, warning: MARKET_DATA_REFRESH_WARNING }
  }
}
