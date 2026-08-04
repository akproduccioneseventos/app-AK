'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { GA_MEASUREMENT_ID } from '@/lib/analytics-ga';

/**
 * Google Analytics GA4 component with SPA pageview tracking.
 * Only renders when NEXT_PUBLIC_GA_MEASUREMENT_ID is configured.
 *
 * NOTE: We intentionally avoid useSearchParams() here because this
 * component is rendered in the root layout. useSearchParams forces
 * a client-side rendering bailout which breaks static generation
 * of /_not-found (404 page) during the Next.js build.
 * We read query params from window.location.search inside useEffect instead.
 */
export function GoogleAnalytics() {
  const gaId = GA_MEASUREMENT_ID;
  const pathname = usePathname();

  useEffect(() => {
    if (!gaId || typeof window === 'undefined' || !window.gtag) return;
    const url = pathname + window.location.search;
    window.gtag('config', gaId, { page_path: url });
  }, [gaId, pathname]);

  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', { send_page_view: false });
        `}
      </Script>
    </>
  );
}
