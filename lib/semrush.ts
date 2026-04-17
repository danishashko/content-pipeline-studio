/**
 * SEMrush API client for keyword research.
 * All endpoints return semicolon-separated CSV with a header row.
 */

const SEMRUSH_BASE = "https://api.semrush.com/";
const SEMRUSH_KEY = () => process.env.SEMRUSH_API_KEY ?? "";

export interface SemrushKeyword {
  keyword: string;
  position?: number;
  searchVolume: number;
  cpc: number;
  competition: number;
  numberOfResults: number;
  trends?: string;
  url?: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildUrl(params: Record<string, string | number>): string {
  const qs = new URLSearchParams();
  qs.set("key", SEMRUSH_KEY());
  for (const [k, v] of Object.entries(params)) {
    qs.set(k, String(v));
  }
  return `${SEMRUSH_BASE}?${qs.toString()}`;
}

async function fetchCsv(url: string): Promise<string[][]> {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SEMrush API error (${res.status}): ${text}`);
  }
  const text = await res.text();
  // Each line is a row; fields are semicolon-separated
  const lines = text.trim().split("\n").filter(Boolean);
  return lines.map((line) => line.split(";"));
}

/**
 * Parse CSV rows (with header) into SemrushKeyword objects.
 * Handles both phrase_related/phrase_fullsearch format (Keyword;Search Volume;CPC;Competition;...)
 * and domain_organic format (Keyword;Position;Search Volume;CPC;Competition;...).
 */
function parseKeywords(rows: string[][]): SemrushKeyword[] {
  if (rows.length < 2) return [];

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const kwIdx = header.findIndex((h) => h === "keyword" || h === "ph");
  const posIdx = header.findIndex((h) => h === "position" || h === "po");
  const volIdx = header.findIndex((h) => h === "search volume" || h === "nq");
  const cpcIdx = header.findIndex((h) => h === "cpc" || h === "cp" || h === "cpc (usd)");
  const compIdx = header.findIndex((h) => h === "competition" || h === "co");
  const nrIdx = header.findIndex((h) => h === "number of results" || h === "nr");
  const trendIdx = header.findIndex((h) => h === "trends" || h === "td");
  const urlIdx = header.findIndex((h) => h === "url" || h === "ur");

  const dataRows = rows.slice(1);
  return dataRows
    .filter((row) => row.length > 1)
    .map((row): SemrushKeyword => {
      const safe = (idx: number) => (idx >= 0 ? (row[idx] ?? "").trim() : "");
      const num = (idx: number) => {
        const v = parseFloat(safe(idx));
        return isNaN(v) ? 0 : v;
      };
      return {
        keyword: kwIdx >= 0 ? safe(kwIdx) : safe(0),
        position: posIdx >= 0 ? (num(posIdx) || undefined) : undefined,
        searchVolume: volIdx >= 0 ? Math.round(num(volIdx)) : 0,
        cpc: cpcIdx >= 0 ? num(cpcIdx) : 0,
        competition: compIdx >= 0 ? num(compIdx) : 0,
        numberOfResults: nrIdx >= 0 ? Math.round(num(nrIdx)) : 0,
        trends: trendIdx >= 0 ? safe(trendIdx) || undefined : undefined,
        url: urlIdx >= 0 ? safe(urlIdx) || undefined : undefined,
      };
    })
    .filter((kw) => kw.keyword.length > 0);
}

// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------

/**
 * Fetch related keywords for a seed phrase (phrase_related).
 */
export async function getRelatedKeywords(
  keyword: string,
  database = "us",
  limit = 20,
): Promise<SemrushKeyword[]> {
  const url = buildUrl({
    type: "phrase_related",
    phrase: keyword,
    database,
    display_limit: limit,
  });
  const rows = await fetchCsv(url);
  return parseKeywords(rows);
}

/**
 * Fetch broad match keyword suggestions for a seed phrase (phrase_fullsearch).
 */
export async function getKeywordSuggestions(
  keyword: string,
  database = "us",
  limit = 20,
): Promise<SemrushKeyword[]> {
  const url = buildUrl({
    type: "phrase_fullsearch",
    phrase: keyword,
    database,
    display_limit: limit,
  });
  const rows = await fetchCsv(url);
  return parseKeywords(rows);
}

/**
 * Fetch organic keywords a domain ranks for (domain_organic).
 */
export async function getDomainKeywords(
  domain: string,
  database = "us",
  limit = 30,
): Promise<SemrushKeyword[]> {
  const url = buildUrl({
    type: "domain_organic",
    domain,
    database,
    display_limit: limit,
  });
  const rows = await fetchCsv(url);
  return parseKeywords(rows);
}
