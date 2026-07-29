import { describe, expect, it } from 'vitest'
import { validateTechnicalDossierInput } from './dossierValidator.ts'

function buildValidDossier() {
  return {
    schemaVersion: 'technical-dossier.v1',
    generatedAt: '2026-07-29T12:00:00.000Z',
    portfolio: {
      baseCurrency: 'BRL',
      totalInvestedMinorInBrl: 100_000,
      totalCurrentMinorInBrl: 110_000,
      totalResultMinorInBrl: 10_000,
      totalResultPercentage: 10,
      positions: [
        {
          assetId: 'asset-bbas3',
          ticker: 'BBAS3',
          name: 'Banco do Brasil',
          category: 'brazilian-stock',
          currency: 'BRL',
          quantity: 10,
          currentMinorInBrl: 20_000,
          resultPercentage: 5,
        },
      ],
    },
    strategy: {
      categories: [
        {
          id: 'brazilian-stocks',
          name: 'Ações brasileiras',
          targetInBasisPoints: 3_529,
          assets: [
            {
              assetId: 'asset-bbas3',
              ticker: 'BBAS3',
              name: 'Banco do Brasil',
              globalTargetInBasisPoints: 3_529,
            },
          ],
        },
      ],
    },
    technicalPlan: {
      contributionAmountMinorInBrl: 20_000,
      totalAllocatedMinorInBrl: 20_000,
      unallocatedMinorInBrl: 0,
      stopReason: 'budget-exhausted',
      items: [
        {
          assetId: 'asset-bbas3',
          ticker: 'BBAS3',
          name: 'Banco do Brasil',
          suggestedQuantity: 6,
          unitPriceMinorInBrl: 3_333,
          allocatedMinorInBrl: 20_000,
          differenceBeforeInBasisPoints: -250,
          differenceAfterInBasisPoints: 100,
        },
      ],
    },
    deviations: {
      totalBeforeInBasisPoints: 250,
      totalAfterInBasisPoints: 100,
      totalReductionInBasisPoints: 150,
    },
    limitations: [
      { code: 'simulation-only', description: 'Apenas uma simulação.' },
    ],
  }
}

describe('validateTechnicalDossierInput', () => {
  it('accepts a well-formed dossier', () => {
    const dossier = buildValidDossier()
    expect(validateTechnicalDossierInput(dossier)).toEqual(dossier)
  })

  it('rejects a missing top-level field', () => {
    const withoutPortfolio = buildValidDossier() as Record<string, unknown>
    delete withoutPortfolio.portfolio
    expect(() => validateTechnicalDossierInput(withoutPortfolio)).toThrow(
      'Invalid technical dossier payload'
    )
  })

  it('rejects an invalid generatedAt', () => {
    expect(() =>
      validateTechnicalDossierInput({
        ...buildValidDossier(),
        generatedAt: 'not-a-date',
      })
    ).toThrow('Invalid technical dossier payload')
  })

  it('rejects a malformed portfolio position', () => {
    const dossier = buildValidDossier()
    dossier.portfolio.positions[0] = {
      ...dossier.portfolio.positions[0],
      quantity: Number.NaN,
    }
    expect(() => validateTechnicalDossierInput(dossier)).toThrow(
      'Invalid technical dossier portfolio position'
    )
  })

  it('rejects a non-object payload', () => {
    expect(() => validateTechnicalDossierInput(null)).toThrow(
      'Invalid technical dossier payload'
    )
    expect(() => validateTechnicalDossierInput('dossier')).toThrow(
      'Invalid technical dossier payload'
    )
  })
})
