import {
  AI_EXPLANATION_V1_SCHEMA_VERSION,
  type AiExplanationConvictionLevel,
  type AiExplanationOutput,
} from './types.ts'

const CONVICTION_LEVELS: readonly AiExplanationConvictionLevel[] = [
  'low',
  'medium',
  'high',
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function extractJsonText(rawText: string): string {
  const trimmed = rawText.trim()
  const fencedMatch = /```(?:json)?\s*([\s\S]*?)\s*```/.exec(trimmed)

  return fencedMatch ? fencedMatch[1].trim() : trimmed
}

export function parseAiExplanationOutput(
  rawText: string,
  generatedAt: string
): AiExplanationOutput {
  let parsed: unknown

  try {
    parsed = JSON.parse(extractJsonText(rawText))
  } catch {
    throw new Error('AI response is not valid JSON')
  }

  if (
    !isRecord(parsed) ||
    !Array.isArray(parsed.facts) ||
    parsed.facts.length === 0 ||
    !parsed.facts.every(isNonEmptyString) ||
    !isNonEmptyString(parsed.interpretation) ||
    !isNonEmptyString(parsed.technicalPlanSummary) ||
    !isNonEmptyString(parsed.comparativeExplanation) ||
    typeof parsed.convictionLevel !== 'string' ||
    !CONVICTION_LEVELS.includes(
      parsed.convictionLevel as AiExplanationConvictionLevel
    )
  ) {
    throw new Error('AI response does not match the expected explanation shape')
  }

  return {
    schemaVersion: AI_EXPLANATION_V1_SCHEMA_VERSION,
    generatedAt,
    facts: parsed.facts,
    interpretation: parsed.interpretation,
    convictionLevel: parsed.convictionLevel as AiExplanationConvictionLevel,
    technicalPlanSummary: parsed.technicalPlanSummary,
    comparativeExplanation: parsed.comparativeExplanation,
  }
}
