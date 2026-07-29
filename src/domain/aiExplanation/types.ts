export const AI_EXPLANATION_V1_SCHEMA_VERSION = 'ai-explanation.v1' as const

export type AiExplanationConvictionLevel = 'low' | 'medium' | 'high'

export type AiExplanationV1 = {
  schemaVersion: typeof AI_EXPLANATION_V1_SCHEMA_VERSION
  generatedAt: string
  facts: string[]
  interpretation: string
  convictionLevel: AiExplanationConvictionLevel
  technicalPlanSummary: string
  comparativeExplanation: string
}
