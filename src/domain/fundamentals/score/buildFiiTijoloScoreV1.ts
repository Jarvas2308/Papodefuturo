// Motor de score, fatia 1 (FII tijolo) - Sprint 16, Fase 5 (DEC-085).
//
// So cobre os 3 sinais de docs/reference/REGRAS_DE_PONTUACAO_RASCUNHO.md
// (secao 1) que ja tem dado real ingerido sem depender de cotacao de
// mercado: vacancia financeira, concentracao do maior inquilino e WALE
// (usado como substituto documentado de "receita vencendo em 24 meses" -
// ver defaultFiiSignalRules.ts). P/VP (precisa preco de mercado) e spread
// de DY sobre NTN-B (precisa valor de provento, ainda nao extraido -
// DEC-082) ficam para as proximas fatias. FII papel e FOF nao existem no
// universo fechado hoje - regime errado sempre gera 'wrong-regime', nunca
// um numero.
import type { FiiAssetType } from '../../models/asset'
import type { FundamentalFactsAsset } from '../types'
import type { AssetScoreSignal, AssetScoreV1, SignalRuleV1 } from './types'
import { ASSET_SCORE_V1_SCHEMA_VERSION } from './types'

export type FiiTijoloSignalKey =
  'fii_vacancy' | 'fii_tenant_concentration' | 'fii_wale_months'

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

export function buildFiiTijoloScoreV1(input: {
  asset: FundamentalFactsAsset
  assetType: FiiAssetType | null
  rules: readonly SignalRuleV1[]
}): AssetScoreV1 {
  const signalKeys: FiiTijoloSignalKey[] = [
    'fii_vacancy',
    'fii_tenant_concentration',
    'fii_wale_months',
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
  const signals: AssetScoreSignal[] = [
    scoreSignal('fii_vacancy', facts.vacancyInBasisPoints, input.rules),
    scoreSignal(
      'fii_tenant_concentration',
      facts.tenantConcentrationInBasisPoints,
      input.rules
    ),
    scoreSignal('fii_wale_months', facts.waleMonthsScaledBy100, input.rules),
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
