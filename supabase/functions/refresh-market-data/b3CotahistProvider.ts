import { parseCotahistQuotes } from './b3CotahistParser.ts'
import type { MarketQuote } from './types.ts'

type FetchLike = typeof fetch
type ExtractCotahistText = (archive: Uint8Array) => Promise<string> | string

const COTAHIST_BASE_URL = 'https://bvmf.bmfbovespa.com.br/InstDados/SerHist/'
const DAILY_CANDIDATE_COUNT = 7

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function dailyFileName(date: Date): string {
  return `COTAHIST_D${pad(date.getUTCDate())}${pad(date.getUTCMonth() + 1)}${date.getUTCFullYear()}.ZIP`
}

function monthlyFileName(date: Date): string {
  return `COTAHIST_M${pad(date.getUTCMonth() + 1)}${date.getUTCFullYear()}.ZIP`
}

export function buildCotahistCandidateUrls(now: Date): URL[] {
  const candidates: string[] = []

  for (let dayOffset = 0; dayOffset < DAILY_CANDIDATE_COUNT; dayOffset += 1) {
    const date = new Date(now)
    date.setUTCDate(date.getUTCDate() - dayOffset)
    candidates.push(dailyFileName(date))
  }

  const currentMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  )
  const previousMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)
  )
  candidates.push(monthlyFileName(currentMonth), monthlyFileName(previousMonth))

  return candidates.map((fileName) => new URL(fileName, COTAHIST_BASE_URL))
}

export function createB3CotahistProvider({
  extractText,
  fetchImplementation = fetch,
  now = () => new Date(),
}: {
  extractText: ExtractCotahistText
  fetchImplementation?: FetchLike
  now?: () => Date
}) {
  return {
    async getAssetQuotes(tickers: readonly string[]): Promise<MarketQuote[]> {
      const normalizedTickers = Array.from(
        new Set(tickers.map((ticker) => ticker.trim().toUpperCase()))
      )

      if (normalizedTickers.length === 0) {
        return []
      }

      for (const url of buildCotahistCandidateUrls(now())) {
        try {
          const response = await fetchImplementation(url)

          if (!response.ok) {
            continue
          }

          const content = await extractText(
            new Uint8Array(await response.arrayBuffer())
          )
          const quotes = parseCotahistQuotes(content, normalizedTickers)

          if (quotes.length > 0) {
            return quotes
          }
        } catch {
          continue
        }
      }

      throw new Error('B3 COTAHIST indisponível para os ativos solicitados.')
    },
  }
}
