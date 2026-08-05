import {
  buildClosedAssetInsertRows,
  type AssetIdFactory,
} from '../assetUniverse'
import type { AllocationTarget, EntityId, Purchase } from '../../domain/models'
import { AI_EXPLANATION_V1_SCHEMA_VERSION } from '../../domain/aiExplanation'
import type { AiExplanationV1 } from '../../domain/aiExplanation'
import type { Tables } from '../../lib/database.types'
import type { SupabaseBrowserClient } from '../../lib/supabaseClient'
import type {
  AiExplanationRepository,
  AllocationTargetRepository,
  AppRepositories,
  AssetPriceRepository,
  AssetRepository,
  ContributionPlanRepository,
  CreateContributionPlanInput,
  CreatePurchaseBatchInput,
  CreatePurchaseInput,
  ExchangeRateRepository,
  MarketDataRefreshResult,
  MarketDataRepository,
  ProfileRepository,
  PurchaseRepository,
  SignalRule,
  SignalRuleRepository,
  UserPreferences,
  UserPreferencesRepository,
} from './contracts'
import {
  mapContributionPlanItemRow,
  mapContributionPlanRow,
} from './contributionPlanMapper'
import { mapExchangeRateRow } from './exchangeRateMapper'
import type { RpcJson, RpcSupabaseClient } from './rpcSchema'
import {
  mapAllocationTargetRow,
  mapAssetRow,
  mapMarketAssetPriceRow,
  mapPurchaseRow,
} from './supabaseMappers'

type QueryError = {
  message: string
  code?: string
}

function createRepositoryQueryError(
  resourceName: string,
  error: QueryError
): Error {
  return new Error(`Failed to load ${resourceName}: ${error.message}`)
}

function createBrowserEntityId(): string {
  return crypto.randomUUID()
}

function parseMarketDataRefreshResult(value: unknown): MarketDataRefreshResult {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid market data refresh response')
  }

  const result = value as Partial<MarketDataRefreshResult>
  const counts = [
    result.updatedPrices,
    result.skippedFreshPrices,
    result.updatedExchangeRates,
    result.skippedFreshExchangeRates,
    result.updatedReferenceRates,
    result.skippedFreshReferenceRates,
  ]

  if (
    typeof result.refreshedAt !== 'string' ||
    Number.isNaN(Date.parse(result.refreshedAt)) ||
    !counts.every((count) => Number.isSafeInteger(count) && count! >= 0) ||
    !Array.isArray(result.warnings) ||
    !result.warnings.every(
      (warning) =>
        warning &&
        // 'storage' faltava aqui: qualquer aviso de falha de escrita
        // (DEC-062) derrubava a resposta inteira nesta validação, e
        // refreshMarketDataBestEffort convertia isso no mesmo aviso
        // genérico, escondendo o motivo real. 'tesouro-transparente'
        // (Sprint 16 Fase 2) segue a mesma disciplina - faltar aqui
        // repetiria o mesmo bug pra fonte nova.
        [
          'b3-cotahist',
          'twelve-data',
          'tesouro-transparente',
          'configuration',
          'storage',
        ].includes(warning.provider) &&
        [
          'provider-failed',
          'stale-quote',
          'configuration',
          'storage-failed',
        ].includes(warning.kind) &&
        typeof warning.message === 'string' &&
        (warning.ticker === undefined || typeof warning.ticker === 'string')
    )
  ) {
    throw new Error('Invalid market data refresh response')
  }

  return result as MarketDataRefreshResult
}

const AI_EXPLANATION_CONVICTION_LEVELS = ['low', 'medium', 'high'] as const

function parseAiExplanationV1(value: unknown): AiExplanationV1 {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid AI explanation response')
  }

  const result = value as Partial<AiExplanationV1>

  if (
    result.schemaVersion !== AI_EXPLANATION_V1_SCHEMA_VERSION ||
    typeof result.generatedAt !== 'string' ||
    Number.isNaN(Date.parse(result.generatedAt)) ||
    !Array.isArray(result.facts) ||
    result.facts.length === 0 ||
    !result.facts.every((fact) => typeof fact === 'string' && fact.trim()) ||
    typeof result.interpretation !== 'string' ||
    !result.interpretation.trim() ||
    !AI_EXPLANATION_CONVICTION_LEVELS.includes(
      result.convictionLevel as (typeof AI_EXPLANATION_CONVICTION_LEVELS)[number]
    ) ||
    typeof result.technicalPlanSummary !== 'string' ||
    !result.technicalPlanSummary.trim() ||
    typeof result.comparativeExplanation !== 'string' ||
    !result.comparativeExplanation.trim()
  ) {
    throw new Error('Invalid AI explanation response')
  }

  return result as AiExplanationV1
}

type PurchaseIdFactory = () => string

type PurchaseFactsInput = Omit<CreatePurchaseInput, 'userId'>

export function calculatePurchaseTotalInMinorUnits(
  quantity: number,
  unitPriceInMinorUnits: number
): number {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new RangeError('Purchase quantity must be positive')
  }

  if (
    !Number.isSafeInteger(unitPriceInMinorUnits) ||
    unitPriceInMinorUnits < 0
  ) {
    throw new RangeError('Purchase unit price must be a non-negative integer')
  }

  const totalAmountInMinorUnits = Math.round(quantity * unitPriceInMinorUnits)

  if (!Number.isSafeInteger(totalAmountInMinorUnits)) {
    throw new RangeError('Purchase total is outside the supported range')
  }

  return totalAmountInMinorUnits
}

function toPurchaseFacts(input: PurchaseFactsInput) {
  const notes = input.notes?.trim()

  return {
    asset_id: input.assetId,
    quantity: input.quantity,
    unit_price_minor: input.unitPriceInMinorUnits,
    total_amount_minor: calculatePurchaseTotalInMinorUnits(
      input.quantity,
      input.unitPriceInMinorUnits
    ),
    currency: input.currency,
    purchased_at: input.purchasedAt,
    notes: notes ? notes : null,
  }
}

export function createSupabaseAssetRepository(
  client: SupabaseBrowserClient,
  createId: AssetIdFactory = createBrowserEntityId
): AssetRepository {
  async function listAssets() {
    const { data, error } = await client
      .from('assets')
      .select('*')
      .order('ticker', { ascending: true })

    if (error) {
      throw createRepositoryQueryError('assets', error)
    }

    return (data ?? []).map(mapAssetRow)
  }

  return {
    list: listAssets,
    async ensureClosedUniverse(userId) {
      const existingAssets = await listAssets()
      const insertRows = buildClosedAssetInsertRows(
        userId,
        existingAssets,
        createId
      )

      if (insertRows.length === 0) {
        return existingAssets
      }

      const { error } = await client.from('assets').insert(insertRows)

      if (error && error.code !== '23505') {
        throw createRepositoryQueryError('closed asset universe', error)
      }

      return listAssets()
    },
  }
}

export function createSupabasePurchaseRepository(
  client: SupabaseBrowserClient,
  createId: PurchaseIdFactory = createBrowserEntityId
): PurchaseRepository {
  async function listPurchases() {
    const { data, error } = await client
      .from('purchases')
      .select('*')
      .order('purchased_at', { ascending: false })

    if (error) {
      throw createRepositoryQueryError('purchases', error)
    }

    return (data ?? []).map(mapPurchaseRow)
  }

  async function createMany(input: CreatePurchaseBatchInput) {
    if (input.purchases.length === 0) {
      throw new RangeError('At least one purchase is required')
    }

    const insertRows = input.purchases.map((purchase) => ({
      id: createId(),
      user_id: input.userId,
      status: 'confirmed' as const,
      ...toPurchaseFacts(purchase),
    }))

    const { data, error } = await client
      .from('purchases')
      .insert(insertRows)
      .select('*')

    if (error) {
      throw createRepositoryQueryError('purchases', error)
    }

    return (data ?? []).map(mapPurchaseRow)
  }

  return {
    list: listPurchases,
    async create(input) {
      const [purchase] = await createMany({
        userId: input.userId,
        purchases: [
          {
            assetId: input.assetId,
            quantity: input.quantity,
            unitPriceInMinorUnits: input.unitPriceInMinorUnits,
            currency: input.currency,
            purchasedAt: input.purchasedAt,
            notes: input.notes,
          },
        ],
      })

      if (!purchase) {
        throw new Error('Failed to create purchase: no row returned')
      }

      return purchase
    },
    createMany,
    async update(input) {
      const { data, error } = await client
        .from('purchases')
        .update(toPurchaseFacts(input))
        .eq('id', input.purchaseId)
        .eq('status', 'confirmed')
        .select('*')
        .single()

      if (error) {
        throw createRepositoryQueryError('purchase', error)
      }

      return mapPurchaseRow(data)
    },
    async cancel(purchaseId) {
      const { data, error } = await client
        .from('purchases')
        .update({ status: 'cancelled' })
        .eq('id', purchaseId)
        .eq('status', 'confirmed')
        .select('*')
        .single()

      if (error) {
        throw createRepositoryQueryError('purchase', error)
      }

      return mapPurchaseRow(data)
    },
  }
}

export function createSupabaseAssetPriceRepository(
  client: SupabaseBrowserClient
): AssetPriceRepository {
  return {
    async list(assets) {
      const { data, error } = await client
        .from('market_asset_prices')
        .select('*')
        .order('priced_at', { ascending: false })

      if (error) {
        throw createRepositoryQueryError('asset prices', error)
      }

      const assetIdByTicker = new Map(
        assets.map((asset) => [asset.ticker, asset.id])
      )

      return (data ?? [])
        .map((row) => mapMarketAssetPriceRow(row, assetIdByTicker))
        .filter((price) => price !== null)
    },
  }
}

export function createSupabaseExchangeRateRepository(
  client: SupabaseBrowserClient
): ExchangeRateRepository {
  return {
    async list() {
      const { data, error } = await client
        .from('market_exchange_rates')
        .select('*')
        .order('priced_at', { ascending: false })

      if (error) {
        throw createRepositoryQueryError('exchange rates', error)
      }

      return (data ?? []).map(mapExchangeRateRow)
    },
  }
}

function allocationTargetsToJson(
  targets: readonly AllocationTarget[]
): RpcJson {
  return targets.map((target) => ({
    id: target.id,
    target_type: target.scope,
    asset_id: target.assetId ?? null,
    category: target.category,
    target_basis_points: target.targetInBasisPoints,
  }))
}

export function createSupabaseAllocationTargetRepository(
  client: SupabaseBrowserClient
): AllocationTargetRepository {
  const rpcClient = client as unknown as RpcSupabaseClient

  async function listTargets() {
    const { data, error } = await client
      .from('allocation_targets')
      .select('*')
      .order('target_type', { ascending: true })
      .order('category', { ascending: true })

    if (error) {
      throw createRepositoryQueryError('allocation targets', error)
    }

    return (data ?? []).map(mapAllocationTargetRow)
  }

  return {
    list: listTargets,
    async replaceAll(targets) {
      const { error } = await rpcClient.rpc('replace_allocation_targets', {
        targets: allocationTargetsToJson(targets),
      })

      if (error) {
        throw createRepositoryQueryError('allocation targets', error)
      }

      return listTargets()
    },
  }
}

export function createSupabaseMarketDataRepository(
  client: SupabaseBrowserClient
): MarketDataRepository {
  return {
    async refresh() {
      const { data, error } = await client.functions.invoke(
        'refresh-market-data'
      )

      if (error) {
        throw createRepositoryQueryError('market data refresh', error)
      }

      return parseMarketDataRefreshResult(data)
    },
  }
}

export function createSupabaseAiExplanationRepository(
  client: SupabaseBrowserClient
): AiExplanationRepository {
  return {
    async explain(dossier) {
      const { data, error } = await client.functions.invoke(
        'explain-contribution-plan',
        { body: { dossier } }
      )

      if (error) {
        throw createRepositoryQueryError('contribution plan explanation', error)
      }

      return parseAiExplanationV1(data)
    },
  }
}

const CONTRIBUTION_PLAN_WITH_ITEMS_SELECT = '*, contribution_plan_items(*)'

export function createSupabaseContributionPlanRepository(
  client: SupabaseBrowserClient,
  createId: PurchaseIdFactory = createBrowserEntityId
): ContributionPlanRepository {
  return {
    async list(purchasesById) {
      const { data, error } = await client
        .from('contribution_plans')
        .select(CONTRIBUTION_PLAN_WITH_ITEMS_SELECT)
        .order('created_at', { ascending: false })

      if (error) {
        throw createRepositoryQueryError('contribution plans', error)
      }

      return (data ?? []).map((row) =>
        mapContributionPlanRow(row, purchasesById)
      )
    },
    async create(input: CreateContributionPlanInput, purchasesById) {
      const planId = createId()
      const { error: planError } = await client
        .from('contribution_plans')
        .insert({
          id: planId,
          user_id: input.userId,
          input_amount_minor: input.inputAmountInMinorUnits,
          currency: input.currency,
          status: input.status,
        })

      if (planError) {
        throw createRepositoryQueryError('contribution plan', planError)
      }

      if (input.items.length > 0) {
        const { error: itemsError } = await client
          .from('contribution_plan_items')
          .insert(
            input.items.map((item) => ({
              id: createId(),
              user_id: input.userId,
              contribution_plan_id: planId,
              asset_id: item.assetId,
              planned_amount_minor: item.plannedAmountInMinorUnits,
              currency: item.currency,
            }))
          )

        if (itemsError) {
          throw createRepositoryQueryError(
            'contribution plan items',
            itemsError
          )
        }
      }

      const { data, error } = await client
        .from('contribution_plans')
        .select(CONTRIBUTION_PLAN_WITH_ITEMS_SELECT)
        .eq('id', planId)
        .single()

      if (error) {
        throw createRepositoryQueryError('contribution plan', error)
      }

      return mapContributionPlanRow(data, purchasesById)
    },
    async updateStatus(planId, status, purchasesById) {
      const { data, error } = await client
        .from('contribution_plans')
        .update({ status })
        .eq('id', planId)
        .select(CONTRIBUTION_PLAN_WITH_ITEMS_SELECT)
        .single()

      if (error) {
        throw createRepositoryQueryError('contribution plan', error)
      }

      return mapContributionPlanRow(data, purchasesById)
    },
    async linkItemPurchase(itemId, purchase) {
      const { data, error } = await client
        .from('contribution_plan_items')
        .update({ purchase_id: purchase.id })
        .eq('id', itemId)
        .select('*')
        .single()

      if (error) {
        throw createRepositoryQueryError('contribution plan item', error)
      }

      return mapContributionPlanItemRow(
        data,
        new Map<EntityId, Purchase>([[purchase.id, purchase]])
      )
    },
  }
}

const DEFAULT_USER_PREFERENCES: UserPreferences = {
  currency: 'BRL',
  percentageDecimals: 2,
  compactView: false,
  defaultContributionStrategy: 'proportional',
  contributionReminderEnabled: true,
  contributionReminderDay: 10,
  scoreWeightInBasisPoints: 50,
}

export function createSupabaseProfileRepository(
  client: SupabaseBrowserClient
): ProfileRepository {
  return {
    async get(userId) {
      const { data, error } = await client
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        throw createRepositoryQueryError('profile', error)
      }

      return { displayName: data?.name ?? '' }
    },
    async update(userId, profile) {
      const { data, error } = await client
        .from('profiles')
        .upsert({ id: userId, name: profile.displayName })
        .select('name')
        .single()

      if (error) {
        throw createRepositoryQueryError('profile', error)
      }

      return { displayName: data.name ?? '' }
    },
  }
}

type UserPreferencesRow = Tables<'user_preferences'>

function mapUserPreferencesRow(row: UserPreferencesRow): UserPreferences {
  return {
    currency: row.currency === 'USD' ? 'USD' : 'BRL',
    percentageDecimals: (row.percentage_decimals === 0 ||
    row.percentage_decimals === 1
      ? row.percentage_decimals
      : 2) as 0 | 1 | 2,
    compactView: row.compact_view,
    defaultContributionStrategy:
      row.default_contribution_strategy === 'target-allocation'
        ? 'target-allocation'
        : 'proportional',
    contributionReminderEnabled: row.contribution_reminder_enabled,
    contributionReminderDay: row.contribution_reminder_day,
    scoreWeightInBasisPoints: row.score_weight_basis_points,
  }
}

export function createSupabaseUserPreferencesRepository(
  client: SupabaseBrowserClient
): UserPreferencesRepository {
  return {
    async get(userId) {
      const { data, error } = await client
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        throw createRepositoryQueryError('user preferences', error)
      }

      return data ? mapUserPreferencesRow(data) : DEFAULT_USER_PREFERENCES
    },
    async update(userId, preferences) {
      const { data, error } = await client
        .from('user_preferences')
        .upsert({
          user_id: userId,
          currency: preferences.currency,
          percentage_decimals: preferences.percentageDecimals,
          compact_view: preferences.compactView,
          default_contribution_strategy:
            preferences.defaultContributionStrategy,
          contribution_reminder_enabled:
            preferences.contributionReminderEnabled,
          contribution_reminder_day: preferences.contributionReminderDay,
          score_weight_basis_points: preferences.scoreWeightInBasisPoints,
        })
        .select('*')
        .single()

      if (error) {
        throw createRepositoryQueryError('user preferences', error)
      }

      return mapUserPreferencesRow(data)
    },
  }
}

function mapSignalRuleRow(row: Tables<'signal_rules'>): SignalRule {
  return {
    id: row.id,
    signalKey: row.signal_key,
    minValue: row.min_value,
    maxValue: row.max_value,
    points: row.points,
    enabled: row.enabled,
  }
}

export function createSupabaseSignalRuleRepository(
  client: SupabaseBrowserClient,
  createId: AssetIdFactory = createBrowserEntityId
): SignalRuleRepository {
  return {
    async list() {
      const { data, error } = await client
        .from('signal_rules')
        .select('*')
        .order('signal_key', { ascending: true })

      if (error) {
        throw createRepositoryQueryError('signal rules', error)
      }

      return (data ?? []).map(mapSignalRuleRow)
    },
    async create(input) {
      const { data: userData, error: userError } = await client.auth.getUser()

      if (userError || !userData.user) {
        throw createRepositoryQueryError('signal rules', {
          message: 'Sessão autenticada inválida.',
        })
      }

      const { data, error } = await client
        .from('signal_rules')
        .insert({
          id: createId(),
          user_id: userData.user.id,
          signal_key: input.signalKey,
          min_value: input.minValue,
          max_value: input.maxValue,
          points: input.points,
          enabled: input.enabled,
        })
        .select('*')
        .single()

      if (error) {
        throw createRepositoryQueryError('signal rules', error)
      }

      return mapSignalRuleRow(data)
    },
    async update(input) {
      const { data, error } = await client
        .from('signal_rules')
        .update({
          signal_key: input.signalKey,
          min_value: input.minValue,
          max_value: input.maxValue,
          points: input.points,
          enabled: input.enabled,
        })
        .eq('id', input.id)
        .select('*')
        .single()

      if (error) {
        throw createRepositoryQueryError('signal rules', error)
      }

      return mapSignalRuleRow(data)
    },
    async remove(ruleId) {
      const { error } = await client
        .from('signal_rules')
        .delete()
        .eq('id', ruleId)

      if (error) {
        throw createRepositoryQueryError('signal rules', error)
      }
    },
  }
}

export function createSupabaseRepositories(
  client: SupabaseBrowserClient
): AppRepositories {
  return {
    assets: createSupabaseAssetRepository(client),
    purchases: createSupabasePurchaseRepository(client),
    assetPrices: createSupabaseAssetPriceRepository(client),
    exchangeRates: createSupabaseExchangeRateRepository(client),
    allocationTargets: createSupabaseAllocationTargetRepository(client),
    marketData: createSupabaseMarketDataRepository(client),
    contributionPlans: createSupabaseContributionPlanRepository(client),
    aiExplanation: createSupabaseAiExplanationRepository(client),
    profile: createSupabaseProfileRepository(client),
    userPreferences: createSupabaseUserPreferencesRepository(client),
    signalRules: createSupabaseSignalRuleRepository(client),
  }
}
