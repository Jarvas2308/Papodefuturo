import type { SignalRuleV1 } from './types'

// Faixa de partida para o unico sinal de ETF ja calculavel (Fase 5) -
// docs/reference/REGRAS_DE_PONTUACAO_RASCUNHO.md, secao 4. O sinal e' o
// DESVIO (CAPE atual - media de 10 anos), nao o CAPE em si - abaixo de
// zero (CAPE atual abaixo da propria media) pontua positivo, acima pontua
// negativo. Mesma convencao min inclusivo / max exclusivo das outras
// classes de ativo.
export const DEFAULT_ETF_SIGNAL_RULES: readonly SignalRuleV1[] = [
  {
    signalKey: 'etf_cape_vs_10y_avg',
    minValue: null,
    maxValue: 0,
    points: 2,
    enabled: true,
  },
  {
    signalKey: 'etf_cape_vs_10y_avg',
    minValue: 0,
    maxValue: null,
    points: -1,
    enabled: true,
  },
  // Prêmio/desconto sobre o NAV (Fase 4 fatia ETF, DEC-092) -
  // docs/reference/REGRAS_DE_PONTUACAO_RASCUNHO.md, secao 6.1: só o
  // desvio ACIMA de 0,5% em módulo (50 basis points) penaliza - dentro da
  // faixa normal de tracking, o sinal fica neutro (nenhuma regra bate,
  // findMatchingRule devolve 0 pontos). Duas regras porque o desvio pode
  // ser positivo (prêmio) ou negativo (desconto) - a rascunho não
  // distingue direção, só magnitude.
  {
    signalKey: 'etf_premium_discount_vs_nav',
    minValue: null,
    maxValue: -50,
    points: -1,
    enabled: true,
  },
  {
    signalKey: 'etf_premium_discount_vs_nav',
    minValue: 50,
    maxValue: null,
    points: -1,
    enabled: true,
  },
]
