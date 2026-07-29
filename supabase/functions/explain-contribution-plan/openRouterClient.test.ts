import { describe, expect, it, vi } from 'vitest'
import { createOpenRouterClient } from './openRouterClient.ts'
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
    positions: [],
  },
  strategy: { categories: [] },
  technicalPlan: {
    contributionAmountMinorInBrl: 20_000,
    totalAllocatedMinorInBrl: 20_000,
    unallocatedMinorInBrl: 0,
    stopReason: 'budget-exhausted',
    items: [],
  },
  deviations: {
    totalBeforeInBasisPoints: 0,
    totalAfterInBasisPoints: 0,
    totalReductionInBasisPoints: 0,
  },
  limitations: [],
}

const validExplanation = {
  facts: ['fato'],
  interpretation: 'interpretação',
  convictionLevel: 'medium',
  technicalPlanSummary: 'resumo',
  comparativeExplanation: 'comparativo',
}

describe('createOpenRouterClient', () => {
  it('sends the api key, model and messages, then parses a valid response', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(validExplanation) } }],
      }),
    })
    const client = createOpenRouterClient({
      apiKey: 'server-secret',
      fetchImplementation: fetchImplementation as unknown as typeof fetch,
      now: () => new Date('2026-07-29T12:05:00.000Z'),
    })

    const result = await client.explain(dossier)

    expect(result).toEqual({
      schemaVersion: 'ai-explanation.v1',
      generatedAt: '2026-07-29T12:05:00.000Z',
      ...validExplanation,
    })
    const [url, init] = fetchImplementation.mock.calls[0] as [
      string,
      RequestInit,
    ]
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions')
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer server-secret'
    )
    const body = JSON.parse(init.body as string)
    expect(body.model).toBe('anthropic/claude-sonnet-4.5')
    expect(body.messages[0].role).toBe('system')
    expect(body.messages[1].role).toBe('user')
  })

  it('throws when the HTTP request fails', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue({ ok: false })
    const client = createOpenRouterClient({
      apiKey: 'server-secret',
      fetchImplementation: fetchImplementation as unknown as typeof fetch,
    })

    await expect(client.explain(dossier)).rejects.toThrow(
      'OpenRouter API request failed'
    )
  })

  it('throws when the response has no message content', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ choices: [] }),
    })
    const client = createOpenRouterClient({
      apiKey: 'server-secret',
      fetchImplementation: fetchImplementation as unknown as typeof fetch,
    })

    await expect(client.explain(dossier)).rejects.toThrow(
      'OpenRouter API response has no message content'
    )
  })

  it('propagates a malformed explanation shape from the model', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'not json' } }],
      }),
    })
    const client = createOpenRouterClient({
      apiKey: 'server-secret',
      fetchImplementation: fetchImplementation as unknown as typeof fetch,
    })

    await expect(client.explain(dossier)).rejects.toThrow(
      'AI response is not valid JSON'
    )
  })
})
