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
