// Wiring do motor de score (Sprint 16, Fase 5/6, DEC-085/DEC-086) no fluxo
// real de aporte - puro, sem I/O, para ser testavel sem mocks de rede.
import { buildFiiTijoloScoreV1 } from '../../../domain/fundamentals/score'
import type { SignalRuleV1 } from '../../../domain/fundamentals/score'
import type {
  FundamentalDerivedFactsV1,
  FundamentalFactsV1,
} from '../../../domain/fundamentals'
import type { Asset, AssetPrice } from '../../../domain/models'
import type {
  SignalRule,
  CreateSignalRuleInput,
} from '../../../data/repositories/contracts'
import { DEFAULT_FII_TIJOLO_SIGNAL_RULES } from '../../../domain/fundamentals/score'
import type { ContributionAssetScore } from '../types'

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
  return DEFAULT_FII_TIJOLO_SIGNAL_RULES.filter(
    (rule) => !existingSignalKeys.has(rule.signalKey)
  )
}

// Calcula o score real por ativo elegivel (hoje: so FII tijolo, fatia 1 da
// Fase 5) a partir do dossie de fundamentos ja carregado, das regras do
// usuario e da cotacao mais recente. Ativos fora do escopo (acao, ETF, FII
// papel/FOF) simplesmente nao entram no array - equivalente a score 0 no
// laco guloso (buildScoreByIndex trata ausencia como 0), sem forcar um
// calculo que nao faz sentido pra eles.
export function buildContributionAssetScoresV1(input: {
  assets: readonly Asset[]
  facts: FundamentalFactsV1
  derived: FundamentalDerivedFactsV1
  latestPricesByAsset: ReadonlyMap<string, AssetPrice>
  rules: readonly SignalRuleV1[]
}): ContributionAssetScore[] {
  const scores: ContributionAssetScore[] = []

  for (const asset of input.assets) {
    if (asset.category !== 'real-estate-fund' || asset.assetType !== 'tijolo') {
      continue
    }

    const factsAsset = input.facts.assets.find(
      (candidate) => candidate.assetId === asset.id
    )
    if (!factsAsset) {
      continue
    }

    const derivedAsset = input.derived.assets.find(
      (candidate) => candidate.assetId === asset.id
    )
    const latestPrice = input.latestPricesByAsset.get(asset.id)
    const latestMarketPriceInMinorUnits =
      latestPrice && latestPrice.price.currency === 'BRL'
        ? latestPrice.price.amountInMinorUnits
        : null

    const score = buildFiiTijoloScoreV1({
      asset: factsAsset,
      derivedAsset,
      latestMarketPriceInMinorUnits,
      assetType: asset.assetType,
      rules: input.rules,
    })

    scores.push({ assetId: asset.id, points: score.totalPoints })
  }

  return scores
}
