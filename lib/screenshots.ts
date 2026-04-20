/**
 * Vendor screenshot capture for listicle articles.
 * Primary: ScreenshotOne API (paid, reliable)
 * Fallback: Bright Data Web Unlocker screenshot via headless rendering
 */

const SCREENSHOTONE_KEY = () => process.env.SCREENSHOTONE_API_KEY ?? "";
const BRIGHT_DATA_KEY = () => process.env.BRIGHT_DATA_API_KEY ?? "";
const BRIGHT_DATA_UNLOCKER_ZONE = () =>
  process.env.BRIGHT_DATA_UNLOCKER_ZONE ?? "web_unlocker1";

export interface VendorScreenshot {
  vendorName: string;
  vendorUrl: string;
  imageBase64: string;
  mimeType: string;
}

/**
 * Capture a screenshot of a URL using ScreenshotOne API.
 * Returns base64-encoded PNG.
 */
async function screenshotOne(url: string): Promise<string> {
  const params = new URLSearchParams({
    access_key: SCREENSHOTONE_KEY(),
    url,
    viewport_width: "1280",
    viewport_height: "800",
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
 * Capture a screenshot via Bright Data Web Unlocker with screenshot format.
 * This is a free fallback using the existing Bright Data API key.
 */
async function brightDataScreenshot(url: string): Promise<string> {
  const res = await fetch("https://api.brightdata.com/request", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${BRIGHT_DATA_KEY()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      zone: BRIGHT_DATA_UNLOCKER_ZONE(),
      url,
      format: "png",
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Bright Data screenshot error (${res.status}): ${await res.text()}`,
    );
  }

  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

/**
 * Take a screenshot of a vendor URL.
 * Tries ScreenshotOne first (if API key set), falls back to Bright Data.
 */
export async function captureScreenshot(url: string): Promise<string> {
  // Primary: ScreenshotOne
  if (SCREENSHOTONE_KEY()) {
    try {
      return await screenshotOne(url);
    } catch (err) {
      console.warn(
        `[Screenshot] ScreenshotOne failed for ${url}: ${err instanceof Error ? err.message : err}. Trying Bright Data fallback.`,
      );
    }
  }

  // Fallback: Bright Data Web Unlocker
  if (BRIGHT_DATA_KEY()) {
    return await brightDataScreenshot(url);
  }

  throw new Error(
    "[Screenshot] No screenshot provider available. Set SCREENSHOTONE_API_KEY or BRIGHT_DATA_API_KEY.",
  );
}

/**
 * Extract vendor homepage URLs from article markdown.
 * Looks for H3 sections with vendor names linked to their homepages.
 * Pattern: ### N. [VendorName](https://vendor.com)
 * Also matches: [VendorName](https://vendor.com) at start of a paragraph in a vendor section.
 */
export function extractVendorUrls(
  markdown: string,
): { name: string; url: string }[] {
  const vendors: { name: string; url: string }[] = [];
  const seen = new Set<string>();

  // Pattern 1: ### with linked vendor name
  const h3Pattern =
    /###\s*(?:\d+\.\s*)?\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let match;
  while ((match = h3Pattern.exec(markdown)) !== null) {
    const url = match[2];
    if (!seen.has(url)) {
      seen.add(url);
      vendors.push({ name: match[1], url });
    }
  }

  // Pattern 2: [VendorName](https://vendor.com) as first link in a paragraph after H3
  if (vendors.length === 0) {
    const linkPattern =
      /\[([A-Z][^\]]{1,40})\]\((https?:\/\/(?!brightdata\.com)[^)]+)\)/g;
    while ((match = linkPattern.exec(markdown)) !== null) {
      const url = match[2];
      // Only include if it looks like a homepage (short path)
      try {
        const parsed = new URL(url);
        if (parsed.pathname.length <= 2 && !seen.has(url)) {
          seen.add(url);
          vendors.push({ name: match[1], url });
        }
      } catch {
        // skip invalid URLs
      }
    }
  }

  return vendors;
}

/**
 * Capture screenshots for all vendor URLs found in article markdown.
 * Returns array of vendor screenshots (skips failures).
 */
export async function captureVendorScreenshots(
  markdown: string,
  jobId: string,
): Promise<VendorScreenshot[]> {
  const vendors = extractVendorUrls(markdown);

  if (vendors.length === 0) {
    console.log(`[${jobId}] No vendor URLs found for screenshots`);
    return [];
  }

  console.log(
    `[${jobId}] Capturing screenshots for ${vendors.length} vendors: ${vendors.map((v) => v.name).join(", ")}`,
  );

  const results: VendorScreenshot[] = [];

  // Capture sequentially to avoid rate limits
  for (const vendor of vendors) {
    try {
      const imageBase64 = await captureScreenshot(vendor.url);
      results.push({
        vendorName: vendor.name,
        vendorUrl: vendor.url,
        imageBase64,
        mimeType: "image/png",
      });
      console.log(
        `[${jobId}] Screenshot captured for ${vendor.name} (${vendor.url})`,
      );
    } catch (err) {
      console.warn(
        `[${jobId}] Screenshot failed for ${vendor.name} (${vendor.url}): ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  return results;
}
