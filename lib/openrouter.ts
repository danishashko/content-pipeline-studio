/**
 * OpenRouter LLM client for Content Pipeline Studio.
 * Supports non-streaming completions and streaming SSE responses.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_KEY = () => process.env.OPENROUTER_API_KEY ?? "";

// ---------------------------------------------------------------------------
// Model constants
// ---------------------------------------------------------------------------

/** Default models per pipeline stage. Can be overridden per-site via modelConfig. */
export const DEFAULT_MODELS = {
  research: "moonshotai/kimi-k2.5",
  writer: "deepseek/deepseek-chat-v3-0324",
  validator: "deepseek/deepseek-chat-v3-0324",
  publisher: "openai/gpt-4o-mini",
} as const;

// Convenience re-exports (backwards compat)
export const RESEARCH_MODEL = DEFAULT_MODELS.research;
export const WRITER_MODEL = DEFAULT_MODELS.writer;
export const VALIDATOR_MODEL = DEFAULT_MODELS.validator;
export const PUBLISHER_MODEL = DEFAULT_MODELS.publisher;

/** Resolve model for a stage, with site-level override taking precedence. */
export function resolveModel(
  stage: "research" | "writer" | "validator" | "publisher",
  siteModelConfig?: { research?: string; writer?: string; validator?: string; publisher?: string },
): string {
  return siteModelConfig?.[stage] || DEFAULT_MODELS[stage];
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LLMOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
}

type ChatMessage = { role: string; content: string };

const DEFAULTS: Required<LLMOptions> = {
  model: RESEARCH_MODEL,
  maxTokens: 4096,
  temperature: 0.3,
  jsonMode: false,
};

const SHARED_HEADERS = {
  "Content-Type": "application/json",
  "HTTP-Referer": "https://content-pipeline-studio.vercel.app",
  "X-Title": "Content Pipeline Studio",
} as const;

// ---------------------------------------------------------------------------
// Non-streaming completion
// ---------------------------------------------------------------------------

/**
 * Send a single system + user prompt to OpenRouter and return the text response.
 */
export async function complete(
  systemPrompt: string,
  userPrompt: string,
  opts: LLMOptions = {},
): Promise<string> {
  const config = { ...DEFAULTS, ...opts };

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      ...SHARED_HEADERS,
      Authorization: `Bearer ${OPENROUTER_KEY()}`,
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter error (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}

// ---------------------------------------------------------------------------
// Streaming completion
// ---------------------------------------------------------------------------

/**
 * Open a streaming SSE connection to OpenRouter and return the raw ReadableStream.
 * The system prompt is prepended as the first message.
 */
export async function streamComplete(
  systemPrompt: string,
  messages: ChatMessage[],
  opts: LLMOptions = {},
): Promise<ReadableStream<Uint8Array>> {
  const config = { ...DEFAULTS, ...opts };

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      ...SHARED_HEADERS,
      Authorization: `Bearer ${OPENROUTER_KEY()}`,
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      stream: true,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    }),
  });

  if (!res.ok || !res.body) {
    const text = res.body ? await res.text() : "(no body)";
    throw new Error(`OpenRouter stream error (${res.status}): ${text}`);
  }

  return res.body;
}
