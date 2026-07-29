import { describe, expect, it } from 'vitest'
import {
  buildExplanationUserPrompt,
  EXPLANATION_SYSTEM_PROMPT,
} from './promptBuilder.ts'
import type { TechnicalDossierInput } from './types.ts'

const dossier: TechnicalDossierInput = {
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
  strategy: { categories: [] },
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

describe('EXPLANATION_SYSTEM_PROMPT', () => {
  it('forbids the AI from creating, selecting or modifying the plan', () => {
    expect(EXPLANATION_SYSTEM_PROMPT).toContain(
      'NUNCA cria, seleciona ou modifica o plano técnico'
    )
  })

  it('forbids inventing numbers not present in the dossier', () => {
    expect(EXPLANATION_SYSTEM_PROMPT).toContain('Nunca invente')
  })

  it('requires strict JSON output matching the AiExplanationOutput shape', () => {
    expect(EXPLANATION_SYSTEM_PROMPT).toContain('"facts"')
    expect(EXPLANATION_SYSTEM_PROMPT).toContain('"convictionLevel"')
  })
})

describe('buildExplanationUserPrompt', () => {
  it('includes the exact ticker and monetary facts from the dossier', () => {
    const prompt = buildExplanationUserPrompt(dossier)

    expect(prompt).toContain('BBAS3')
    expect(prompt).toContain('200,00')
    expect(prompt).toContain('budget-exhausted')
    expect(prompt).toContain('Apenas uma simulação.')
  })

  it('never leaks anything beyond the provided dossier facts', () => {
    const prompt = buildExplanationUserPrompt(dossier)
    expect(prompt).not.toContain('undefined')
    expect(prompt).not.toContain('[object Object]')
  })
})
