import type { VerificationEntry } from "@/lib/types";
import { scrapeUrl } from "@/lib/bright-data";

export interface StatClaim {
  url: string;
  claim: string;
}

/**
 * For each stat claim, scrapes the source URL via Bright Data and checks
 * whether the claim text (or key tokens from it) appears in the page content.
 * Returns a VerificationEntry for each claim.
 */
export async function verifyStats(
  stats: StatClaim[],
): Promise<VerificationEntry[]> {
  const results = await Promise.allSettled(
    stats.map((stat) => verifySingleStat(stat)),
  );

  return results.map((result, idx) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    return {
      type: "stat_check" as const,
      targetUrl: stats[idx].url,
      status: "failed" as const,
      details: result.reason instanceof Error
        ? result.reason.message
        : String(result.reason),
    };
  });
}

/**
 * Extracts the key numeric tokens from a claim string (percentages, large
 * numbers, year references) that are most likely to appear verbatim on the
 * source page. This avoids false negatives from minor phrasing differences.
 */
function extractKeyTokens(claim: string): string[] {
  const tokens: string[] = [];

  // Percentages: e.g. "73%", "73 percent"
  const pctMatches = claim.match(/\d+(?:\.\d+)?(?:\s*%|\s+percent)/gi) ?? [];
  tokens.push(...pctMatches.map((t) => t.replace(/\s+/g, "").toLowerCase()));

  // Large numbers with commas or multipliers: e.g. "$1.2 trillion", "4.5 billion"
  const numMatches =
    claim.match(/\$?\d[\d,]*(?:\.\d+)?\s*(?:trillion|billion|million|thousand)?/gi) ?? [];
  tokens.push(...numMatches.map((t) => t.replace(/\s+/g, " ").toLowerCase()));

  // Year references: e.g. "2023", "2024"
  const yearMatches = claim.match(/\b20\d{2}\b/g) ?? [];
  tokens.push(...yearMatches);

  return [...new Set(tokens)].filter((t) => t.length > 0);
}

async function verifySingleStat(stat: StatClaim): Promise<VerificationEntry> {
  let pageContent: string;

  try {
    pageContent = await scrapeUrl(stat.url);
  } catch (err) {
    return {
      type: "stat_check",
      targetUrl: stat.url,
      status: "failed",
      details: `Scrape failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const normalizedContent = pageContent.toLowerCase();

  // First try: check if the full claim (lowercased) is a substring
  if (normalizedContent.includes(stat.claim.toLowerCase())) {
    return {
      type: "stat_check",
      targetUrl: stat.url,
      status: "verified",
      details: "Exact claim text found on page",
    };
  }

  // Second try: check key numeric tokens
  const keyTokens = extractKeyTokens(stat.claim);
  if (keyTokens.length === 0) {
    // Cannot extract key tokens; skip rather than fail
    return {
      type: "stat_check",
      targetUrl: stat.url,
      status: "skipped",
      details: "No numeric tokens to verify in claim",
    };
  }

  const matchedTokens = keyTokens.filter((token) =>
    normalizedContent.includes(token),
  );

  // Require at least half the key tokens to match
  const matchRatio = matchedTokens.length / keyTokens.length;
  if (matchRatio >= 0.5) {
    return {
      type: "stat_check",
      targetUrl: stat.url,
      status: "verified",
      details: `Key tokens found on page: ${matchedTokens.join(", ")}`,
    };
  }

  return {
    type: "stat_check",
    targetUrl: stat.url,
    status: "failed",
    details: `Key tokens not found. Expected: [${keyTokens.join(", ")}]. Matched: [${matchedTokens.join(", ")}]`,
  };
}
