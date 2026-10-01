'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { GA_MEASUREMENT_ID } from '@/lib/analytics-ga';
import { sePuedeMedir, direccionParaMedir } from '@/lib/medicion-segura';

/**
 * Google Analytics GA4 component with SPA pageview tracking.
 * Only renders when NEXT_PUBLIC_GA_MEASUREMENT_ID is configured.
 *
 * NOTE: We intentionally avoid useSearchParams() here because this
 * component is rendered in the root layout. useSearchParams forces
 * a client-side rendering bailout which breaks static generation
 * of /_not-found (404 page) during the Next.js build.
 * We read query params from window.location.search inside useEffect instead.
 *
 * SEGURIDAD: sólo mandamos pageviews de pantallas públicas (allowlist).
 * La URL se limpia con `direccionParaMedir` para descartar tokens,
 * llaves de acceso y cualquier parámetro que no sea de marketing.
 */
export function GoogleAnalytics() {
  const gaId = GA_MEASUREMENT_ID;
  const pathname = usePathname();

  useEffect(() => {
    if (!gaId || typeof window === 'undefined' || !window.gtag) return;
    if (!sePuedeMedir(pathname)) return;
    const limpia = direccionParaMedir(pathname, window.location.search);
    const location = window.location.origin + limpia;
    let referrer: string | undefined = typeof document !== 'undefined' ? document.referrer : undefined;
    if (referrer && referrer.includes('akproducciones.uy')) {
      try {
        const refUrl = new URL(referrer);
        referrer = refUrl.origin + direccionParaMedir(refUrl.pathname, refUrl.search);
      } catch {}
    }
    window.gtag('config', gaId, {
      page_path: limpia,
      page_location: location,
      page_referrer: referrer || undefined,
    });
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
          gtag('config', '${gaId}', {
            send_page_view: false,
            page_location: window.location.origin
          });
        `}
      </Script>
    </>
  );
}
