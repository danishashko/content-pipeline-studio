/**
 * Shared utility functions for Content Pipeline Studio.
 */

/**
 * Convert arbitrary text into a URL-safe slug.
 * Lowercases, strips non-alphanumeric characters, collapses hyphens.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9\s-]/g, "")   // keep alphanumeric, spaces, hyphens
    .trim()
    .replace(/[\s]+/g, "-")          // spaces -> hyphens
    .replace(/-{2,}/g, "-");         // collapse consecutive hyphens
}

/**
 * Merge class names, filtering out falsy values.
 * Lightweight alternative to clsx — no external dependency required.
 */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Format a date string or Date object into a human-readable string.
 * Example: "April 12, 2026"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Truncate text to at most maxLength characters, appending "..." if cut.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3).trimEnd() + "...";
}

/**
 * Count the number of words in a string.
 * Splits on whitespace and filters empty tokens.
 */
export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}
