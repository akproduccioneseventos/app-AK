export const GOOGLE_SEARCH_CONSOLE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || 'google-site-verification-ak-producciones-2026';

/**
 * Pings Google Search Console to re-index the sitemap after publishing new blog posts or landing pages.
 */
export async function pingGoogleSitemap(siteUrl = 'https://akproducciones.uy'): Promise<boolean> {
  try {
    const sitemapUrl = `${siteUrl}/sitemap.xml`;
    const res = await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);
    return res.ok;
  } catch {
    return false;
  }
}
