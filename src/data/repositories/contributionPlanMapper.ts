import type {
  ContributionPlan,
  ContributionPlanItem,
  ContributionPlanStatus,
  CurrencyCode,
  EntityId,
  Purchase,
} from '../../domain/models'
import { isValidMoneyInMinorUnits } from '../../domain/models'
import type { Tables } from '../../lib/database.types'

type ContributionPlanRow = Tables<'contribution_plans'>
type ContributionPlanItemRow = Tables<'contribution_plan_items'>
type ContributionPlanWithItemsRow = ContributionPlanRow & {
  contribution_plan_items: ContributionPlanItemRow[]
}

const CURRENCIES: readonly CurrencyCode[] = ['BRL', 'USD']
const CONTRIBUTION_PLAN_STATUSES: readonly ContributionPlanStatus[] = [
  'draft',
  'presented',
  'accepted',
  'rejected',
  'confirmed',
]

function readAllowedValue<T extends string>(
  value: string,
  allowedValues: readonly T[],
  fieldName: string
): T {
  if (!allowedValues.includes(value as T)) {
    throw new Error(`Unsupported ${fieldName}: ${value}`)
  }

  return value as T
}

function readMoneyInMinorUnits(value: number, fieldName: string): number {
  if (!isValidMoneyInMinorUnits(value)) {
    throw new Error(`Invalid ${fieldName}: ${value}`)
  }

  return value
}

export function mapContributionPlanItemRow(
  row: ContributionPlanItemRow,
  purchasesById: ReadonlyMap<EntityId, Purchase>
): ContributionPlanItem {
  const item: ContributionPlanItem = {
    id: row.id,
    assetId: row.asset_id,
    plannedAmount: {
      amountInMinorUnits: readMoneyInMinorUnits(
        row.planned_amount_minor,
        'contribution plan item planned amount'
      ),
      currency: readAllowedValue(row.currency, CURRENCIES, 'currency'),
    },
  }

  if (row.purchase_id) {
    const plannedPurchase = purchasesById.get(row.purchase_id)

    if (plannedPurchase) {
      item.plannedPurchase = plannedPurchase
    }
  }

  return item
}

export function mapContributionPlanRow(
  row: ContributionPlanWithItemsRow,
  purchasesById: ReadonlyMap<EntityId, Purchase>
): ContributionPlan {
  return {
    id: row.id,
    inputAmount: {
      amountInMinorUnits: readMoneyInMinorUnits(
        row.input_amount_minor,
        'contribution plan input amount'
      ),
      currency: readAllowedValue(row.currency, CURRENCIES, 'currency'),
    },
    items: row.contribution_plan_items.map((item) =>
      mapContributionPlanItemRow(item, purchasesById)
    ),
    status: readAllowedValue(
      row.status,
      CONTRIBUTION_PLAN_STATUSES,
      'contribution plan status'
    ),
    createdAt: row.created_at,
  }
}
