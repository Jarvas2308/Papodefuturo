import { describe, expect, it } from 'vitest'
import { calculateContribution } from './contributionEngine'
import { proportionalStrategy } from './strategies/proportionalStrategy'
import { targetAllocationStrategy } from './strategies/targetAllocationStrategy'
import type { ContributionInput, ContributionStrategyType } from './types'

const baseInput: ContributionInput = {
  valorAporteEmCentavos: 100_000,
  carteiraAtual: [
    {
      assetId: 'stocks',
      category: 'brazilian-stocks',
      currentValueInCents: 80,
    },
    {
      assetId: 'international',
      category: 'international',
      currentValueInCents: 20,
    },
  ],
  metasAlocacao: [{ category: 'international', targetPercentage: 30 }],
  strategy: 'proportional',
}

describe('calculateContribution', () => {
  it('delegates proportional calculation without changing its result', () => {
    expect(calculateContribution(baseInput)).toEqual(
      proportionalStrategy.execute(baseInput)
    )
  })

  it('delegates target allocation without changing its result', () => {
    const input: ContributionInput = {
      ...baseInput,
      metasAlocacao: [
        { category: 'brazilian-stocks', targetPercentage: 70 },
        { category: 'international', targetPercentage: 30 },
      ],
      strategy: 'target-allocation',
    }
    expect(calculateContribution(input)).toEqual(
      targetAllocationStrategy.execute(input)
    )
  })

  it('rejects an unsupported strategy at runtime', () => {
    const invalidInput = {
      ...baseInput,
      strategy: 'unsupported' as ContributionStrategyType,
    }

    expect(() => calculateContribution(invalidInput)).toThrow(
      'Unsupported contribution strategy: unsupported'
    )
  })
})
