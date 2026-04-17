/**
 * Bright Data API client for SERP queries and URL scraping.
 */

const BRIGHT_DATA_KEY = () => process.env.BRIGHT_DATA_API_KEY ?? "";

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

  const params = new URLSearchParams({
    engine: "google",
    q: query,
    gl: country,
    num: String(numResults),
  });

  const res = await fetch(
    `https://api.brightdata.com/serp/req?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${BRIGHT_DATA_KEY()}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bright Data SERP error (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    organic?: {
      rank?: number;
      title?: string;
      link?: string;
      description?: string;
    }[];
  };

  return (data.organic ?? []).map((item, idx) => ({
    position: item.rank ?? idx + 1,
    title: item.title ?? "",
    url: item.link ?? "",
    description: item.description ?? "",
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
      zone: "web_unlocker1",
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
