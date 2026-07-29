import type { AiExplanationV1 } from '../domain/aiExplanation'
import type { TechnicalDossierV1 } from '../domain/technicalDossier'
import type { AiExplanationRepository } from './repositories/contracts'

export async function explainContributionPlanBestEffort(
  repository: AiExplanationRepository,
  dossier: TechnicalDossierV1
): Promise<AiExplanationV1 | null> {
  try {
    return await repository.explain(dossier)
  } catch {
    return null
  }
}
