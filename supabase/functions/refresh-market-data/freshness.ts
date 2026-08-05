export const MARKET_DATA_FRESHNESS_MS = 60 * 60 * 1000

type MarketFact = {
  pricedAt: string
  source: string
}

export function getLatestAutomaticFact<T extends MarketFact>(
  facts: readonly T[]
): T | null {
  return facts.reduce<T | null>((latest, fact) => {
    if (fact.source !== 'market-provider') {
      return latest
    }

    const timestamp = Date.parse(fact.pricedAt)

    if (Number.isNaN(timestamp)) {
      return latest
    }

    if (!latest || timestamp > Date.parse(latest.pricedAt)) {
      return fact
    }

    return latest
  }, null)
}

export function isAutomaticFactFresh(
  fact: MarketFact | null,
  now: Date
): boolean {
  if (!fact || fact.source !== 'market-provider') {
    return false
  }

  const age = now.getTime() - Date.parse(fact.pricedAt)
  return age >= 0 && age < MARKET_DATA_FRESHNESS_MS
}

export function isStrictlyNewerTimestamp(
  candidate: string,
  persisted: MarketFact | null
): boolean {
  if (!persisted) {
    return true
  }

  return Date.parse(candidate) > Date.parse(persisted.pricedAt)
}

// O Tesouro Transparente publica uma linha por dia util, nao por segundo -
// MARKET_DATA_FRESHNESS_MS (60 min) nao serve aqui. "Fresco" significa "ja
// temos a linha de hoje", nao "faz menos de uma hora". Evita rebaixar o CSV
// de ~14 MB a cada disparo horario do cron quando o dado do dia ja esta
// gravado.
export function isReferenceRateFreshForToday(
  latestPricedAtDate: string | null,
  now: Date
): boolean {
  if (!latestPricedAtDate) {
    return false
  }

  const today = now.toISOString().slice(0, 10)
  return latestPricedAtDate === today
}
