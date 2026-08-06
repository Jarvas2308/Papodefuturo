import type { BrazilianStockOfficialEventTickerV1 } from '../../../domain/context/official-events/types'

// Resolve qual ISIN de provento_declaration_values pertence a cada
// ticker de ação brasileira - official_asset_events.isin fica sempre
// null pra brazilian-stock (só a identidade de real-estate-fund carrega
// ISIN, ver types.ts), e nenhum dado do CVM IPE ja ingerido resolve
// isso. Sem esse mapeamento os sinais de provento (spread DY de FII,
// payout de acao, spread DY de ETF) nao sabem qual linha ON/PN/unit do
// formulario "Provento" (que sempre traz todas as classes da empresa)
// corresponde ao ticker do ativo do usuario.
//
// Cada valor foi cross-validado nesta sessao contra o proprio ISIN que
// ja apareceu nas linhas reais extraidas do formulario "Provento" da
// CVM (producao, backfill de 06/08/2026) - nao e um valor inventado,
// so a confirmacao de qual das linhas (ON/PN/unit) e a certa pro
// ticker. Fontes externas de confirmacao, mesmo ISIN em ambas:
//   BBAS3  -> BRBBASACNOR3 (statusinvest.com.br/acoes/bbas3)
//   ITSA4  -> BRITSAACNPR7 (divvydiary.com/en/itausa-investimentos-itau-stock-BRITSAACNPR7)
//   PSSA3  -> BRPSSAACNOR7 (meusdividendos.com/empresa/PSSA)
//   TAEE11 -> BRTAEECDAM10 (statusinvest.com.br/acoes/taee11)
//   WEGE3  -> BRWEGEACNOR0 (sistemaswebb3-listados.b3.com.br, CodCVM=5410)
//
// BBAS3 tambem apareceu com BRBBASA04OR8 e BRBBASA05OR5 nas linhas do
// formulario "Provento" (protocolos mais antigos) - ISINs legados de
// antes de uma reestruturacao societaria, nao o ISIN vigente. Ignorados
// de proposito: o mapeamento aqui e sempre o ISIN atual/negociado, nao
// todo ISIN que ja apareceu historicamente num documento.
export const BRAZILIAN_STOCK_TICKER_ISIN_V1: Record<
  BrazilianStockOfficialEventTickerV1,
  string
> = {
  BBAS3: 'BRBBASACNOR3',
  ITSA4: 'BRITSAACNPR7',
  TAEE11: 'BRTAEECDAM10',
  WEGE3: 'BRWEGEACNOR0',
  PSSA3: 'BRPSSAACNOR7',
}
