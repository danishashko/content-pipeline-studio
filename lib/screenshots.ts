/**
 * Vendor screenshot capture for listicle articles.
 * Primary: ScreenshotOne API (paid, reliable)
 * Fallback: Bright Data Web Unlocker screenshot via headless rendering
 *
 * Vendor URL resolution follows the working pipeline's 4-step strategy:
 * 1. Markdown link anchor text matching
 * 2. Domain probing (www.{vendor}.com, etc.)
 * 3. SERP fallback (not yet implemented)
 */

const SCREENSHOTONE_KEY = () => process.env.SCREENSHOTONE_API_KEY ?? "";

export interface VendorScreenshot {
  vendorName: string;
  vendorUrl: string;
  imageBase64: string;
  mimeType: string;
}

// ---------------------------------------------------------------------------
// Screenshot capture
// ---------------------------------------------------------------------------

async function screenshotOne(url: string): Promise<string> {
  const params = new URLSearchParams({
    access_key: SCREENSHOTONE_KEY(),
    url,
    viewport_width: "1440",
    viewport_height: "900",
    device_scale_factor: "1",
    format: "png",
    block_ads: "true",
    block_cookie_banners: "true",
    block_trackers: "true",
    delay: "3",
    timeout: "30",
  });

  const res = await fetch(
    `https://api.screenshotone.com/take?${params.toString()}`,
  );

  if (!res.ok) {
    throw new Error(`ScreenshotOne error (${res.status}): ${await res.text()}`);
  }

  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

/**
 * Free fallback: use Google's PageSpeed Insights API screenshot.
 * No API key needed. Returns a base64 screenshot of the page.
 */
async function freeScreenshot(url: string): Promise<string> {
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=PERFORMANCE&strategy=DESKTOP&fields=lighthouseResult.audits.final-screenshot`;

  const res = await fetch(apiUrl, {
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new Error(`PageSpeed screenshot error (${res.status})`);
  }

  const data = (await res.json()) as {
    lighthouseResult?: {
      audits?: {
        "final-screenshot"?: {
          details?: { data?: string };
        };
      };
    };
  };

  const dataUri =
    data.lighthouseResult?.audits?.["final-screenshot"]?.details?.data;
  if (!dataUri) {
    throw new Error("No screenshot in PageSpeed response");
  }

  // dataUri is "data:image/jpeg;base64,..."
  const base64 = dataUri.split(",")[1];
  if (!base64) throw new Error("Invalid screenshot data URI");
  return base64;
}

export async function captureScreenshot(url: string): Promise<string> {
  // Primary: ScreenshotOne (paid, best quality)
  if (SCREENSHOTONE_KEY()) {
    try {
      return await screenshotOne(url);
    } catch (err) {
      console.warn(
        `[Screenshot] ScreenshotOne failed for ${url}: ${err instanceof Error ? err.message : err}. Trying free fallback.`,
      );
    }
  }

  // Fallback: Google PageSpeed Insights (free, no API key needed)
  try {
    return await freeScreenshot(url);
  } catch (err) {
    throw new Error(
      `[Screenshot] All providers failed for ${url}: ${err instanceof Error ? err.message : err}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Vendor extraction (matches working pipeline's approach)
// ---------------------------------------------------------------------------

/** Domains to exclude when resolving vendor URLs */
const AGGREGATOR_DOMAINS = new Set([
  "g2.com", "capterra.com", "getapp.com", "trustradius.com",
  "softwareadvice.com", "techradar.com", "pcmag.com", "cnet.com",
  "forbes.com", "gartner.com", "reddit.com", "quora.com",
  "wikipedia.org", "youtube.com", "github.com",
]);

/**
 * Extract vendor names from listicle-style headings.
 * Matches patterns like:
 *   ### 1. Bright Data: Best for...
 *   ### Why Is Bright Data the Top-Ranked...
 *   ### Scrapy
 *   ### How Does Zyte Compare?
 */
function extractVendorNamesFromHeadings(markdown: string): string[] {
  const vendors: string[] = [];
  const seen = new Set<string>();

  // Pattern 1: Numbered vendor headings "### 1. VendorName: ..." or "### 1) VendorName"
  const numberedPattern = /^#{2,3}\s+#?(\d+)[.)]*\s+([^:\n—]{2,40})(?::|—)/gm;
  let match;
  while ((match = numberedPattern.exec(markdown)) !== null) {
    const name = match[2].trim();
    if (!seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase());
      vendors.push(name);
    }
  }

  if (vendors.length >= 3) return vendors;

  // Pattern 2: Extract known tool/company names mentioned in headings
  const knownTools = [
    "Bright Data", "Oxylabs", "Smartproxy", "Zyte", "ScraperAPI",
    "Apify", "Crawlbase", "Scrapy", "Playwright", "Puppeteer",
    "Crawlee", "Beautiful Soup", "Selenium", "Octoparse",
    "ParseHub", "Diffbot", "Firecrawl", "PhantomBuster",
    "Import.io", "Mozenda", "Scrapfly", "ScrapingBee",
    "WebScraper.io", "Nimble", "Infatica",
  ];

  const headings = [...markdown.matchAll(/^#{2,3}\s+(.+)/gm)].map(m => m[1]);
  for (const tool of knownTools) {
    if (seen.has(tool.toLowerCase())) continue;
    const mentioned = headings.some(h =>
      h.toLowerCase().includes(tool.toLowerCase()),
    );
    if (mentioned) {
      seen.add(tool.toLowerCase());
      vendors.push(tool);
    }
  }

  return vendors;
}

/**
 * Resolve a vendor name to its homepage URL.
 * Step 1: Look for markdown links with the vendor name as anchor text
 * Step 2: Probe common domain patterns
 */
async function resolveVendorUrl(
  vendorName: string,
  markdown: string,
): Promise<string | null> {
  // Step 1: Find markdown link with vendor name
  const escapedName = vendorName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const linkPattern = new RegExp(
    `\\[${escapedName}[^\\]]*\\]\\((https?://[^)]+)\\)`,
    "i",
  );
  const linkMatch = markdown.match(linkPattern);
  if (linkMatch) {
    try {
      const parsed = new URL(linkMatch[1]);
      const domain = parsed.hostname.replace(/^www\./, "");
      if (!AGGREGATOR_DOMAINS.has(domain)) {
        return linkMatch[1];
      }
    } catch { /* skip invalid */ }
  }

  // Step 2: Probe common domain patterns
  const slug = vendorName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const candidates = [
    `https://www.${slug}.com`,
    `https://${slug}.com`,
    `https://www.${slug}.io`,
    `https://${slug}.io`,
    `https://${slug}.org`,
    `https://${slug}.dev`,
    `https://www.get${slug}.com`,
    `https://www.${slug}api.com`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) return url;
    } catch {
      // skip unreachable
    }
  }

  return null;
}

/**
 * Extract vendor URLs from article markdown using multi-step resolution.
 */
export async function extractVendorUrls(
  markdown: string,
  jobId: string,
): Promise<{ name: string; url: string }[]> {
  const vendorNames = extractVendorNamesFromHeadings(markdown);

  if (vendorNames.length < 3) {
    console.log(`[${jobId}] Not a listicle (only ${vendorNames.length} vendors detected). Skipping screenshots.`);
    return [];
  }

  console.log(
    `[${jobId}] Detected ${vendorNames.length} vendors: ${vendorNames.join(", ")}`,
  );

  // Skip our own company
  const externalVendors = vendorNames.filter(
    (v) => !v.toLowerCase().includes("bright data"),
  );

  const resolved: { name: string; url: string }[] = [];
  for (const name of externalVendors) {
    const url = await resolveVendorUrl(name, markdown);
    if (url) {
      resolved.push({ name, url });
      console.log(`[${jobId}] Resolved ${name} -> ${url}`);
    } else {
      console.log(`[${jobId}] Could not resolve URL for ${name}`);
    }
  }

  return resolved;
}

/**
 * Capture screenshots for all vendor URLs found in article markdown.
 * Returns array of vendor screenshots (skips failures).
 */
export async function captureVendorScreenshots(
  markdown: string,
  jobId: string,
): Promise<VendorScreenshot[]> {
  const vendors = await extractVendorUrls(markdown, jobId);

  if (vendors.length === 0) {
    return [];
  }

  console.log(
    `[${jobId}] Capturing screenshots for ${vendors.length} vendors`,
  );

  const results: VendorScreenshot[] = [];

  for (const vendor of vendors) {
    try {
      const imageBase64 = await captureScreenshot(vendor.url);
      results.push({
        vendorName: vendor.name,
        vendorUrl: vendor.url,
        imageBase64,
        mimeType: "image/png",
      });
      console.log(`[${jobId}] Screenshot captured for ${vendor.name}`);
    } catch (err) {
      console.warn(
        `[${jobId}] Screenshot failed for ${vendor.name}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  return results;
}
