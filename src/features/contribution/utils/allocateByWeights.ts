export type WeightedAllocationItem = {
  id: string
  weight: number
  originalOrder: number
}

export type WeightedAllocation = {
  id: string
  valueInCents: number
}

export function allocateByWeights(
  totalInCents: number,
  items: WeightedAllocationItem[]
): WeightedAllocation[] {
  if (!Number.isSafeInteger(totalInCents) || totalInCents < 0) {
    throw new RangeError('Allocation total must be a non-negative safe integer')
  }

  const seenIds = new Set<string>()
  const seenOrders = new Set<number>()

  for (const item of items) {
    if (!item.id || seenIds.has(item.id)) {
      throw new Error(`Invalid or duplicate allocation id: ${item.id}`)
    }
    if (
      !Number.isSafeInteger(item.originalOrder) ||
      seenOrders.has(item.originalOrder)
    ) {
      throw new Error(
        `Invalid or duplicate original order: ${item.originalOrder}`
      )
    }
    if (!Number.isFinite(item.weight) || item.weight < 0) {
      throw new RangeError(`Invalid allocation weight for: ${item.id}`)
    }

    seenIds.add(item.id)
    seenOrders.add(item.originalOrder)
  }

  const positiveItems = items.filter((item) => item.weight > 0)
  if (totalInCents > 0 && positiveItems.length === 0) {
    throw new RangeError('At least one positive allocation weight is required')
  }

  const totalWeight = positiveItems.reduce(
    (total, item) => total + item.weight,
    0
  )
  if (!Number.isFinite(totalWeight)) {
    throw new RangeError('Allocation weights exceed the supported range')
  }

  const allocations = items.map((item) => {
    const exactValue =
      item.weight > 0 ? (totalInCents * item.weight) / totalWeight : 0
    const valueInCents = Math.floor(exactValue)

    return {
      ...item,
      remainder: exactValue - valueInCents,
      valueInCents,
    }
  })

  const allocatedTotal = allocations.reduce(
    (total, allocation) => total + allocation.valueInCents,
    0
  )
  const remainingCents = totalInCents - allocatedTotal
  const remainderOrder = allocations
    .filter((allocation) => allocation.weight > 0)
    .sort(
      (left, right) =>
        right.remainder - left.remainder ||
        left.originalOrder - right.originalOrder
    )

  for (let index = 0; index < remainingCents; index += 1) {
    remainderOrder[index % remainderOrder.length].valueInCents += 1
  }

  return allocations.map(({ id, valueInCents }) => ({ id, valueInCents }))
}
