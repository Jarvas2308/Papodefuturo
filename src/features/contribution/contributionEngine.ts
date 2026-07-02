import { proportionalStrategy } from './strategies/proportionalStrategy'
import { targetAllocationStrategy } from './strategies/targetAllocationStrategy'
import type {
  ContributionInput,
  ContributionResult,
  ContributionStrategy,
  ContributionStrategyType,
} from './types'

const strategies: Record<ContributionStrategyType, ContributionStrategy> = {
  proportional: proportionalStrategy,
  'target-allocation': targetAllocationStrategy,
}

export function calculateContribution(
  input: ContributionInput
): ContributionResult {
  const strategy = strategies[input.strategy]

  if (!strategy) {
    throw new Error(
      `Unsupported contribution strategy: ${String(input.strategy)}`
    )
  }

  return strategy.execute(input)
}
