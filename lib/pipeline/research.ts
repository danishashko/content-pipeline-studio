import type { ContentBrief, SiteConfig } from "@/lib/types";
import { ContentBriefSchema } from "@/lib/types";
import { searchSerp, scrapeUrl } from "@/lib/bright-data";
import { complete, RESEARCH_MODEL } from "@/lib/openrouter";
import { getResearcherPrompt } from "@/lib/pipeline/prompts/researcher";
import { parseJsonResponse } from "@/lib/pipeline/extract-json";

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  path: string;
}

/**
 * Parses sitemap XML into structured entries using regex (no external dep).
 * Handles both regular sitemaps (<url>) and sitemap index files (<sitemap>).
 * Returns up to `limit` entries sorted by lastmod descending.
 */
function parseSitemap(xml: string, baseDomain: string, limit = 50): SitemapEntry[] {
  // Detect sitemap index (links to other sitemaps) - extract child sitemap locs only
  const isSitemapIndex = /<sitemap[\s>]/i.test(xml);
  const blockPattern = isSitemapIndex
    ? /<sitemap>([\s\S]*?)<\/sitemap>/gi
    : /<url>([\s\S]*?)<\/url>/gi;

  const entries: SitemapEntry[] = [];
  let match: RegExpExecArray | null;

  while ((match = blockPattern.exec(xml)) !== null) {
    const block = match[1];
    const locMatch = block.match(/<loc>\s*(.*?)\s*<\/loc>/i);
    if (!locMatch) continue;
    const loc = locMatch[1].trim();

    const lastmodMatch = block.match(/<lastmod>\s*(.*?)\s*<\/lastmod>/i);
    const lastmod = lastmodMatch ? lastmodMatch[1].trim() : undefined;

    // Derive relative path by stripping protocol + domain
    let path = loc;
    try {
      const url = new URL(loc);
      path = url.pathname + (url.search || "");
    } catch {
      // If URL parse fails, try stripping the base domain manually
      const domainPattern = new RegExp(`https?://[^/]*${baseDomain.replace(/\./g, "\\.")}`, "i");
      path = loc.replace(domainPattern, "") || loc;
    }

    entries.push({ loc, lastmod, path });
  }

  // Sort by lastmod descending (entries without lastmod go last)
  entries.sort((a, b) => {
    if (!a.lastmod && !b.lastmod) return 0;
    if (!a.lastmod) return 1;
    if (!b.lastmod) return -1;
    return b.lastmod.localeCompare(a.lastmod);
  });

  return entries.slice(0, limit);
}


/**
 * Research stage: searches SERP, scrapes competitors and data sources,
 * then uses Kimi K2.5 to synthesize a structured ContentBrief.
 */
export async function executeResearch(
  jobId: string,
  keyword: string,
  siteConfig: SiteConfig,
): Promise<ContentBrief> {
  console.log(`[${jobId}] Research stage started for keyword: "${keyword}"`);

  // Step 1: SERP for target keyword (top 10)
  const serpResults = await searchSerp(keyword, { numResults: 10 });
  console.log(`[${jobId}] SERP returned ${serpResults.length} results`);

  // Step 2: Scrape top 3 competitor pages
  const competitorUrls = serpResults.slice(0, 3).map((r) => r.url).filter(Boolean);
  const competitorScraped = await Promise.allSettled(
    competitorUrls.map((url) => scrapeUrl(url)),
  );

  const competitorContent = competitorScraped
    .map((result, idx) => {
      const url = competitorUrls[idx];
      if (result.status === "fulfilled") {
        return `### Competitor ${idx + 1}: ${url}\n\n${result.value.slice(0, 6000)}`;
      }
      return `### Competitor ${idx + 1}: ${url}\n\n(scrape failed: ${result.reason})`;
    })
    .join("\n\n---\n\n");

  // Step 3: SERP for "[keyword] statistics"
  const statsSerpResults = await searchSerp(`${keyword} statistics`, {
    numResults: 10,
  });
  console.log(`[${jobId}] Statistics SERP returned ${statsSerpResults.length} results`);

  // Step 4: Scrape 1-2 data source pages (prioritize authoritative domains)
  const authoritativeDomains = [
    "mckinsey.com",
    "deloitte.com",
    "gartner.com",
    "forrester.com",
    "hbr.org",
    "statista.com",
    ".gov",
    ".edu",
  ];

  const dataSourceUrls = statsSerpResults
    .filter((r) =>
      authoritativeDomains.some((domain) => r.url.includes(domain)),
    )
    .slice(0, 2)
    .map((r) => r.url);

  // Fall back to top 2 stats results if no authoritative sources found
  const urlsToScrape =
    dataSourceUrls.length > 0
      ? dataSourceUrls
      : statsSerpResults.slice(0, 2).map((r) => r.url);

  const dataSourceScraped = await Promise.allSettled(
    urlsToScrape.map((url) => scrapeUrl(url)),
  );

  const dataSourceContent = dataSourceScraped
    .map((result, idx) => {
      const url = urlsToScrape[idx];
      if (result.status === "fulfilled") {
        return `### Data Source ${idx + 1}: ${url}\n\n${result.value.slice(0, 4000)}`;
      }
      return `### Data Source ${idx + 1}: ${url}\n\n(scrape failed: ${result.reason})`;
    })
    .join("\n\n---\n\n");

  // Step 5: Build internal site context from sitemaps if available
  let internalContext = "";
  const baseDomain = siteConfig.domains[0] ?? "";
  const sitemapSections: string[] = [];

  const sitemapSources: Array<{ url: string; label: string }> = [];
  if (siteConfig.mainSitemapUrl) {
    sitemapSources.push({ url: siteConfig.mainSitemapUrl, label: "Main Sitemap" });
  }
  if (siteConfig.blogSitemapUrl) {
    sitemapSources.push({ url: siteConfig.blogSitemapUrl, label: "Blog Sitemap" });
  }

  for (const { url, label } of sitemapSources) {
    try {
      const xml = await scrapeUrl(url);
      const entries = parseSitemap(xml, baseDomain);
      if (entries.length === 0) {
        sitemapSections.push(`### ${label}\n\n(no URLs found in sitemap)`);
      } else {
        const lines = entries.map((e) =>
          e.lastmod
            ? `- ${e.path}  (${e.lastmod})`
            : `- ${e.path}`,
        );
        sitemapSections.push(`### ${label}\n\n${lines.join("\n")}`);
      }
    } catch {
      sitemapSections.push(`### ${label}\n\n(sitemap scrape failed)`);
    }
  }

  if (sitemapSections.length > 0) {
    internalContext = `## Internal Site Pages (from sitemaps)\n\n${sitemapSections.join("\n\n")}`;
  }

  // Step 6: Compile context and call OpenRouter
  const systemPrompt = getResearcherPrompt(siteConfig.companyName);

  const userPrompt = `## Target Keyword
"${keyword}"

## Site: ${siteConfig.companyName}
Domain: ${siteConfig.domains[0] ?? "unknown"}
Industries: ${siteConfig.industries.join(", ")}

## SERP Results (top 10 organic)
${serpResults
  .map(
    (r) =>
      `${r.position}. [${r.title}](${r.url})\n   ${r.description}`,
  )
  .join("\n")}

## Competitor Full Content (top 3 scraped)
${competitorContent}

## Statistics SERP Results
${statsSerpResults
  .map(
    (r) =>
      `${r.position}. [${r.title}](${r.url})\n   ${r.description}`,
  )
  .join("\n")}

## External Data Sources (scraped)
${dataSourceContent}

${internalContext}

## Product Pages (potential internal links)
${siteConfig.productPages
  .map((p) => `- [${p.title}](${p.url}): ${p.description}`)
  .join("\n")}

Now produce the ContentBrief JSON.`;

  console.log(`[${jobId}] Calling OpenRouter (${RESEARCH_MODEL}) for research synthesis`);
  const rawResponse = await complete(systemPrompt, userPrompt, {
    model: RESEARCH_MODEL,
    maxTokens: 16384,
    temperature: 0.3,
  });

  // Step 7: Parse as ContentBrief
  const parsed = parseJsonResponse(rawResponse);
  const brief = ContentBriefSchema.parse(parsed);

  console.log(`[${jobId}] Research stage complete. Title: "${brief.recommendedTitle}"`);
  return brief;
}
