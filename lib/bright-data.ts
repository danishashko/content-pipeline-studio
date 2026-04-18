/**
 * Bright Data API client for SERP queries and URL scraping.
 */

const BRIGHT_DATA_KEY = () => process.env.BRIGHT_DATA_API_KEY ?? "";
const BRIGHT_DATA_SERP_ZONE = () => process.env.BRIGHT_DATA_SERP_ZONE ?? "serp_api";
const BRIGHT_DATA_UNLOCKER_ZONE = () => process.env.BRIGHT_DATA_UNLOCKER_ZONE ?? "web_unlocker1";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SerpResult {
  position: number;
  title: string;
  url: string;
  description: string;
}

export interface SerpOptions {
  country?: string;
  numResults?: number;
}

// ---------------------------------------------------------------------------
// SERP search
// ---------------------------------------------------------------------------

/**
 * Query the Bright Data SERP API and return organic search results.
 *
 * Uses the `/serp/req` endpoint. The API returns a JSON object
 * with an `organic` array of result objects.
 */
export async function searchSerp(
  query: string,
  options: SerpOptions = {},
): Promise<SerpResult[]> {
  const { country = "us", numResults = 10 } = options;

  const res = await fetch(
    "https://api.brightdata.com/request",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${BRIGHT_DATA_KEY()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        zone: BRIGHT_DATA_SERP_ZONE(),
        url: `https://www.google.com/search?q=${encodeURIComponent(query)}&gl=${country}&num=${numResults}`,
        format: "json",
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bright Data SERP error (${res.status}): ${text}`);
  }

  const raw = await res.text();

  // Bright Data SERP zones may return HTML, JSON, or wrapped JSON.
  // Try to parse as JSON first; if it fails, return empty results.
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    console.warn(`[SERP] Response is not JSON (${raw.length} chars). First 200: ${raw.slice(0, 200)}`);
    return [];
  }

  // The /request endpoint wraps responses in { status_code, headers, body }.
  // Unwrap if we detect that structure. Body may be an object or a JSON string.
  if (data.status_code !== undefined && data.body !== undefined) {
    if (typeof data.body === "string") {
      try {
        data = JSON.parse(data.body) as Record<string, unknown>;
      } catch {
        console.warn(`[SERP] body is a non-JSON string (${(data.body as string).length} chars). First 200: ${(data.body as string).slice(0, 200)}`);
        return [];
      }
    } else if (typeof data.body === "object" && data.body !== null) {
      data = data.body as Record<string, unknown>;
    }
  }

  // Different zones use different response shapes.
  // Try common field names for organic results.
  const organic = (
    data.organic ??
    data.results ??
    data.organic_results ??
    []
  ) as Record<string, unknown>[];

  if (organic.length === 0) {
    console.warn(`[SERP] No organic results found. Response keys: ${Object.keys(data).join(", ")}`);
  }

  return organic.map((item, idx) => ({
    position: (item.rank ?? item.position ?? idx + 1) as number,
    title: (item.title ?? "") as string,
    url: (item.link ?? item.url ?? "") as string,
    description: (item.description ?? item.snippet ?? "") as string,
  }));
}

// ---------------------------------------------------------------------------
// URL scraping
// ---------------------------------------------------------------------------

/**
 * Scrape a URL via the Bright Data Web Unlocker zone and return Markdown content.
 *
 * The Web Unlocker zone handles JS rendering, CAPTCHAs, and bot protection
 * transparently. Returns the page content converted to Markdown.
 */
export async function scrapeUrl(url: string): Promise<string> {
  const res = await fetch("https://api.brightdata.com/request", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${BRIGHT_DATA_KEY()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      zone: BRIGHT_DATA_UNLOCKER_ZONE(),
      url,
      format: "markdown",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bright Data scrape error (${res.status}): ${text}`);
  }

  return res.text();
}
