import { describe, expect, it, vi } from 'vitest'
import { createAnthropicClient } from './anthropicClient.ts'
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

describe('createAnthropicClient', () => {
  it('sends the api key and model in the request and parses a valid response', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(validExplanation) }],
      }),
    })
    const client = createAnthropicClient({
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
    expect(url).toBe('https://api.anthropic.com/v1/messages')
    expect((init.headers as Record<string, string>)['x-api-key']).toBe(
      'server-secret'
    )
    const body = JSON.parse(init.body as string)
    expect(body.model).toBe('claude-sonnet-5')
  })

  it('throws when the HTTP request fails', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue({ ok: false })
    const client = createAnthropicClient({
      apiKey: 'server-secret',
      fetchImplementation: fetchImplementation as unknown as typeof fetch,
    })

    await expect(client.explain(dossier)).rejects.toThrow(
      'Anthropic API request failed'
    )
  })

  it('throws when the response has no text content block', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ content: [] }),
    })
    const client = createAnthropicClient({
      apiKey: 'server-secret',
      fetchImplementation: fetchImplementation as unknown as typeof fetch,
    })

    await expect(client.explain(dossier)).rejects.toThrow(
      'Anthropic API response has no text content'
    )
  })

  it('propagates a malformed explanation shape from the model', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'not json' }],
      }),
    })
    const client = createAnthropicClient({
      apiKey: 'server-secret',
      fetchImplementation: fetchImplementation as unknown as typeof fetch,
    })

    await expect(client.explain(dossier)).rejects.toThrow(
      'AI response is not valid JSON'
    )
  })
})
