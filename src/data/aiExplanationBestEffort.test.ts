import { describe, expect, it, vi } from 'vitest'
import { explainContributionPlanBestEffort } from './aiExplanationBestEffort'
import type { AiExplanationRepository } from './repositories/contracts'
import type { TechnicalDossierV1 } from '../domain/technicalDossier'

const dossier = {
  schemaVersion: 'technical-dossier.v1',
} as unknown as TechnicalDossierV1

const explanation = {
  schemaVersion: 'ai-explanation.v1',
  generatedAt: '2026-07-29T12:00:00.000Z',
  facts: ['fato'],
  interpretation: 'interpretação',
  convictionLevel: 'medium' as const,
  technicalPlanSummary: 'resumo',
  comparativeExplanation: 'comparativo',
}

describe('explainContributionPlanBestEffort', () => {
  it('returns the explanation when the repository succeeds', async () => {
    const repository: AiExplanationRepository = {
      explain: vi.fn().mockResolvedValue(explanation),
    }

    await expect(
      explainContributionPlanBestEffort(repository, dossier)
    ).resolves.toEqual(explanation)
  })

  it('degrades silently to null when the repository fails, never throwing', async () => {
    const repository: AiExplanationRepository = {
      explain: vi.fn().mockRejectedValue(new Error('function unavailable')),
    }

    await expect(
      explainContributionPlanBestEffort(repository, dossier)
    ).resolves.toBeNull()
  })
})
