/**
 * Google Search Console â€” site verification and indexing utilities.
 *
 * NOTE: The old Google Ping endpoint (google.com/ping?sitemap=) was deprecated
 * and removed in late 2023. Modern indexing uses the Google Indexing API
 * or submitting sitemaps via Search Console UI / API.
 *
 * This module provides the verification tag for layout.tsx metadata and
 * a placeholder for future Indexing API integration.
 */

export const GOOGLE_SEARCH_CONSOLE_VERIFICATION =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '';

/**
 * Returns the Search Console verification metadata for use in layout.tsx.
 * Only returns the tag if the env var is configured.
 */
export function getSearchConsoleVerification(): { google?: string } | undefined {
  if (!GOOGLE_SEARCH_CONSOLE_VERIFICATION) return undefined;
  return { google: GOOGLE_SEARCH_CONSOLE_VERIFICATION };
}
