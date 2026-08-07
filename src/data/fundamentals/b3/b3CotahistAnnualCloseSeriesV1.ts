// Parser puro do layout de largura fixa do arquivo anual COTAHIST_A<ano>.ZIP
// da B3, análogo a
// supabase/functions/refresh-market-data/b3CotahistParser.ts (usado hoje só
// pela Edge Function pra cotação atual, runtime Deno). Duplicado
// deliberadamente em vez de importado: os dois vivem em runtimes
// diferentes (Deno na Edge Function vs Node/Vite em `src`), e este repo
// não tem precedente de import cruzando essa fronteira (AGENTS.md seção
// 5, camada de dados/infraestrutura). Mesmas constantes de layout,
// mesma extração de campos, mesma validação - qualquer mudança de
// formato B3 deve ser replicada nos dois lugares.
//
// Diferença de propósito: o parser da Edge Function guarda só a cotação
// MAIS RECENTE por ticker (preço atual). Este guarda a série completa de
// pregões do ano por ticker, pra permitir selecionar o fechamento de um
// pregão específico (o último pregão em ou antes da data de exercício do
// DFP) - ver `selectFiscalYearEndCloseV1.ts`.
const RECORD_SIZE = 245
const CASH_MARKET_CODE = '010'
const SUPPORTED_BDI_CODES = new Set(['02', '12'])

// Posições oficiais do COTAHIST são 1-based e inclusivas. Os slices de
// JavaScript abaixo são 0-based e exclusivos no fim.
const FIELD_OFFSETS = {
  recordType: [0, 2], // TIPREG: 1-2
  tradingDate: [2, 10], // DATAPRE: 3-10
  bdiCode: [10, 12], // CODBDI: 11-12
  ticker: [12, 24], // CODNEG: 13-24
  marketType: [24, 27], // TPMERC: 25-27
  lastPrice: [108, 121], // PREULT: 109-121, N(11)V99
} as const

export type CotahistAnnualCloseRecord = {
  ticker: string
  tradingDate: string
  closePriceInMinorUnits: number
}

function readField(line: string, offset: readonly [number, number]): string {
  return line.slice(offset[0], offset[1])
}

export function parseCotahistPriceInMinorUnits(value: string): number {
  if (!/^\d{13}$/.test(value)) {
    throw new RangeError('COTAHIST PREULT must contain exactly 13 digits')
  }

  const amount = BigInt(value)

  if (amount <= 0n || amount > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError('COTAHIST PREULT is outside the supported range')
  }

  return Number(amount)
}

// Normaliza DATAPRE (YYYYMMDD) pra data civil YYYY-MM-DD, validando
// calendário (mesma checagem de round-trip de
// `b3CotahistParser.ts:normalizeCotahistTradingDate`, sem o componente de
// hora UTC - aqui o consumidor é uma data de exercício civil, não um
// instante de preço).
export function normalizeCotahistTradingDateToCivilDate(value: string): string {
  if (!/^\d{8}$/.test(value)) {
    throw new RangeError('COTAHIST DATAPRE must use YYYYMMDD')
  }

  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(4, 6))
  const day = Number(value.slice(6, 8))
  const timestamp = Date.UTC(year, month - 1, day)
  const date = new Date(timestamp)

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new RangeError('COTAHIST DATAPRE is invalid')
  }

  const pad = (component: number) => String(component).padStart(2, '0')
  return `${year}-${pad(month)}-${pad(day)}`
}

function parseCotahistLine(line: string): CotahistAnnualCloseRecord | null {
  if (line.length !== RECORD_SIZE) {
    return null
  }

  const recordType = readField(line, FIELD_OFFSETS.recordType)

  if (recordType !== '01') {
    return null
  }

  const marketType = readField(line, FIELD_OFFSETS.marketType)
  const bdiCode = readField(line, FIELD_OFFSETS.bdiCode)

  if (marketType !== CASH_MARKET_CODE || !SUPPORTED_BDI_CODES.has(bdiCode)) {
    return null
  }

  return {
    ticker: readField(line, FIELD_OFFSETS.ticker).trim().toUpperCase(),
    tradingDate: normalizeCotahistTradingDateToCivilDate(
      readField(line, FIELD_OFFSETS.tradingDate)
    ),
    closePriceInMinorUnits: parseCotahistPriceInMinorUnits(
      readField(line, FIELD_OFFSETS.lastPrice)
    ),
  }
}

// Série completa (todos os pregões do arquivo) por ticker solicitado,
// ordenada ascendentemente por `tradingDate`. Linhas malformadas ou de
// tickers não solicitados são ignoradas silenciosamente (mesmo
// comportamento fail-open de linha individual de `parseCotahistQuotes`) -
// o arquivo anual inteiro tem ~250 mil linhas, maioria irrelevante pro
// universo fechado de 5 ações.
export function parseCotahistAnnualCloseSeriesV1(
  content: string,
  requestedTickers: readonly string[]
): Map<string, CotahistAnnualCloseRecord[]> {
  const requested = new Set(
    requestedTickers.map((ticker) => ticker.trim().toUpperCase())
  )
  const seriesByTicker = new Map<string, CotahistAnnualCloseRecord[]>()

  for (const line of content.split(/\r?\n/)) {
    let record: CotahistAnnualCloseRecord | null
    try {
      record = parseCotahistLine(line)
    } catch {
      continue
    }

    if (!record || !requested.has(record.ticker)) {
      continue
    }

    const existing = seriesByTicker.get(record.ticker)
    if (existing) {
      existing.push(record)
    } else {
      seriesByTicker.set(record.ticker, [record])
    }
  }

  for (const series of seriesByTicker.values()) {
    series.sort((left, right) =>
      left.tradingDate < right.tradingDate ? -1 : 1
    )
  }

  return seriesByTicker
}
