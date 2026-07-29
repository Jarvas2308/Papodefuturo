import { describe, expect, it } from 'vitest'
import { parseAiExplanationOutput } from './responseSchema.ts'

const validPayload = {
  facts: ['Aporte de R$ 200,00 alocado em BBAS3.'],
  interpretation: 'A carteira reduz o desvio para ações brasileiras.',
  convictionLevel: 'medium',
  technicalPlanSummary: 'O motor sugeriu 6 unidades de BBAS3.',
  comparativeExplanation:
    'BBAS3 foi escolhido por ter o maior desvio negativo.',
}

describe('parseAiExplanationOutput', () => {
  it('parses a well-formed JSON response', () => {
    const result = parseAiExplanationOutput(
      JSON.stringify(validPayload),
      '2026-07-29T12:00:00.000Z'
    )

    expect(result).toEqual({
      schemaVersion: 'ai-explanation.v1',
      generatedAt: '2026-07-29T12:00:00.000Z',
      ...validPayload,
    })
  })

  it('extracts JSON from a markdown code fence', () => {
    const fenced = '```json\n' + JSON.stringify(validPayload) + '\n```'
    const result = parseAiExplanationOutput(fenced, '2026-07-29T12:00:00.000Z')
    expect(result.facts).toEqual(validPayload.facts)
  })

  it('rejects invalid JSON', () => {
    expect(() =>
      parseAiExplanationOutput('not json', '2026-07-29T12:00:00.000Z')
    ).toThrow('AI response is not valid JSON')
  })

  it('rejects an empty facts array', () => {
    expect(() =>
      parseAiExplanationOutput(
        JSON.stringify({ ...validPayload, facts: [] }),
        '2026-07-29T12:00:00.000Z'
      )
    ).toThrow('AI response does not match the expected explanation shape')
  })

  it('rejects an invalid convictionLevel', () => {
    expect(() =>
      parseAiExplanationOutput(
        JSON.stringify({ ...validPayload, convictionLevel: 'very-high' }),
        '2026-07-29T12:00:00.000Z'
      )
    ).toThrow('AI response does not match the expected explanation shape')
  })

  it('rejects a missing field', () => {
    const withoutInterpretation = { ...validPayload } as Record<string, unknown>
    delete withoutInterpretation.interpretation
    expect(() =>
      parseAiExplanationOutput(
        JSON.stringify(withoutInterpretation),
        '2026-07-29T12:00:00.000Z'
      )
    ).toThrow('AI response does not match the expected explanation shape')
  })
})
