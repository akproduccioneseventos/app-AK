export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-AKPRODUCCIONES2026';

declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js',
      targetId: string,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}

/**
 * Tracks custom marketing events in Google Analytics (GA4).
 */
export function trackGaEvent(
  action: string,
  params: {
    category?: string;
    label?: string;
    value?: number;
    [key: string]: any;
  } = {}
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: params.category || 'marketing',
      event_label: params.label,
      value: params.value,
      ...params,
    });
  }
}
