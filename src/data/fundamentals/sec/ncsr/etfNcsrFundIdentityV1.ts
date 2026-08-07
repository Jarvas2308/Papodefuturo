// Identidade documental de cada ETF do universo fechado dentro do N-CSR
// anual da SEC (DEC-103).
//
// Um N-CSR não é um documento por ETF: é o relatório anual do TRUST, e um
// trust empacota vários fundos, cada fundo com várias classes de cota
// (Investor, Admiral, Institutional, ETF...). O bloco "Financial
// Highlights" que interessa é o do PAR (nome do fundo, rótulo da classe
// ETF) - por isso a associação aqui é por nome exato de fundo e rótulo
// exato de classe, nunca por "a primeira tabela de Financial Highlights
// do documento".
//
// Os três pares abaixo foram confirmados contra os filings reais de
// 2026 (ver `testFixtures.ts` para as URLs e accessions). Repare que o
// rótulo da classe ETF de VEA NÃO é "ETF Shares" - a Vanguard usa
// "FTSE Developed Markets ETF Shares" naquele fundo. Isso é exatamente o
// motivo de o rótulo ser dado do registry e não uma constante global.
//
// `registrantCik` repete o valor já versionado em
// `src/domain/context/official-events/assetIdentities.ts` - aqui ele
// serve só para montar a URL do EDGAR no script de backfill; a fonte de
// verdade da identidade regulatória continua sendo o registry de
// domínio.
export type EtfNcsrFundIdentityV1 = {
  ticker: string
  registrantCik: string
  fundName: string
  shareClassLabel: string
}

export const ETF_NCSR_FUND_IDENTITIES_V1: readonly EtfNcsrFundIdentityV1[] = [
  {
    ticker: 'VOO',
    registrantCik: '0000036405',
    fundName: '500 Index Fund',
    shareClassLabel: 'ETF Shares',
  },
  {
    ticker: 'VNQ',
    registrantCik: '0000734383',
    fundName: 'Real Estate Index Fund',
    shareClassLabel: 'ETF Shares',
  },
  {
    ticker: 'VEA',
    registrantCik: '0000923202',
    fundName: 'Developed Markets Index Fund',
    shareClassLabel: 'FTSE Developed Markets ETF Shares',
  },
] as const

export function findEtfNcsrFundIdentityV1(
  ticker: string
): EtfNcsrFundIdentityV1 | null {
  return (
    ETF_NCSR_FUND_IDENTITIES_V1.find(
      (identity) => identity.ticker === ticker
    ) ?? null
  )
}
