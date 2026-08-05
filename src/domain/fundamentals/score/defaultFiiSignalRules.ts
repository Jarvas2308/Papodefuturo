import type { SignalRuleV1 } from './types'

// Faixas de partida para os 3 sinais de FII tijolo ja calculaveis (Fase 5,
// fatia 1) - docs/reference/REGRAS_DE_PONTUACAO_RASCUNHO.md, secao 1.
// Rascunho explicito: "limiares numericos sao ponto de partida proposto,
// nao recomendacao - escolha de corte e sua, edite livremente". Estes
// valores viram linhas reais em `signal_rules` (por usuario, editavel via
// SignalRuleRepository) - nao sao hardcoded no motor.
//
// fii_wale_months e' substituicao documentada: o rascunho original pede
// "% da receita vencendo em 24 meses" (+1 se <20%, -1 se >50%), metrica que
// nao foi ingerida (Fase 2 ingeriu WALE em meses, nao o bucket de receita
// por vencimento). Direcao do sinal se inverte: WALE mais longo = menos
// risco de vacancia por vencimento de contrato = pontos positivos. Limiares
// (48/24 meses) sao um ponto de partida tao arbitrario quanto os do
// rascunho original - editavel do mesmo jeito.
export const DEFAULT_FII_TIJOLO_SIGNAL_RULES: readonly SignalRuleV1[] = [
  // Vacancia financeira (basis points, 10000 = 100%).
  {
    signalKey: 'fii_vacancy',
    minValue: null,
    maxValue: 500,
    points: 1,
    enabled: true,
  },
  {
    signalKey: 'fii_vacancy',
    minValue: 500,
    maxValue: 1_500,
    points: 0,
    enabled: true,
  },
  {
    signalKey: 'fii_vacancy',
    minValue: 1_500,
    maxValue: null,
    points: -1,
    enabled: true,
  },

  // Concentracao do maior inquilino (basis points da receita do imovel).
  {
    signalKey: 'fii_tenant_concentration',
    minValue: 4_000,
    maxValue: null,
    points: -1,
    enabled: true,
  },

  // WALE, em meses x100 (ex.: 4800 = 48 meses).
  {
    signalKey: 'fii_wale_months',
    minValue: null,
    maxValue: 2_400,
    points: -1,
    enabled: true,
  },
  {
    signalKey: 'fii_wale_months',
    minValue: 2_400,
    maxValue: 4_800,
    points: 0,
    enabled: true,
  },
  {
    signalKey: 'fii_wale_months',
    minValue: 4_800,
    maxValue: null,
    points: 1,
    enabled: true,
  },
]
