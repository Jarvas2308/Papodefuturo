// Premio/desconto de ETF sobre o NAV - Sprint 16, Fase 4 fatia ETF (DEC-092).
//
// Fonte: site do proprio emissor (investor.vanguard.com), nao um filing SEC.
// N-PORT foi inspecionado com dado real e confirmado sem NAV por cota nem
// cotas em circulacao (DEC-083) - a Rule 6c-11 da SEC obriga o proprio ETF a
// publicar NAV, preco de mercado e premio/desconto diariamente no site, e
// esse e' o mecanismo usado aqui: endpoint JSON nao documentado por tras da
// pagina publica do fundo (sem autenticacao, confirmado com fetch direto,
// mesmo dado exibido na pagina). Diferente de CVM/SEC, sem accession number
// nem identidade documental formal - a proveniencia possivel e' a URL e a
// data de referencia que a propria Vanguard atribui ao dado (`effectiveDate`).
//
// Risco aceito explicitamente pelo usuario: endpoint interno, sem contrato
// publico, pode mudar ou parar de responder sem aviso. Validacao estrita
// abaixo falha fechado (erro, nunca dado silenciosamente errado) se o
// formato mudar.
export type VanguardEtfTicker = 'VOO' | 'VNQ' | 'VEA'

// Fund Number da Vanguard por ticker, confirmado na pagina publica de cada
// fundo (investor.vanguard.com/investment-products/etfs/profile/<ticker>,
// secao "Key facts", 05/08/2026). Universo fechado, mesmo dos 3 ETFs do
// registry geral.
const VANGUARD_FUND_NUMBER_BY_TICKER: Record<VanguardEtfTicker, string> = {
  VOO: '0968',
  VNQ: '0986',
  VEA: '0936',
}

const USER_AGENT = 'PapoDeFuturo-MarketData/1.0 (contato: lflln23@gmail.com)'

export type VanguardPremiumDiscountQuote = {
  ticker: VanguardEtfTicker
  effectiveDate: string
  premiumDiscountBasisPoints: number
  source: 'vanguard-site'
}

type PdDetailRaw = {
  nav: number
  marketPrice: number
  premiumDiscountPercentage: number
  premiumDiscountAmount: number
  effectiveDate: string
}

function isPdDetailRaw(value: unknown): value is PdDetailRaw {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>
  return (
    typeof record.nav === 'number' &&
    typeof record.marketPrice === 'number' &&
    typeof record.premiumDiscountPercentage === 'number' &&
    typeof record.premiumDiscountAmount === 'number' &&
    typeof record.effectiveDate === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(record.effectiveDate)
  )
}

export function parseVanguardPremiumDiscount(
  rawText: string,
  ticker: VanguardEtfTicker
): VanguardPremiumDiscountQuote {
  let parsed: unknown

  try {
    parsed = JSON.parse(rawText)
  } catch {
    throw new Error('Resposta da Vanguard não é um JSON válido.')
  }

  const pdDetails =
    typeof parsed === 'object' && parsed !== null
      ? (parsed as { pdDetails?: unknown }).pdDetails
      : undefined

  if (!Array.isArray(pdDetails) || pdDetails.length === 0) {
    throw new Error('Resposta da Vanguard sem "pdDetails".')
  }

  const validDetails = pdDetails.filter(isPdDetailRaw)

  if (validDetails.length === 0) {
    throw new Error(
      'Nenhum item de "pdDetails" da Vanguard tem o formato esperado.'
    )
  }

  const latest = validDetails.reduce((best, item) =>
    item.effectiveDate > best.effectiveDate ? item : best
  )

  // Fonte publica no maximo 2 casas decimais de percentual (amostra real
  // confirmada em 05/08/2026). Multiplicar por 100 e arredondar recupera o
  // inteiro exato de basis points sem erro de ponto flutuante perceptivel
  // nessa faixa de valores (dezenas de pontos-base, nunca milhoes).
  const basisPoints = Math.round(latest.premiumDiscountPercentage * 100)

  if (!Number.isSafeInteger(basisPoints)) {
    throw new Error(
      `Prêmio/desconto fora do intervalo seguro: ${latest.premiumDiscountPercentage}`
    )
  }

  return {
    ticker,
    effectiveDate: latest.effectiveDate,
    premiumDiscountBasisPoints: basisPoints,
    source: 'vanguard-site',
  }
}

type FetchLike = typeof fetch

export type VanguardEtfValuationProvider = {
  getPremiumDiscount(
    ticker: VanguardEtfTicker
  ): Promise<VanguardPremiumDiscountQuote>
}

export function createVanguardEtfValuationProvider(
  fetchImplementation: FetchLike = fetch
): VanguardEtfValuationProvider {
  return {
    async getPremiumDiscount(ticker) {
      const fundNumber = VANGUARD_FUND_NUMBER_BY_TICKER[ticker]
      const url = `https://investor.vanguard.com/vmf/api/${fundNumber}/premium-discount/CURR`
      const response = await fetchImplementation(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      })

      if (!response.ok) {
        throw new Error(
          `Vanguard respondeu ${response.status} ao consultar prêmio/desconto de ${ticker}.`
        )
      }

      const rawText = await response.text()
      return parseVanguardPremiumDiscount(rawText, ticker)
    },
  }
}
