export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || '';

declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'consent' | 'event' | 'js',
      targetId: string,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}

/** Tracks custom marketing events when public measurement has been accepted. */
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
