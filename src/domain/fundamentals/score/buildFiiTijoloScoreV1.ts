// Motor de score, fatia 1 (FII tijolo) - Sprint 16, Fase 5 (DEC-085/DEC-086/DEC-089;
// spread DY-NTNB, DEC-097, nesta entrada).
//
// Cobre 5 dos 6 sinais de docs/reference/REGRAS_DE_PONTUACAO_RASCUNHO.md
// (secao 1): vacancia financeira, concentracao do maior inquilino, WALE
// (usado como substituto documentado de "receita vencendo em 24 meses" -
// ver defaultFiiSignalRules.ts), P/VP (preco de mercado / VP por cota
// derivado, DEC-086) e spread de DY sobre NTN-B longa (DY trailing-12-meses
// do Percentual_Dividend_Yield_Mes do Informe Mensal complemento da CVM,
// nunca extraido ate agora - menos a taxa NTN-B ja em producao via Tesouro
// Transparente, DEC-075). FII papel e FOF nao existem no universo fechado
// hoje - regime errado sempre gera 'wrong-regime', nunca um numero. Dado
// com referenceDate mais velha que o limiar de frescor da fonte vira
// 'stale' (DEC-089), nunca 'applied' com numero desatualizado
// silenciosamente.
import type { FiiAssetType } from '../../models/asset'
import { computeFiiPvpScaledV1 } from './computeFiiPvpScaledV1'
import { computeFiiDyNtnbSpreadV1 } from './computeFiiDyNtnbSpreadV1'
import {
  computeFiiTrailingTwelveMonthDividendYieldV1,
  type FiiMonthlyDividendYieldPointV1,
} from './computeFiiTrailingTwelveMonthDividendYieldV1'
import {
  CVM_FII_TRIMESTRAL_STALE_AFTER_DAYS,
  isReferenceDateStale,
} from './staleness'
import type {
  FundamentalDerivedFactsAsset,
  ScaledMonetaryPerQuantity,
} from '../derived/types'
import type { FundamentalFactsAsset } from '../types'
import type { AssetScoreSignal, AssetScoreV1, SignalRuleV1 } from './types'
import { ASSET_SCORE_V1_SCHEMA_VERSION } from './types'

export type FiiTijoloSignalKey =
  | 'fii_vacancy'
  | 'fii_tenant_concentration'
  | 'fii_wale_months'
  | 'fii_pvp'
  | 'fii_dy_ntnb_spread'

type DatedValue = { value: number; referenceDate: string } | null

type LatestTrimestralFacts = {
  vacancyInBasisPoints: DatedValue
  tenantConcentrationInBasisPoints: DatedValue
  waleMonthsScaledBy100: DatedValue
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

  const referenceDate = latest.referenceDate
  const dated = (value: number | null): DatedValue =>
    value === null ? null : { value, referenceDate }

  return {
    vacancyInBasisPoints: dated(latest.facts.vacancyInBasisPoints),
    tenantConcentrationInBasisPoints: dated(
      latest.facts.tenantConcentrationInBasisPoints
    ),
    waleMonthsScaledBy100: dated(latest.facts.waleMonthsScaledBy100),
  }
}

function extractLatestNavPerShare(
  derivedAsset: FundamentalDerivedFactsAsset | undefined
): { value: ScaledMonetaryPerQuantity; referenceDate: string } | null {
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
  if (!latest || !metric || metric.status !== 'available') {
    return null
  }
  return { value: metric.value, referenceDate: latest.referenceDate }
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
  dated: DatedValue,
  rules: readonly SignalRuleV1[],
  now: string
): AssetScoreSignal {
  if (dated === null) {
    return { signalKey, status: 'unavailable', reason: 'missing-input' }
  }
  if (
    isReferenceDateStale(
      dated.referenceDate,
      now,
      CVM_FII_TRIMESTRAL_STALE_AFTER_DAYS
    )
  ) {
    return {
      signalKey,
      status: 'stale',
      observedValue: dated.value,
      referenceDate: dated.referenceDate,
      staleAfterDays: CVM_FII_TRIMESTRAL_STALE_AFTER_DAYS,
    }
  }
  const rule = findMatchingRule(rules, signalKey, dated.value)
  return {
    signalKey,
    status: 'applied',
    observedValue: dated.value,
    points: rule?.points ?? 0,
  }
}

function scorePvpSignal(
  navPerShare: {
    value: ScaledMonetaryPerQuantity
    referenceDate: string
  } | null,
  marketPriceInMinorUnits: number | null,
  rules: readonly SignalRuleV1[],
  now: string
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
    netAssetValuePerIssuedShare: navPerShare.value,
  })
  if (
    isReferenceDateStale(
      navPerShare.referenceDate,
      now,
      CVM_FII_TRIMESTRAL_STALE_AFTER_DAYS
    )
  ) {
    return {
      signalKey: 'fii_pvp',
      status: 'stale',
      observedValue: pvpScaled,
      referenceDate: navPerShare.referenceDate,
      staleAfterDays: CVM_FII_TRIMESTRAL_STALE_AFTER_DAYS,
    }
  }
  const rule = findMatchingRule(rules, 'fii_pvp', pvpScaled)
  return {
    signalKey: 'fii_pvp',
    status: 'applied',
    observedValue: pvpScaled,
    points: rule?.points ?? 0,
  }
}

function scoreFiiDyNtnbSpreadSignal(
  monthlyDividendYields: readonly FiiMonthlyDividendYieldPointV1[] | null,
  ntnbRate: { rateScaled: number; rateScale: number; pricedAt: string } | null,
  rules: readonly SignalRuleV1[],
  now: string
): AssetScoreSignal {
  const signalKey = 'fii_dy_ntnb_spread'

  if (monthlyDividendYields === null || ntnbRate === null) {
    return { signalKey, status: 'unavailable', reason: 'missing-input' }
  }

  const trailingDividendYield = computeFiiTrailingTwelveMonthDividendYieldV1({
    monthlyPoints: monthlyDividendYields,
    windowEndDate: now.slice(0, 10),
  })
  if (trailingDividendYield === null) {
    return { signalKey, status: 'unavailable', reason: 'missing-input' }
  }

  const spread = computeFiiDyNtnbSpreadV1({
    trailingTwelveMonthDividendYield: trailingDividendYield,
    ntnbRateScaled: ntnbRate.rateScaled,
    ntnbRateScale: ntnbRate.rateScale,
  })

  if (
    isReferenceDateStale(
      ntnbRate.pricedAt,
      now,
      CVM_FII_TRIMESTRAL_STALE_AFTER_DAYS
    )
  ) {
    return {
      signalKey,
      status: 'stale',
      observedValue: spread,
      referenceDate: ntnbRate.pricedAt,
      staleAfterDays: CVM_FII_TRIMESTRAL_STALE_AFTER_DAYS,
    }
  }

  const rule = findMatchingRule(rules, signalKey, spread)
  return {
    signalKey,
    status: 'applied',
    observedValue: spread,
    points: rule?.points ?? 0,
  }
}

export function buildFiiTijoloScoreV1(input: {
  asset: FundamentalFactsAsset
  derivedAsset?: FundamentalDerivedFactsAsset
  latestMarketPriceInMinorUnits?: number | null
  assetType: FiiAssetType | null
  monthlyDividendYields?: readonly FiiMonthlyDividendYieldPointV1[] | null
  ntnbRate?: { rateScaled: number; rateScale: number; pricedAt: string } | null
  rules: readonly SignalRuleV1[]
  now: string
}): AssetScoreV1 {
  const signalKeys: FiiTijoloSignalKey[] = [
    'fii_vacancy',
    'fii_tenant_concentration',
    'fii_wale_months',
    'fii_pvp',
    'fii_dy_ntnb_spread',
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
    scoreSignal(
      'fii_vacancy',
      facts.vacancyInBasisPoints,
      input.rules,
      input.now
    ),
    scoreSignal(
      'fii_tenant_concentration',
      facts.tenantConcentrationInBasisPoints,
      input.rules,
      input.now
    ),
    scoreSignal(
      'fii_wale_months',
      facts.waleMonthsScaledBy100,
      input.rules,
      input.now
    ),
    scorePvpSignal(
      navPerShare,
      input.latestMarketPriceInMinorUnits ?? null,
      input.rules,
      input.now
    ),
    scoreFiiDyNtnbSpreadSignal(
      input.monthlyDividendYields ?? null,
      input.ntnbRate ?? null,
      input.rules,
      input.now
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
