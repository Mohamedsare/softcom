/**
 * DeepSeek API client (OpenAI-compatible chat completions).
 * Configure VITE_DEEPSEEK_API_KEY in .env to enable.
 */

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
const DEFAULT_MODEL = 'deepseek-chat'

export function getDeepSeekApiKey(): string | undefined {
  return import.meta.env.VITE_DEEPSEEK_API_KEY as string | undefined
}

export function isDeepSeekConfigured(): boolean {
  const key = getDeepSeekApiKey()
  return typeof key === 'string' && key.trim().length > 0
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  model?: string
  max_tokens?: number
  temperature?: number
  /** When true, asks for a JSON object in the response (model may still return markdown-wrapped JSON) */
  response_format?: { type: 'json_object' }
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<string> {
  const apiKey = getDeepSeekApiKey()
  if (!apiKey) {
    throw new Error('Clé API DeepSeek non configurée. Ajoutez VITE_DEEPSEEK_API_KEY dans .env')
  }

  const body: Record<string, unknown> = {
    model: options.model ?? DEFAULT_MODEL,
    messages,
    max_tokens: options.max_tokens ?? 1024,
    temperature: options.temperature ?? 0.3,
  }
  if (options.response_format) body.response_format = options.response_format

  const res = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DeepSeek API: ${res.status} ${err}`)
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = data.choices?.[0]?.message?.content
  if (content == null) throw new Error('Réponse DeepSeek invalide')
  return content
}
