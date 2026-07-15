import type { CvmBrazilianStockCompany, CvmBrazilianStockTicker } from './types'

export const CVM_BRAZILIAN_STOCK_COMPANIES = [
  {
    ticker: 'BBAS3',
    officialName: 'BCO BRASIL S.A.',
    cvmCode: '001023',
    cnpj: '00.000.000/0001-91',
  },
  {
    ticker: 'ITSA4',
    officialName: 'ITAÚSA S.A.',
    cvmCode: '007617',
    cnpj: '61.532.644/0001-15',
  },
  {
    ticker: 'TAEE11',
    officialName: 'TRANSMISSORA ALIANÇA DE ENERGIA ELÉTRICA S.A.',
    cvmCode: '020257',
    cnpj: '07.859.971/0001-30',
  },
  {
    ticker: 'WEGE3',
    officialName: 'WEG S.A.',
    cvmCode: '005410',
    cnpj: '84.429.695/0001-11',
  },
  {
    ticker: 'PSSA3',
    officialName: 'PORTO SEGURO S.A.',
    cvmCode: '016659',
    cnpj: '02.149.205/0001-69',
  },
] as const satisfies readonly CvmBrazilianStockCompany[]

export function getCvmBrazilianStockCompany(
  ticker: string
): CvmBrazilianStockCompany {
  const normalizedTicker = ticker.trim().toUpperCase()
  const company = CVM_BRAZILIAN_STOCK_COMPANIES.find(
    (candidate) => candidate.ticker === normalizedTicker
  )

  if (!company) {
    throw new Error(`Unsupported CVM Brazilian stock ticker: ${ticker}`)
  }

  return { ...company, ticker: company.ticker as CvmBrazilianStockTicker }
}
