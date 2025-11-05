import { setTimeout as delay } from 'node:timers/promises';

type JSONValue = string | number | boolean | null | JSONValue[] | { [k: string]: JSONValue };

export interface LLMClientOptions {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  maxRetries?: number;
}

export class LLMClient {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly maxRetries: number;

  constructor(options?: LLMClientOptions) {
    this.apiKey = options?.apiKey ?? process.env.OPENAI_API_KEY ?? '';
    this.model = options?.model ?? 'gpt-4o-mini';
    this.baseUrl = options?.baseUrl ?? 'https://api.openai.com/v1';
    this.maxRetries = options?.maxRetries ?? 2;

    if (!this.apiKey) {
      // We keep this non-throwing to allow the app to run without a key in dev.
      // Calls will fail with 401 at runtime if invoked without a key.
      // eslint-disable-next-line no-console
      console.warn('OPENAI_API_KEY is not set. LLM calls will fail.');
    }
  }

  async callLLM(prompt: string): Promise<JSONValue> {
    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant that returns concise JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    };

    let lastError: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          throw new Error(`LLM HTTP ${response.status}`);
        }

        const json = (await response.json()) as any;
        const content = json?.choices?.[0]?.message?.content;
        if (typeof content !== 'string') {
          throw new Error('LLM response missing content');
        }

        try {
          return JSON.parse(content) as JSONValue;
        } catch {
          // If model returns non-JSON, just return raw string
          return content;
        }
      } catch (error) {
        lastError = error;
        if (attempt < this.maxRetries) {
          await delay(250 * (attempt + 1));
          continue;
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error('LLM call failed');
  }
}

export async function callLLM(prompt: string): Promise<JSONValue> {
  const client = new LLMClient();
  return client.callLLM(prompt);
}


