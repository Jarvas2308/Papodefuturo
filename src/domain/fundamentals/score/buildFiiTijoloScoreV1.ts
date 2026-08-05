// Motor de score, fatia 1 (FII tijolo) - Sprint 16, Fase 5 (DEC-085/DEC-086).
//
// Cobre 4 dos 6 sinais de docs/reference/REGRAS_DE_PONTUACAO_RASCUNHO.md
// (secao 1): vacancia financeira, concentracao do maior inquilino, WALE
// (usado como substituto documentado de "receita vencendo em 24 meses" -
// ver defaultFiiSignalRules.ts) e P/VP (preco de mercado / VP por cota
// derivado, DEC-086). Spread de DY sobre NTN-B (precisa valor de provento,
// ainda nao extraido - DEC-082) fica para a proxima fatia. FII papel e FOF
// nao existem no universo fechado hoje - regime errado sempre gera
// 'wrong-regime', nunca um numero.
import type { FiiAssetType } from '../../models/asset'
import { computeFiiPvpScaledV1 } from './computeFiiPvpScaledV1'
import type {
  FundamentalDerivedFactsAsset,
  ScaledMonetaryPerQuantity,
} from '../derived/types'
import type { FundamentalFactsAsset } from '../types'
import type { AssetScoreSignal, AssetScoreV1, SignalRuleV1 } from './types'
import { ASSET_SCORE_V1_SCHEMA_VERSION } from './types'

export type FiiTijoloSignalKey =
  'fii_vacancy' | 'fii_tenant_concentration' | 'fii_wale_months' | 'fii_pvp'

type LatestTrimestralFacts = {
  vacancyInBasisPoints: number | null
  tenantConcentrationInBasisPoints: number | null
  waleMonthsScaledBy100: number | null
}

function extractLatestTrimestralFacts(
  asset: FundamentalFactsAsset
): LatestTrimestralFacts {
  const trimestralSnapshots = asset.snapshots.filter(
    (snapshot) =>
      snapshot.kind === 'real-estate-fund' &&
      snapshot.source === 'cvm-fii-inf-trimestral'
  )

  const latest = trimestralSnapshots.reduce<
    (typeof trimestralSnapshots)[number] | null
  >((best, snapshot) => {
    if (best === null || snapshot.referenceDate > best.referenceDate) {
      return snapshot
    }
    return best
  }, null)

  if (latest === null || latest.kind !== 'real-estate-fund') {
    return {
      vacancyInBasisPoints: null,
      tenantConcentrationInBasisPoints: null,
      waleMonthsScaledBy100: null,
    }
  }

  return {
    vacancyInBasisPoints: latest.facts.vacancyInBasisPoints,
    tenantConcentrationInBasisPoints:
      latest.facts.tenantConcentrationInBasisPoints,
    waleMonthsScaledBy100: latest.facts.waleMonthsScaledBy100,
  }
}

function extractLatestNavPerShare(
  derivedAsset: FundamentalDerivedFactsAsset | undefined
): ScaledMonetaryPerQuantity | null {
  if (!derivedAsset) {
    return null
  }
  type RealEstateFundSnapshot = Extract<
    FundamentalDerivedFactsAsset['snapshots'][number],
    { kind: 'real-estate-fund' }
  >
  const monthlySnapshots = derivedAsset.snapshots.filter(
    (snapshot): snapshot is RealEstateFundSnapshot =>
      snapshot.kind === 'real-estate-fund' &&
      snapshot.source === 'cvm-fii-inf-mensal'
  )
  const latest = monthlySnapshots.reduce<RealEstateFundSnapshot | null>(
    (best, snapshot) => {
      if (best === null || snapshot.referenceDate > best.referenceDate) {
        return snapshot
      }
      return best
    },
    null
  )
  const metric = latest?.metrics.netAssetValuePerIssuedShare
  return metric && metric.status === 'available' ? metric.value : null
}

function findMatchingRule(
  rules: readonly SignalRuleV1[],
  signalKey: string,
  value: number
): SignalRuleV1 | null {
  return (
    rules.find(
      (rule) =>
        rule.signalKey === signalKey &&
        rule.enabled &&
        (rule.minValue === null || value >= rule.minValue) &&
        (rule.maxValue === null || value < rule.maxValue)
    ) ?? null
  )
}

function scoreSignal(
  signalKey: FiiTijoloSignalKey,
  value: number | null,
  rules: readonly SignalRuleV1[]
): AssetScoreSignal {
  if (value === null) {
    return { signalKey, status: 'unavailable', reason: 'missing-input' }
  }
  const rule = findMatchingRule(rules, signalKey, value)
  return {
    signalKey,
    status: 'applied',
    observedValue: value,
    points: rule?.points ?? 0,
  }
}

function scorePvpSignal(
  navPerShare: ScaledMonetaryPerQuantity | null,
  marketPriceInMinorUnits: number | null,
  rules: readonly SignalRuleV1[]
): AssetScoreSignal {
  if (
    navPerShare === null ||
    marketPriceInMinorUnits === null ||
    marketPriceInMinorUnits <= 0
  ) {
    return {
      signalKey: 'fii_pvp',
      status: 'unavailable',
      reason: 'missing-input',
    }
  }
  const pvpScaled = computeFiiPvpScaledV1({
    marketPriceInMinorUnits,
    netAssetValuePerIssuedShare: navPerShare,
  })
  const rule = findMatchingRule(rules, 'fii_pvp', pvpScaled)
  return {
    signalKey: 'fii_pvp',
    status: 'applied',
    observedValue: pvpScaled,
    points: rule?.points ?? 0,
  }
}

export function buildFiiTijoloScoreV1(input: {
  asset: FundamentalFactsAsset
  derivedAsset?: FundamentalDerivedFactsAsset
  latestMarketPriceInMinorUnits?: number | null
  assetType: FiiAssetType | null
  rules: readonly SignalRuleV1[]
}): AssetScoreV1 {
  const signalKeys: FiiTijoloSignalKey[] = [
    'fii_vacancy',
    'fii_tenant_concentration',
    'fii_wale_months',
    'fii_pvp',
  ]

  if (input.assetType !== 'tijolo') {
    const signals = signalKeys.map((signalKey): AssetScoreSignal => ({
      signalKey,
      status: 'unavailable',
      reason: 'wrong-regime',
    }))
    return {
      schemaVersion: ASSET_SCORE_V1_SCHEMA_VERSION,
      assetId: input.asset.assetId,
      totalPoints: 0,
      signals,
    }
  }

  const facts = extractLatestTrimestralFacts(input.asset)
  const navPerShare = extractLatestNavPerShare(input.derivedAsset)
  const signals: AssetScoreSignal[] = [
    scoreSignal('fii_vacancy', facts.vacancyInBasisPoints, input.rules),
    scoreSignal(
      'fii_tenant_concentration',
      facts.tenantConcentrationInBasisPoints,
      input.rules
    ),
    scoreSignal('fii_wale_months', facts.waleMonthsScaledBy100, input.rules),
    scorePvpSignal(
      navPerShare,
      input.latestMarketPriceInMinorUnits ?? null,
      input.rules
    ),
  ]

  const totalPoints = signals.reduce(
    (sum, signal) => sum + (signal.status === 'applied' ? signal.points : 0),
    0
  )

  return {
    schemaVersion: ASSET_SCORE_V1_SCHEMA_VERSION,
    assetId: input.asset.assetId,
    totalPoints,
    signals,
  }
}
