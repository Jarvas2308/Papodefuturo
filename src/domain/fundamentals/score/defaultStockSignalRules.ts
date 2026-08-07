import type { SignalRuleV1 } from './types'

// Faixas de partida para o unico sinal de ação ja calculavel (Fase 5) -
// docs/reference/REGRAS_DE_PONTUACAO_RASCUNHO.md, secao 3. Mesma
// convencao de min inclusivo / max exclusivo de defaultFiiSignalRules.ts.
export const DEFAULT_STOCK_SIGNAL_RULES: readonly SignalRuleV1[] = [
  // ROE (escala FUNDAMENTAL_RATIO_SCALE = 1e6; 150_000 = 15%).
  {
    signalKey: 'stock_roe',
    minValue: null,
    maxValue: 80_000,
    points: -1,
    enabled: true,
  },
  {
    signalKey: 'stock_roe',
    minValue: 80_000,
    maxValue: 150_000,
    points: 0,
    enabled: true,
  },
  {
    signalKey: 'stock_roe',
    minValue: 150_000,
    maxValue: null,
    points: 2,
    enabled: true,
  },
  // Dívida líquida / EBITDA (escala FUNDAMENTAL_RATIO_SCALE = 1e6;
  // 1_000_000 = 1x). Faixas do rascunho: >3x penaliza, <1x premia
  // (docs/reference/REGRAS_DE_PONTUACAO_RASCUNHO.md, seção 3). Negativo
  // (posição de caixa líquido) cai no primeiro intervalo, premiado.
  {
    signalKey: 'stock_net_debt_to_ebitda',
    minValue: null,
    maxValue: 1_000_000,
    points: 1,
    enabled: true,
  },
  {
    signalKey: 'stock_net_debt_to_ebitda',
    minValue: 1_000_000,
    maxValue: 3_000_000,
    points: 0,
    enabled: true,
  },
  {
    signalKey: 'stock_net_debt_to_ebitda',
    minValue: 3_000_000,
    maxValue: null,
    points: -1,
    enabled: true,
  },
  // Payout, variação ano contra ano, em pontos percentuais (observedValue
  // já vem dividido por PERCENTAGE_POINT_SCALE_DIVISOR em
  // buildBrazilianStockScoreV1.ts). Faixas do rascunho, seção 3/3.7:
  // queda > 10 p.p. penaliza, dentro de ±5 p.p. do próprio regime é
  // neutro. Deliberadamente sem faixa pra zona ambígua entre -10 e -5 ou
  // acima de +5 - nenhum limiar fixo de nível, só de variação (TAEE11
  // 90-100% normal, WEGE3 baixo normal quebrariam régua de nível única).
  {
    signalKey: 'stock_payout_yoy_change',
    minValue: null,
    maxValue: -10,
    points: -2,
    enabled: true,
  },
  {
    signalKey: 'stock_payout_yoy_change',
    minValue: -5,
    maxValue: 5,
    points: 0,
    enabled: true,
  },
  // P/L vs própria série histórica (docs/reference/REGRAS_DE_PONTUACAO_RASCUNHO.md,
  // seção 3): "abaixo do próprio quartil inferior" pontua +1. observedValue
  // já vem como desvio (P/L atual − quartil inferior da própria série,
  // escala FUNDAMENTAL_RATIO_SCALE) em buildBrazilianStockScoreV1.ts -
  // mesmo truque de computeEtfCapeDeviationV1: limiar fixo em zero
  // representa "abaixo do próprio marco histórico" mesmo o marco sendo
  // dinâmico por ativo. Igual ao quartil (desvio = 0) não pontua - só
  // estritamente abaixo.
  {
    signalKey: 'stock_pl_vs_history',
    minValue: null,
    maxValue: 0,
    points: 1,
    enabled: true,
  },
]
