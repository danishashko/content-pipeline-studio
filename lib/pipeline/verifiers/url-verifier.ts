import type { VerificationEntry } from "@/lib/types";

const URL_TIMEOUT_MS = 10_000;

/**
 * HEAD-requests each URL with a 10-second timeout.
 * Returns a VerificationEntry for each URL indicating verified or failed.
 */
export async function verifyUrls(
  urls: string[],
): Promise<VerificationEntry[]> {
  const results = await Promise.allSettled(
    urls.map((url) => checkUrl(url)),
  );

  return results.map((result, idx) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    return {
      type: "url_check" as const,
      targetUrl: urls[idx],
      status: "failed" as const,
      details: result.reason instanceof Error
        ? result.reason.message
        : String(result.reason),
    };
  });
}

async function checkUrl(url: string): Promise<VerificationEntry> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), URL_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      return {
        type: "url_check",
        targetUrl: url,
        status: "verified",
        details: `HTTP ${res.status}`,
      };
    }

    return {
      type: "url_check",
      targetUrl: url,
      status: "failed",
      details: `HTTP ${res.status} ${res.statusText}`,
    };
  } catch (err) {
    clearTimeout(timeoutId);

    const isTimeout =
      err instanceof Error && err.name === "AbortError";

    return {
      type: "url_check",
      targetUrl: url,
      status: "failed",
      details: isTimeout ? "Timed out after 10s" : String(err),
    };
  }
}
