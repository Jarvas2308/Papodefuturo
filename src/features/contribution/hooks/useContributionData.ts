import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../auth/useAuth'
import {
  createSupabaseRepositories,
  type AppRepositories,
} from '../../../data/repositories'
import { explainContributionPlanBestEffort } from '../../../data/aiExplanationBestEffort'
import { refreshMarketDataBestEffort } from '../../../data/marketDataRefresh'
import type { AiExplanationV1 } from '../../../domain/aiExplanation'
import { getLatestAssetPricesByAsset } from '../../../domain/latestAssetPrices'
import type {
  CreateContributionPlanInput,
  CreatePurchaseBatchItem,
} from '../../../data/repositories/contracts'
import type {
  AllocationTarget as DomainAllocationTarget,
  Asset,
  AssetPrice,
  ContributionPlan,
  ContributionPlanItem,
  ExchangeRate,
  EntityId,
  Purchase,
} from '../../../domain/models'
import { convertMoney, getLatestUsdBrlRate } from '../../../domain/models'
import {
  buildPortfolioSnapshot,
  type PortfolioSnapshot,
} from '../../../domain/portfolioSnapshot'
import { buildTechnicalDossierV1 } from '../../../domain/technicalDossier'
import {
  createSupabaseFundamentalSnapshotRepository,
  createSupabaseRealEstateFundSnapshotRepository,
} from '../../../data/fundamentals'
import { createSupabaseShillerCapeHistoryRepository } from '../../../data/fundamentals/supabaseShillerCapeSnapshots'
import { createSupabaseEtfValuationRepository } from '../../../data/fundamentals/supabaseEtfValuationSnapshots'
import { createSupabaseProventoDeclarationValueRepository } from '../../../data/fundamentals/supabaseProventoDeclarationValues'
import { BRAZILIAN_STOCK_TICKER_ISIN_V1 } from '../../../data/fundamentals/provento/brazilianStockTickerIsinV1'
import { createSupabaseFiiMonthlyDividendYieldRepository } from '../../../data/fundamentals/supabaseFiiMonthlyDividendYield'
import { createSupabaseMarketReferenceRateRepository } from '../../../data/fundamentals/supabaseMarketReferenceRates'
import { createSupabaseEtfDistributionValueRepository } from '../../../data/fundamentals/supabaseEtfDistributionValues'
import { createSupabaseStockHistoricalClosePriceRepository } from '../../../data/fundamentals/supabaseStockHistoricalClosePrices'
import type {
  FiiMonthlyDividendYieldPointV1,
  ProventoDeclarationPointV1,
  StockClosePriceHistoryPointV1,
} from '../../../domain/fundamentals/score'
import { buildFundamentalFactsV1 } from '../../../domain/fundamentals'
import { buildFundamentalDerivedFactsV1 } from '../../../domain/fundamentals/derived'
import type { AssetScoreV1 } from '../../../domain/fundamentals/score'
import type { SupabaseBrowserClient } from '../../../lib/supabaseClient'
import type { StrategyCategory } from '../../strategy/types'
import {
  buildRealStrategyPositions,
  buildStrategyFromRealData,
} from '../../strategy/realStrategy'
import { contributionMock } from '../mocks/contributionMock'
import type {
  AllocationTarget,
  ContributionAssetScore,
  ContributionAssetTarget,
  ContributionDistribution,
  ContributionPosition,
  TargetAllocationContributionResult,
} from '../types'
import { buildGlobalAssetTargets } from '../utils/buildGlobalAssetTargets'
import { getContributionAssetCurrency } from '../utils/confirmedPurchases'
import {
  buildContributionAssetScoresV1,
  getMissingDefaultFiiSignalRules,
  toContributionAssetScores,
} from '../utils/buildContributionAssetScores'

type ContributionDataStatus = 'loading' | 'ready' | 'error'

type ResultPosition = {
  id: string
  ticker: string
  name: string
  categoryLabel: string
}

const CATEGORY_BY_DOMAIN = {
  'brazilian-stock': 'brazilian-stocks',
  'real-estate-fund': 'real-estate-funds',
  'international-etf': 'international',
} as const

const CATEGORY_LABELS = {
  'brazilian-stocks': 'Ações brasileiras',
  'real-estate-funds': 'Fundos imobiliários',
  international: 'Internacional',
} as const

export async function loadRealContributionInputs(
  repositories: AppRepositories,
  userId: EntityId
) {
  const assets = await repositories.assets.ensureClosedUniverse(userId)
  await refreshMarketDataBestEffort(repositories.marketData)
  const [purchases, prices, allocationTargets, rates] = await Promise.all([
    repositories.purchases.list(),
    repositories.assetPrices.list(assets),
    repositories.allocationTargets.list(),
    repositories.exchangeRates.list(),
  ])

  return { assets, purchases, prices, allocationTargets, rates }
}

// Score é reforço best-effort no laço guloso (Sprint 16, Fase 5/6,
// DEC-085/DEC-086) - mesmo padrão de refreshMarketDataBestEffort e
// explainContributionPlanBestEffort: qualquer falha aqui (dossiê
// indisponível, RPC de signal_rules fora do ar, etc.) não pode travar o
// fluxo de aporte, só faz o motor operar sem priorização por score.
export async function loadContributionAssetScoresBestEffort(
  client: SupabaseBrowserClient,
  repositories: AppRepositories,
  assets: readonly Asset[],
  prices: readonly AssetPrice[],
  userId: EntityId
): Promise<{
  assetFundamentalScores: AssetScoreV1[]
  scoreWeightInBasisPoints: number
}> {
  const empty = { assetFundamentalScores: [], scoreWeightInBasisPoints: 0 }

  try {
    // Le fundamentos direto do repositorio de leitura (data/fundamentals) e
    // monta os fatos com os builders puros de dominio - deliberadamente NAO
    // usa o modulo de leitura sob application/context, pasta "runtime" (do
    // ingles, "em tempo de execucao") de fundamentos (isolamento arquitetural
    // testado em boundary.test.ts: fluxos financeiros criticos - contribuicao,
    // portfolio, historico - nunca importam aquele modulo).
    const fiiSnapshotRepository =
      createSupabaseRealEstateFundSnapshotRepository(client)
    const stockSnapshotRepository =
      createSupabaseFundamentalSnapshotRepository(client)
    const capeHistoryRepository =
      createSupabaseShillerCapeHistoryRepository(client)
    const etfValuationRepository = createSupabaseEtfValuationRepository(client)
    const proventoDeclarationRepository =
      createSupabaseProventoDeclarationValueRepository(client)
    const fiiMonthlyDividendYieldRepository =
      createSupabaseFiiMonthlyDividendYieldRepository(client)
    const marketReferenceRateRepository =
      createSupabaseMarketReferenceRateRepository(client)
    const etfDistributionValueRepository =
      createSupabaseEtfDistributionValueRepository(client)
    const stockHistoricalClosePriceRepository =
      createSupabaseStockHistoricalClosePriceRepository(client)

    const fiiTijoloTickers = assets
      .filter(
        (asset) =>
          asset.category === 'real-estate-fund' && asset.assetType === 'tijolo'
      )
      .map((asset) => asset.ticker)

    const stockTickersWithIsin = assets
      .filter((asset) => asset.category === 'brazilian-stock')
      .map((asset) => ({
        ticker: asset.ticker,
        isin: (
          BRAZILIAN_STOCK_TICKER_ISIN_V1 as Record<string, string | undefined>
        )[asset.ticker],
      }))
      .filter(
        (entry): entry is { ticker: string; isin: string } =>
          entry.isin !== undefined
      )

    const stockTickers = assets
      .filter((asset) => asset.category === 'brazilian-stock')
      .map((asset) => asset.ticker)

    const [
      fiiSnapshots,
      stockSnapshots,
      capeHistory,
      etfValuations,
      proventoEntries,
      monthlyDividendYieldEntries,
      ntnbRatePoint,
      etfDistributionValues,
      tipsRatePoint,
      closePriceHistoryEntries,
    ] = await Promise.all([
      fiiSnapshotRepository.listRealEstateFundSnapshots(assets),
      stockSnapshotRepository.listBrazilianStockSnapshots(assets),
      capeHistoryRepository.listShillerCapeHistory(),
      etfValuationRepository.listEtfValuations(),
      Promise.all(
        stockTickersWithIsin.map(
          async ({ ticker, isin }) =>
            [
              ticker,
              await proventoDeclarationRepository.listProventoDeclarationsByIsin(
                isin
              ),
            ] as const
        )
      ),
      Promise.all(
        fiiTijoloTickers.map(
          async (ticker) =>
            [
              ticker,
              await fiiMonthlyDividendYieldRepository.listFiiMonthlyDividendYieldsByTicker(
                ticker
              ),
            ] as const
        )
      ),
      marketReferenceRateRepository.getLatestMarketReferenceRate('ntnb-longa'),
      etfDistributionValueRepository.listEtfDistributionValues(),
      // Série `fred-dfii10`: TIPS de 10 anos (DEC-093), já ingerida em
      // produção pela Edge Function refresh-market-data.
      marketReferenceRateRepository.getLatestMarketReferenceRate('fred-dfii10'),
      // P/L vs própria série histórica (DEC-104): fechamento B3 por
      // exercício, tabela `stock_historical_close_prices` (ainda não
      // aplicada em produção - lista vazia até lá, sinal fica
      // `unavailable`).
      Promise.all(
        stockTickers.map(
          async (ticker) =>
            [
              ticker,
              await stockHistoricalClosePriceRepository.listStockHistoricalClosePricesByTicker(
                ticker
              ),
            ] as const
        )
      ),
    ])
    const proventoDeclarationsByTicker = new Map<
      string,
      readonly ProventoDeclarationPointV1[]
    >(proventoEntries)
    const monthlyDividendYieldsByTicker = new Map<
      string,
      readonly FiiMonthlyDividendYieldPointV1[]
    >(monthlyDividendYieldEntries)
    const closePriceHistoryByTicker = new Map<
      string,
      readonly StockClosePriceHistoryPointV1[]
    >(closePriceHistoryEntries)
    const ntnbRate =
      ntnbRatePoint === null
        ? null
        : {
            rateScaled: ntnbRatePoint.rateScaled,
            rateScale: ntnbRatePoint.rateScale,
            pricedAt: ntnbRatePoint.pricedAt,
          }
    const tipsRate =
      tipsRatePoint === null
        ? null
        : {
            rateScaled: tipsRatePoint.rateScaled,
            rateScale: tipsRatePoint.rateScale,
            pricedAt: tipsRatePoint.pricedAt,
          }
    const now = new Date().toISOString()
    const facts = buildFundamentalFactsV1({
      generatedAt: now,
      assets,
      snapshots: [...fiiSnapshots, ...stockSnapshots],
    })
    const derived = buildFundamentalDerivedFactsV1(facts)

    let rules = await repositories.signalRules.list()
    const missingRules = getMissingDefaultFiiSignalRules(rules)
    if (missingRules.length > 0) {
      await Promise.all(
        missingRules.map((rule) => repositories.signalRules.create(rule))
      )
      rules = await repositories.signalRules.list()
    }

    const preferences = await repositories.userPreferences.get(userId)
    const latestPricesByAsset = getLatestAssetPricesByAsset(prices)

    return {
      assetFundamentalScores: buildContributionAssetScoresV1({
        assets,
        facts,
        derived,
        latestPricesByAsset,
        capeHistory,
        etfValuations,
        proventoDeclarationsByTicker,
        closePriceHistoryByTicker,
        monthlyDividendYieldsByTicker,
        ntnbRate,
        etfDistributionValues,
        tipsRate,
        rules,
        now,
      }),
      scoreWeightInBasisPoints: preferences.scoreWeightInBasisPoints,
    }
  } catch {
    return empty
  }
}

export function buildContributionPositions(
  assets: readonly Asset[],
  purchases: readonly Purchase[],
  prices: readonly AssetPrice[],
  rates: readonly ExchangeRate[]
) {
  const realPositions = buildRealStrategyPositions(
    assets,
    purchases,
    prices,
    rates
  )
  const currentValueByAsset = new Map(
    realPositions.positions.map((position) => [
      position.assetId,
      position.currentValueInCents,
    ])
  )
  const eligibleAssets = assets.filter(
    (asset) => asset.status === 'active' && asset.category in CATEGORY_BY_DOMAIN
  )
  const latestPricesByAsset = getLatestAssetPricesByAsset(prices)
  const latestUsdBrlRate = getLatestUsdBrlRate(rates)

  return {
    positions: eligibleAssets.map((asset) => {
      const latestPrice = latestPricesByAsset.get(asset.id)
      const currency = getContributionAssetCurrency(asset)

      if (latestPrice && latestPrice.price.currency !== currency) {
        throw new Error(`Asset price currency mismatch for ${asset.ticker}`)
      }

      const unitPriceInCents = latestPrice
        ? currency === 'BRL'
          ? latestPrice.price.amountInMinorUnits
          : latestUsdBrlRate
            ? convertMoney(latestPrice.price, 'BRL', latestUsdBrlRate)
                .amountInMinorUnits
            : null
        : null

      return {
        assetId: asset.id,
        category:
          CATEGORY_BY_DOMAIN[asset.category as keyof typeof CATEGORY_BY_DOMAIN],
        currentValueInCents: currentValueByAsset.get(asset.id) ?? 0,
        unitPriceInCents,
      }
    }),
    realPositions,
  }
}

export function buildContributionTargets(
  assets: readonly Asset[],
  allocationTargets: readonly DomainAllocationTarget[]
) {
  const strategy = buildStrategyFromRealData(assets, allocationTargets)

  return {
    strategy,
    categoryTargets: strategy.map((category) => ({
      category: category.id,
      targetPercentage: category.targetInBasisPoints / 100,
    })),
    assetTargets: buildGlobalAssetTargets(strategy),
  }
}

export function buildContributionPlanCreateInput(
  userId: EntityId,
  inputAmountInMinorUnits: number,
  distribution: readonly ContributionDistribution[],
  assets: readonly Asset[]
): CreateContributionPlanInput | null {
  const suggestions = distribution.filter((item) => item.valorEmCentavos > 0)

  if (suggestions.length === 0) {
    return null
  }

  return {
    userId,
    inputAmountInMinorUnits,
    currency: 'BRL',
    status: 'presented',
    items: suggestions.map((item) => {
      const asset = assets.find((candidate) => candidate.id === item.assetId)

      if (!asset) {
        throw new Error(
          'A sugestão informada precisa pertencer à sua carteira.'
        )
      }

      return {
        assetId: item.assetId,
        // O motor distribui exclusivamente em BRL: preços de ativos em USD já
        // foram convertidos em `buildContributionInputs`. O item herda a moeda
        // do plano, nunca a do ativo — rotular um valor em BRL como USD
        // corromperia o dado por um fator igual à cotação do dia.
        plannedAmountInMinorUnits: item.valorEmCentavos,
        currency: 'BRL' as const,
      }
    }),
  }
}

export function matchRegisteredPurchasesToPlanItems(
  planItems: readonly ContributionPlanItem[],
  registeredPurchases: readonly Purchase[]
): Array<{ itemId: EntityId; purchase: Purchase }> {
  const itemsByAssetId = new Map(planItems.map((item) => [item.assetId, item]))

  return registeredPurchases.flatMap((purchase) => {
    const item = itemsByAssetId.get(purchase.assetId)
    return item ? [{ itemId: item.id, purchase }] : []
  })
}

export function useContributionData() {
  const { status: authStatus, client, user } = useAuth()
  const [positions, setPositions] = useState<ContributionPosition[]>(() =>
    authStatus === 'demo' ? contributionMock.carteiraAtual : []
  )
  const [assets, setAssets] = useState<Asset[]>([])
  const [resultPositions, setResultPositions] = useState<ResultPosition[]>(
    () => (authStatus === 'demo' ? contributionMock.posicoesVisuais : [])
  )
  const [targets, setTargets] = useState<AllocationTarget[]>(() =>
    authStatus === 'demo' ? contributionMock.metasAlocacao : []
  )
  const [assetTargets, setAssetTargets] = useState<ContributionAssetTarget[]>(
    () => (authStatus === 'demo' ? contributionMock.metasGlobaisPorAtivo : [])
  )
  const [status, setStatus] = useState<ContributionDataStatus>(
    authStatus === 'demo' ? 'ready' : 'loading'
  )
  const [error, setError] = useState<string | null>(null)
  const [needsExchangeRate, setNeedsExchangeRate] = useState(false)
  const [latestUsdBrlRate, setLatestUsdBrlRate] = useState<ExchangeRate | null>(
    null
  )
  const [contributionPlan, setContributionPlan] =
    useState<ContributionPlan | null>(null)
  const [assetPrices, setAssetPrices] = useState<AssetPrice[]>([])
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([])
  const [strategyCategories, setStrategyCategories] = useState<
    StrategyCategory[]
  >([])
  const [portfolioSnapshot, setPortfolioSnapshot] =
    useState<PortfolioSnapshot | null>(null)
  const [assetFundamentalScores, setAssetFundamentalScores] = useState<
    AssetScoreV1[]
  >([])
  const [scoreWeightInBasisPoints, setScoreWeightInBasisPoints] = useState(0)
  const assetScores: ContributionAssetScore[] = toContributionAssetScores(
    assetFundamentalScores
  )

  const loadReal = useCallback(async () => {
    if (authStatus !== 'authenticated' || !client || !user) {
      return
    }

    const repositories = createSupabaseRepositories(client)
    const { assets, purchases, prices, allocationTargets, rates } =
      await loadRealContributionInputs(repositories, user.id)
    const contributionTargets = buildContributionTargets(
      assets,
      allocationTargets
    )
    const contributionPositions = buildContributionPositions(
      assets,
      purchases,
      prices,
      rates
    )
    const { realPositions } = contributionPositions
    const nextPositions: ContributionPosition[] =
      contributionPositions.positions
    const eligibleAssets = assets.filter(
      (asset) =>
        asset.status === 'active' && asset.category in CATEGORY_BY_DOMAIN
    )
    const nextResultPositions: ResultPosition[] = eligibleAssets.map(
      (asset) => {
        const category =
          CATEGORY_BY_DOMAIN[asset.category as keyof typeof CATEGORY_BY_DOMAIN]

        return {
          id: asset.id,
          ticker: asset.ticker,
          name: asset.name,
          categoryLabel: CATEGORY_LABELS[category],
        }
      }
    )
    const nextTargets: AllocationTarget[] = contributionTargets.categoryTargets
    const nextAssetTargets = contributionTargets.assetTargets
    const snapshotResult = buildPortfolioSnapshot({
      assets,
      purchases,
      prices,
      targets: allocationTargets,
      rates,
      resolveAssetCurrency: getContributionAssetCurrency,
    })

    setPositions(nextPositions)
    setAssets(assets)
    setResultPositions(nextResultPositions)
    setTargets(nextTargets)
    setAssetTargets(nextAssetTargets)
    setNeedsExchangeRate(realPositions.needsExchangeRate)
    setLatestUsdBrlRate(realPositions.latestUsdBrlRate)
    setAssetPrices(prices)
    setExchangeRates(rates)
    setStrategyCategories(contributionTargets.strategy)
    setPortfolioSnapshot(snapshotResult.snapshot)
    setError(null)
    setStatus('ready')

    const scoreResult = await loadContributionAssetScoresBestEffort(
      client,
      repositories,
      assets,
      prices,
      user.id
    )
    setAssetFundamentalScores(scoreResult.assetFundamentalScores)
    setScoreWeightInBasisPoints(scoreResult.scoreWeightInBasisPoints)
  }, [authStatus, client, user])

  useEffect(() => {
    if (authStatus !== 'authenticated') {
      return
    }

    let isActive = true

    void Promise.resolve()
      .then(async () => {
        if (!isActive) {
          return
        }

        await loadReal()
      })
      .catch((caughtError) => {
        if (!isActive) {
          return
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'Não foi possível carregar os dados reais do aporte.'
        )
        setStatus('error')
      })

    return () => {
      isActive = false
    }
  }, [authStatus, loadReal])

  async function presentContributionPlan(
    distribution: readonly ContributionDistribution[],
    inputAmountInMinorUnits: number
  ) {
    if (authStatus === 'demo' || !client || !user) {
      return
    }

    const input = buildContributionPlanCreateInput(
      user.id,
      inputAmountInMinorUnits,
      distribution,
      assets
    )

    if (!input) {
      setContributionPlan(null)
      return
    }

    const repositories = createSupabaseRepositories(client)
    const plan = await repositories.contributionPlans.create(input, new Map())

    setContributionPlan(plan)
  }

  async function acceptContributionPlan() {
    if (!client || !contributionPlan) {
      return
    }

    const repositories = createSupabaseRepositories(client)
    const plan = await repositories.contributionPlans.updateStatus(
      contributionPlan.id,
      'accepted',
      new Map()
    )
    setContributionPlan(plan)
  }

  async function rejectContributionPlan() {
    if (!client || !contributionPlan) {
      return
    }

    const repositories = createSupabaseRepositories(client)
    const plan = await repositories.contributionPlans.updateStatus(
      contributionPlan.id,
      'rejected',
      new Map()
    )
    setContributionPlan(plan)
  }

  async function explainContributionPlan(
    technicalPlan: TargetAllocationContributionResult,
    contributionAmountInCents: number
  ): Promise<AiExplanationV1 | null> {
    if (authStatus === 'demo' || !client || !portfolioSnapshot) {
      return null
    }

    let dossier
    try {
      dossier = buildTechnicalDossierV1({
        generatedAt: new Date().toISOString(),
        contributionAmountInCents,
        assets,
        portfolioSnapshot,
        strategy: strategyCategories,
        globalAssetTargets: assetTargets,
        assetPrices,
        exchangeRates,
        technicalPlan,
        assetFundamentalScores,
      })
    } catch {
      return null
    }

    const repositories = createSupabaseRepositories(client)
    return explainContributionPlanBestEffort(
      repositories.aiExplanation,
      dossier
    )
  }

  async function registerConfirmedPurchases(
    purchases: readonly CreatePurchaseBatchItem[]
  ) {
    if (authStatus === 'demo') {
      throw new Error(
        'O registro de compras confirmadas exige uma sessão autenticada.'
      )
    }

    if (!client || !user) {
      throw new Error('Sessão autenticada indisponível.')
    }

    const purchasesWithDerivedCurrency = purchases.map((purchase) => {
      const asset = assets.find(
        (candidate) => candidate.id === purchase.assetId
      )

      if (!asset) {
        throw new Error('A compra informada precisa pertencer à sua carteira.')
      }

      return {
        ...purchase,
        currency: getContributionAssetCurrency(asset),
      }
    })

    const repositories = createSupabaseRepositories(client)
    const registeredPurchases = await repositories.purchases.createMany({
      userId: user.id,
      purchases: purchasesWithDerivedCurrency,
    })

    if (contributionPlan && contributionPlan.status === 'accepted') {
      const matches = matchRegisteredPurchasesToPlanItems(
        contributionPlan.items,
        registeredPurchases
      )

      for (const match of matches) {
        await repositories.contributionPlans.linkItemPurchase(
          match.itemId,
          match.purchase
        )
      }

      await repositories.contributionPlans.updateStatus(
        contributionPlan.id,
        'confirmed',
        new Map()
      )
      setContributionPlan(null)
    }

    await loadReal()

    return registeredPurchases
  }

  return {
    assets,
    positions,
    resultPositions,
    targets,
    assetTargets,
    assetScores,
    scoreWeightInBasisPoints,
    status,
    error,
    needsExchangeRate,
    latestUsdBrlRate,
    isDemo: authStatus === 'demo',
    contributionPlan,
    presentContributionPlan,
    acceptContributionPlan,
    rejectContributionPlan,
    explainContributionPlan,
    registerConfirmedPurchases,
  }
}
