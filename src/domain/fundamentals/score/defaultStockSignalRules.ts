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
]
