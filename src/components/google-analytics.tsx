'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GA_MEASUREMENT_ID } from '@/lib/analytics-ga';
import {
  isMarketingMeasurementPath,
  MARKETING_CONSENT_STORAGE_KEY,
  parseMarketingConsent,
  sanitizeMeasurementId,
  type MarketingConsent,
} from '@/lib/analytics/marketing-consent';

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

export function GoogleAnalytics() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<MarketingConsent>('unset');
  const allowedPath = isMarketingMeasurementPath(pathname);
  const gaId = sanitizeMeasurementId(GA_MEASUREMENT_ID);
  const clarityId = sanitizeMeasurementId(process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID);
  const tiktokId = sanitizeMeasurementId(process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID);
  const hasProvider = Boolean(gaId || clarityId || tiktokId);

  useEffect(() => {
    setConsent(parseMarketingConsent(window.localStorage.getItem(MARKETING_CONSENT_STORAGE_KEY)));
  }, []);

  useEffect(() => {
    const granted = allowedPath && consent === 'accepted';
    window.gtag?.('consent', 'update', {
      analytics_storage: granted ? 'granted' : 'denied',
      ad_storage: granted ? 'granted' : 'denied',
      ad_user_data: granted ? 'granted' : 'denied',
      ad_personalization: granted ? 'granted' : 'denied',
    });
    window.clarity?.('consentv2', {
      ad_Storage: granted ? 'granted' : 'denied',
      analytics_Storage: granted ? 'granted' : 'denied',
    });
  }, [allowedPath, consent]);

  useEffect(() => {
    if (allowedPath && consent === 'accepted' && gaId && window.gtag) {
      window.gtag('event', 'page_view', { page_path: pathname });
    }
  }, [allowedPath, consent, gaId, pathname]);

  const scripts = useMemo(() => {
    if (!allowedPath || consent !== 'accepted') return null;
    return (
      <>
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="ak-google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('consent', 'default', {
                  analytics_storage: 'denied', ad_storage: 'denied',
                  ad_user_data: 'denied', ad_personalization: 'denied'
                });
                gtag('consent', 'update', {
                  analytics_storage: 'granted', ad_storage: 'granted',
                  ad_user_data: 'granted', ad_personalization: 'granted'
                });
                gtag('js', new Date());
                gtag('config', ${JSON.stringify(gaId)}, { send_page_view: false });
              `}
            </Script>
          </>
        )}
        {clarityId && (
          <Script id="ak-microsoft-clarity" strategy="lazyOnload">
            {`
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window,document,"clarity","script",${JSON.stringify(clarityId)});
              window.clarity('consentv2', { ad_Storage: 'granted', analytics_Storage: 'granted' });
            `}
          </Script>
        )}
        {tiktokId && (
          <Script id="ak-tiktok-pixel" strategy="lazyOnload">
            {`
              !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
              ttq.methods=['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie'];
              ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
              for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
              ttq.load=function(e){var i='https://analytics.tiktok.com/i18n/pixel/events.js',n=document.createElement('script');
              n.type='text/javascript';n.async=true;n.src=i+'?sdkid='+e+'&lib='+t;var a=document.getElementsByTagName('script')[0];a.parentNode.insertBefore(n,a)};
              ttq.load(${JSON.stringify(tiktokId)});ttq.page();}(window,document,'ttq');
            `}
          </Script>
        )}
      </>
    );
  }, [allowedPath, clarityId, consent, gaId, tiktokId]);

  const chooseConsent = (nextConsent: Exclude<MarketingConsent, 'unset'>) => {
    window.localStorage.setItem(MARKETING_CONSENT_STORAGE_KEY, nextConsent);
    setConsent(nextConsent);
  };

  return (
    <>
      {scripts}
      {allowedPath && hasProvider && consent === 'unset' && (
        <aside className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-4 text-slate-950 shadow-2xl" aria-label="Preferencias de privacidad">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <ShieldCheck className="h-6 w-6 shrink-0 text-emerald-700" />
            <p className="flex-1 text-sm leading-relaxed">
              Usamos medicion para entender que contenidos ayudan a organizar mejor una fiesta. Puedes aceptar o continuar sin medicion.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => chooseConsent('rejected')}>Continuar sin medir</Button>
              <Button size="sm" onClick={() => chooseConsent('accepted')}>Aceptar</Button>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
