import {
  buildExplanationUserPrompt,
  EXPLANATION_SYSTEM_PROMPT,
} from './promptBuilder.ts'
import { parseAiExplanationOutput } from './responseSchema.ts'
import type { AiExplanationOutput, TechnicalDossierInput } from './types.ts'

type FetchLike = typeof fetch

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_MODEL = 'anthropic/claude-sonnet-4.5'
const MAX_OUTPUT_TOKENS = 1024

type OpenRouterChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>
}

export function createOpenRouterClient({
  apiKey,
  fetchImplementation = fetch,
  now = () => new Date(),
}: {
  apiKey: string
  fetchImplementation?: FetchLike
  now?: () => Date
}) {
  return {
    async explain(
      dossier: TechnicalDossierInput
    ): Promise<AiExplanationOutput> {
      const response = await fetchImplementation(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          max_tokens: MAX_OUTPUT_TOKENS,
          temperature: 0.2,
          messages: [
            { role: 'system', content: EXPLANATION_SYSTEM_PROMPT },
            { role: 'user', content: buildExplanationUserPrompt(dossier) },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error('OpenRouter API request failed')
      }

      const payload =
        (await response.json()) as OpenRouterChatCompletionResponse
      const content = payload.choices?.[0]?.message?.content

      if (!content) {
        throw new Error('OpenRouter API response has no message content')
      }

      return parseAiExplanationOutput(content, now().toISOString())
    },
  }
}
