/**
 * Bright Data API client for SERP queries, URL scraping, and the Discover API.
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

export interface DiscoverResult {
  link: string;
  title: string;
  description: string;
  relevanceScore: number;
  content: string | null;
}

export interface DiscoverOptions {
  intent?: string;
  filterKeywords?: string[];
  numResults?: number;
  country?: string;
  includeContent?: boolean;
  startDate?: string;
  endDate?: string;
}

// ---------------------------------------------------------------------------
// Discover API (combines SERP + scraping in one call)
// ---------------------------------------------------------------------------

/**
 * Query the Bright Data Discover API.
 * Endpoint: POST https://api.brightdata.com/discover
 * Async: triggers a task, then polls until done.
 */
export async function discover(
  query: string,
  options: DiscoverOptions = {},
): Promise<DiscoverResult[]> {
  const {
    intent,
    filterKeywords,
    numResults = 10,
    country = "US",
    includeContent = false,
    startDate,
    endDate,
  } = options;

  // Step 1: Trigger the discovery task
  const payload: Record<string, unknown> = {
    query,
    num_results: numResults,
    country,
    language: "en",
    format: "json",
    include_content: includeContent,
    remove_duplicates: true,
  };
  if (intent) payload.intent = intent;
  if (filterKeywords?.length) payload.filter_keywords = filterKeywords;
  if (startDate) payload.start_date = startDate;
  if (endDate) payload.end_date = endDate;

  const triggerRes = await fetch("https://api.brightdata.com/discover", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${BRIGHT_DATA_KEY()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!triggerRes.ok) {
    const text = await triggerRes.text();
    throw new Error(`Discover API trigger error (${triggerRes.status}): ${text}`);
  }

  const triggerData = (await triggerRes.json()) as { task_id?: string; status?: string };
  const taskId = triggerData.task_id;
  if (!taskId) {
    throw new Error(`Discover API returned no task_id: ${JSON.stringify(triggerData)}`);
  }

  // Step 2: Poll for results (max 60s with exponential backoff)
  const maxWaitMs = 60_000;
  const startTime = Date.now();
  let delayMs = 2_000;

  while (Date.now() - startTime < maxWaitMs) {
    await new Promise((r) => setTimeout(r, delayMs));
    delayMs = Math.min(delayMs * 1.5, 10_000);

    const pollRes = await fetch(
      `https://api.brightdata.com/discover?task_id=${taskId}`,
      {
        headers: { Authorization: `Bearer ${BRIGHT_DATA_KEY()}` },
      },
    );

    if (!pollRes.ok) {
      const text = await pollRes.text();
      throw new Error(`Discover API poll error (${pollRes.status}): ${text}`);
    }

    const pollData = (await pollRes.json()) as {
      status: string;
      results?: {
        link?: string;
        title?: string;
        description?: string;
        relevance_score?: number;
        content?: string | null;
      }[];
    };

    if (pollData.status === "done") {
      return (pollData.results ?? []).map((r) => ({
        link: r.link ?? "",
        title: r.title ?? "",
        description: r.description ?? "",
        relevanceScore: r.relevance_score ?? 0,
        content: r.content ?? null,
      }));
    }

    if (pollData.status !== "processing") {
      throw new Error(`Discover API unexpected status: ${pollData.status}`);
    }
  }

  console.warn(`[Discover] Timed out after ${maxWaitMs / 1000}s for task ${taskId}`);
  return [];
}

// ---------------------------------------------------------------------------
// SERP search (legacy, uses brd_json=1 for parsed results)
// ---------------------------------------------------------------------------

/**
 * Query the Bright Data SERP zone and return organic search results.
 * Uses brd_json=1 to get parsed JSON instead of raw HTML.
 */
export async function searchSerp(
  query: string,
  options: SerpOptions = {},
): Promise<SerpResult[]> {
  const { country = "us", numResults = 10 } = options;

  const res = await fetch("https://api.brightdata.com/request", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${BRIGHT_DATA_KEY()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      zone: BRIGHT_DATA_SERP_ZONE(),
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}&gl=${country}&num=${numResults}&brd_json=1`,
      format: "raw",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bright Data SERP error (${res.status}): ${text}`);
  }

  const raw = await res.text();

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    console.warn(`[SERP] Response is not JSON (${raw.length} chars). First 200: ${raw.slice(0, 200)}`);
    return [];
  }

  // Unwrap /request envelope { status_code, headers, body }
  if (data.status_code !== undefined && data.body !== undefined) {
    if (typeof data.body === "string") {
      try {
        data = JSON.parse(data.body) as Record<string, unknown>;
      } catch {
        console.warn(`[SERP] body is non-JSON (${(data.body as string).length} chars)`);
        return [];
      }
    } else if (typeof data.body === "object" && data.body !== null) {
      data = data.body as Record<string, unknown>;
    }
  }

  const organic = (
    data.organic ?? data.results ?? data.organic_results ?? []
  ) as Record<string, unknown>[];

  if (organic.length === 0) {
    console.warn(`[SERP] No organic results. Keys: ${Object.keys(data).join(", ")}`);
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
