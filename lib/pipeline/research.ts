import type { ContentBrief, SiteConfig } from "@/lib/types";
import { ContentBriefSchema } from "@/lib/types";
import { discover, searchSerp, scrapeUrl } from "@/lib/bright-data";
import { complete, resolveModel } from "@/lib/openrouter";
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
  const researchModel = resolveModel("research", siteConfig.modelConfig);
  console.log(`[${jobId}] Research stage started for keyword: "${keyword}" (model: ${researchModel})`);

  // Step 1: Try Discover API first (SERP + content in one call), fall back to legacy SERP
  let serpSection = "";
  let competitorContent = "";
  let statsSection = "";
  let dataSourceContent = "";

  try {
    // Discover for main keyword with content included for top results
    const [mainResults, statsResults] = await Promise.all([
      discover(keyword, {
        intent: `I am researching "${keyword}" for a B2B content article targeting ${siteConfig.industries.join(", ")} industries. Prioritize authoritative guides, industry reports, and data-driven analyses. Exclude thin content, listicles, and vendor promotional pages.`,
        numResults: 10,
        includeContent: true,
      }),
      discover(`${keyword} statistics data`, {
        intent: `I need statistics, data points, and research findings about "${keyword}". Prioritize McKinsey, Deloitte, Gartner, Forrester, government (.gov), and academic (.edu) sources. Exclude news articles and opinion pieces.`,
        numResults: 10,
        includeContent: true,
      }),
    ]);

    console.log(`[${jobId}] Discover returned ${mainResults.length} main + ${statsResults.length} stats results`);

    serpSection = mainResults
      .map((r, idx) => `${idx + 1}. [${r.title}](${r.link}) (relevance: ${r.relevanceScore.toFixed(2)})\n   ${r.description}`)
      .join("\n");

    // Use included content for top 3 competitor pages
    competitorContent = mainResults
      .slice(0, 3)
      .map((r, idx) => {
        const content = r.content ? r.content.slice(0, 6000) : "(no content returned)";
        return `### Competitor ${idx + 1}: ${r.link}\n\n${content}`;
      })
      .join("\n\n---\n\n");

    statsSection = statsResults
      .map((r, idx) => `${idx + 1}. [${r.title}](${r.link}) (relevance: ${r.relevanceScore.toFixed(2)})\n   ${r.description}`)
      .join("\n");

    // Use included content for data sources
    const topDataSources = statsResults.filter((r) => r.content).slice(0, 2);
    dataSourceContent = topDataSources
      .map((r, idx) => `### Data Source ${idx + 1}: ${r.link}\n\n${(r.content ?? "").slice(0, 4000)}`)
      .join("\n\n---\n\n");

  } catch (discoverErr) {
    // Fall back to legacy SERP + scrape
    console.warn(`[${jobId}] Discover API failed, falling back to SERP: ${discoverErr instanceof Error ? discoverErr.message : discoverErr}`);

    const serpResults = await searchSerp(keyword, { numResults: 10 });
    console.log(`[${jobId}] SERP returned ${serpResults.length} results`);

    serpSection = serpResults
      .map((r) => `${r.position}. [${r.title}](${r.url})\n   ${r.description}`)
      .join("\n");

    const competitorUrls = serpResults.slice(0, 3).map((r) => r.url).filter(Boolean);
    const competitorScraped = await Promise.allSettled(
      competitorUrls.map((url) => scrapeUrl(url)),
    );
    competitorContent = competitorScraped
      .map((result, idx) => {
        const url = competitorUrls[idx];
        if (result.status === "fulfilled") {
          return `### Competitor ${idx + 1}: ${url}\n\n${result.value.slice(0, 6000)}`;
        }
        return `### Competitor ${idx + 1}: ${url}\n\n(scrape failed: ${result.reason})`;
      })
      .join("\n\n---\n\n");

    const statsSerpResults = await searchSerp(`${keyword} statistics`, { numResults: 10 });
    console.log(`[${jobId}] Statistics SERP returned ${statsSerpResults.length} results`);

    statsSection = statsSerpResults
      .map((r) => `${r.position}. [${r.title}](${r.url})\n   ${r.description}`)
      .join("\n");

    const authoritativeDomains = ["mckinsey.com", "deloitte.com", "gartner.com", "forrester.com", "hbr.org", "statista.com", ".gov", ".edu"];
    const dataSourceUrls = statsSerpResults
      .filter((r) => authoritativeDomains.some((d) => r.url.includes(d)))
      .slice(0, 2)
      .map((r) => r.url);
    const urlsToScrape = dataSourceUrls.length > 0
      ? dataSourceUrls
      : statsSerpResults.slice(0, 2).map((r) => r.url);
    const dataSourceScraped = await Promise.allSettled(
      urlsToScrape.map((url) => scrapeUrl(url)),
    );
    dataSourceContent = dataSourceScraped
      .map((result, idx) => {
        const url = urlsToScrape[idx];
        if (result.status === "fulfilled") return `### Data Source ${idx + 1}: ${url}\n\n${result.value.slice(0, 4000)}`;
        return `### Data Source ${idx + 1}: ${url}\n\n(scrape failed: ${result.reason})`;
      })
      .join("\n\n---\n\n");
  }

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
${serpSection}

## Competitor Full Content (top 3 scraped)
${competitorContent}

## Statistics SERP Results
${statsSection}

## External Data Sources (scraped)
${dataSourceContent}

${internalContext}

## Product Pages (potential internal links)
${siteConfig.productPages
  .map((p) => `- [${p.title}](${p.url}): ${p.description}`)
  .join("\n")}

Now produce the ContentBrief JSON.`;

  console.log(`[${jobId}] Calling OpenRouter (${researchModel}) for research synthesis`);
  const rawResponse = await complete(systemPrompt, userPrompt, {
    model: researchModel,
    maxTokens: 16384,
    temperature: 0.3,
  });

  // Step 7: Parse as ContentBrief
  const parsed = parseJsonResponse(rawResponse);
  const brief = ContentBriefSchema.parse(parsed);

  console.log(`[${jobId}] Research stage complete. Title: "${brief.recommendedTitle}"`);
  return brief;
}
