// Wiring do motor de score (Sprint 16, Fase 5/6/7, DEC-085 a DEC-090) no
// fluxo real de aporte - puro, sem I/O, para ser testavel sem mocks de rede.
import {
  buildBrazilianStockScoreV1,
  buildFiiTijoloScoreV1,
} from '../../../domain/fundamentals/score'
import type {
  AssetScoreV1,
  SignalRuleV1,
} from '../../../domain/fundamentals/score'
import type {
  FundamentalDerivedFactsV1,
  FundamentalFactsV1,
} from '../../../domain/fundamentals'
import type { Asset, AssetPrice } from '../../../domain/models'
import type {
  SignalRule,
  CreateSignalRuleInput,
} from '../../../data/repositories/contracts'
import {
  DEFAULT_FII_TIJOLO_SIGNAL_RULES,
  DEFAULT_STOCK_SIGNAL_RULES,
} from '../../../domain/fundamentals/score'
import type { ContributionAssetScore } from '../types'

const DEFAULT_SIGNAL_RULES: readonly SignalRuleV1[] = [
  ...DEFAULT_FII_TIJOLO_SIGNAL_RULES,
  ...DEFAULT_STOCK_SIGNAL_RULES,
]

// Semeia as faixas de partida (docs/reference/REGRAS_DE_PONTUACAO_RASCUNHO.md)
// na primeira vez que o usuario usa o motor de score - a tabela signal_rules
// e' vazia por design (migration 20260804190000). Identidade por signalKey
// inteiro, nao por linha: se o usuario ja tem QUALQUER regra pra um sinal,
// as faixas default daquele sinal nao sao reinseridas (o sinal e' tratado
// como ja customizado, nao mesclado com o default).
export function getMissingDefaultFiiSignalRules(
  existingRules: readonly SignalRule[]
): CreateSignalRuleInput[] {
  const existingSignalKeys = new Set(
    existingRules.map((rule) => rule.signalKey)
  )
  return DEFAULT_SIGNAL_RULES.filter(
    (rule) => !existingSignalKeys.has(rule.signalKey)
  )
}

// Calcula o score real por ativo elegivel (FII tijolo - Fase 5 fatia 1 -
// e acao, ROE - Fase 5 fatia 2, DEC-090) a partir do dossie de fundamentos
// ja carregado, das regras do usuario e da cotacao mais recente. Ativos
// fora do escopo (ETF, FII papel/FOF, acao holding) simplesmente nao
// entram no array - equivalente a score 0 no laco guloso (buildScoreByIndex
// trata ausencia como 0), sem forcar um calculo que nao faz sentido pra eles.
export function buildContributionAssetScoresV1(input: {
  assets: readonly Asset[]
  facts: FundamentalFactsV1
  derived: FundamentalDerivedFactsV1
  latestPricesByAsset: ReadonlyMap<string, AssetPrice>
  rules: readonly SignalRuleV1[]
  now: string
}): AssetScoreV1[] {
  const scores: AssetScoreV1[] = []

  for (const asset of input.assets) {
    const factsAsset = input.facts.assets.find(
      (candidate) => candidate.assetId === asset.id
    )
    if (!factsAsset) {
      continue
    }

    if (asset.category === 'real-estate-fund' && asset.assetType === 'tijolo') {
      const derivedAsset = input.derived.assets.find(
        (candidate) => candidate.assetId === asset.id
      )
      const latestPrice = input.latestPricesByAsset.get(asset.id)
      const latestMarketPriceInMinorUnits =
        latestPrice && latestPrice.price.currency === 'BRL'
          ? latestPrice.price.amountInMinorUnits
          : null

      scores.push(
        buildFiiTijoloScoreV1({
          asset: factsAsset,
          derivedAsset,
          latestMarketPriceInMinorUnits,
          assetType: asset.assetType,
          rules: input.rules,
          now: input.now,
        })
      )
      continue
    }

    if (asset.category === 'brazilian-stock') {
      scores.push(
        buildBrazilianStockScoreV1({
          asset: factsAsset,
          assetSegment: asset.assetSegment ?? null,
          rules: input.rules,
          now: input.now,
        })
      )
    }
  }

  return scores
}

// Reducao para o formato simplificado que o laco guloso consome
// (targetAllocationStrategy.ts so precisa do total, nao da quebra por
// sinal - a quebra completa vai pro dossie tecnico, DEC-087).
export function toContributionAssetScores(
  scores: readonly AssetScoreV1[]
): ContributionAssetScore[] {
  return scores.map((score) => ({
    assetId: score.assetId,
    points: score.totalPoints,
  }))
}
