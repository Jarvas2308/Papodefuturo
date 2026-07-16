import type { CvmRealEstateFund } from './types'

export const CVM_REAL_ESTATE_FUNDS = [
  {
    ticker: 'KNRI11',
    officialName: 'KINEA RENDA IMOBILIARIA FII RESPONSABILIDADE LIMITADA',
    cnpj: '12.005.956/0001-65',
    isin: 'BRKNRICTF007',
    category: 'real-estate-fund',
    market: 'BR',
  },
  {
    ticker: 'VISC11',
    officialName:
      'VINCI SHOPPING CENTERS FUNDO DE INVESTIMENTO IMOBILIÁRIO-FII',
    cnpj: '17.554.274/0001-25',
    isin: 'BRVISCCTF005',
    category: 'real-estate-fund',
    market: 'BR',
  },
  {
    ticker: 'XPLG11',
    officialName: 'XP LOG FII RL',
    cnpj: '26.502.794/0001-85',
    isin: 'BRXPLGCTF002',
    category: 'real-estate-fund',
    market: 'BR',
  },
  {
    ticker: 'HGRU11',
    officialName: 'PÁTRIA RENDA URBANA - FUNDO DE INVESTIMENTO IMOBILIÁRIO',
    cnpj: '29.641.226/0001-53',
    isin: 'BRHGRUCTF002',
    category: 'real-estate-fund',
    market: 'BR',
  },
] as const satisfies readonly CvmRealEstateFund[]

export function getCvmRealEstateFund(ticker: string): CvmRealEstateFund {
  const normalizedTicker = ticker.trim().toUpperCase()
  const fund = CVM_REAL_ESTATE_FUNDS.find(
    (candidate) => candidate.ticker === normalizedTicker
  )

  if (!fund) {
    throw new Error(`Unsupported CVM real estate fund ticker: ${ticker}`)
  }

  return { ...fund }
}
