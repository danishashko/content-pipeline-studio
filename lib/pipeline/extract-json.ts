/**
 * Robust JSON extraction and parsing from LLM responses.
 *
 * Different models wrap JSON differently:
 *   - Claude: clean ```json fences, sometimes bare JSON
 *   - Gemini: may add prose, sometimes produces malformed JSON strings
 *   - GPT: usually ```json fences
 *   - Kimi/DeepSeek: may add trailing commentary
 *
 * This module handles extraction, repair, and parsing reliably.
 */

/**
 * Extract a JSON object string from raw LLM text output.
 * Uses brace-depth matching to find the correct closing brace,
 * which avoids the problem of code fences inside markdownContent
 * breaking a naive regex match.
 */
export function extractJson(text: string): string {
  // Strategy 1: Look for ```json fences and extract the one containing JSON
  const fenceMatches = [...text.matchAll(/```(?:json)?\s*\n?([\s\S]*?)```/g)];
  if (fenceMatches.length > 0) {
    for (let i = fenceMatches.length - 1; i >= 0; i--) {
      const content = fenceMatches[i][1].trim();
      if (content.startsWith("{")) {
        try {
          JSON.parse(content);
          return content;
        } catch {
          // Try repair on fenced content
          const repaired = repairJson(content);
          try {
            JSON.parse(repaired);
            return repaired;
          } catch {
            // Fall through to brace matching
          }
        }
      }
    }
  }

  // Strategy 2: Brace-depth matching (handles nested braces + braces inside strings)
  const firstBrace = text.indexOf("{");
  if (firstBrace !== -1) {
    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = firstBrace; i < text.length; i++) {
      const ch = text[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (ch === "{") depth++;
      if (ch === "}") {
        depth--;
        if (depth === 0) {
          return text.slice(firstBrace, i + 1);
        }
      }
    }
  }

  // Strategy 3: Last resort, first brace to last brace
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }

  return text.trim();
}

/**
 * Attempt common JSON repairs for malformed LLM output:
 * - Trailing commas before } or ]
 * - Unescaped control characters inside string values
 * - Unescaped newlines inside strings
 */
function repairJson(text: string): string {
  let result = text;

  // Fix trailing commas: ,} -> } and ,] -> ]
  result = result.replace(/,\s*([}\]])/g, "$1");

  // Fix unescaped control characters inside JSON strings.
  // Walk through and re-escape raw newlines/tabs inside string values.
  const chars: string[] = [];
  let inStr = false;
  let esc = false;

  for (let i = 0; i < result.length; i++) {
    const ch = result[i];

    if (esc) {
      chars.push(ch);
      esc = false;
      continue;
    }

    if (ch === "\\") {
      chars.push(ch);
      esc = true;
      continue;
    }

    if (ch === '"') {
      inStr = !inStr;
      chars.push(ch);
      continue;
    }

    if (inStr) {
      // Escape raw control characters that break JSON
      if (ch === "\n") {
        chars.push("\\n");
        continue;
      }
      if (ch === "\r") {
        chars.push("\\r");
        continue;
      }
      if (ch === "\t") {
        chars.push("\\t");
        continue;
      }
    }

    chars.push(ch);
  }

  return chars.join("");
}

/**
 * Extract and parse JSON from LLM output with automatic repair.
 * Returns the parsed object, or throws with a descriptive error.
 */
export function parseJsonResponse<T = unknown>(raw: string): T {
  const extracted = extractJson(raw);

  // Attempt 1: direct parse
  try {
    return JSON.parse(extracted) as T;
  } catch {
    // Attempt 2: repair and retry
  }

  const repaired = repairJson(extracted);
  try {
    return JSON.parse(repaired) as T;
  } catch (e) {
    const pos = e instanceof SyntaxError ? e.message : "unknown position";

    // Log the area around the error for debugging
    const match = String(pos).match(/position (\d+)/);
    if (match) {
      const errPos = parseInt(match[1], 10);
      const context = repaired.slice(Math.max(0, errPos - 80), errPos + 80);
      console.error(`[JSON Parse] Error near position ${errPos}:\n...${context}...`);
    }
    console.error(`[JSON Parse] Total length: ${repaired.length}, Raw length: ${raw.length}`);

    const snippet = extracted.slice(0, 500);
    throw new Error(
      `Failed to parse LLM JSON output after repair. Error: ${pos}\nFirst 500 chars: ${snippet}`,
    );
  }
}
