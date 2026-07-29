import {
  buildExplanationUserPrompt,
  EXPLANATION_SYSTEM_PROMPT,
} from './promptBuilder.ts'
import { parseAiExplanationOutput } from './responseSchema.ts'
import type { AiExplanationOutput, TechnicalDossierInput } from './types.ts'

type FetchLike = typeof fetch

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_API_VERSION = '2023-06-01'
const ANTHROPIC_MODEL = 'claude-sonnet-5'
const MAX_OUTPUT_TOKENS = 1024

type AnthropicMessageResponse = {
  content?: Array<{ type?: string; text?: string }>
}

export function createAnthropicClient({
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
      const response = await fetchImplementation(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_API_VERSION,
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: MAX_OUTPUT_TOKENS,
          temperature: 0.2,
          system: EXPLANATION_SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: buildExplanationUserPrompt(dossier),
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error('Anthropic API request failed')
      }

      const payload = (await response.json()) as AnthropicMessageResponse
      const textBlock = payload.content?.find(
        (block) => block.type === 'text' && typeof block.text === 'string'
      )

      if (!textBlock?.text) {
        throw new Error('Anthropic API response has no text content')
      }

      return parseAiExplanationOutput(textBlock.text, now().toISOString())
    },
  }
}
