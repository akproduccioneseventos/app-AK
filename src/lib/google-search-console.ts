/**
 * Google Search Console — site verification and indexing utilities.
 */

export const GOOGLE_SEARCH_CONSOLE_VERIFICATION =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || process.env.GOOGLE_SITE_VERIFICATION || '';

/**
 * Returns the Search Console verification metadata for use in layout.tsx.
 * Only returns the tag if the env var or configuration is set.
 */
export function getSearchConsoleVerification(): { google?: string } | undefined {
  if (!GOOGLE_SEARCH_CONSOLE_VERIFICATION) return undefined;
  return { google: GOOGLE_SEARCH_CONSOLE_VERIFICATION };
}
