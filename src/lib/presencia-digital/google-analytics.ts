/**
 * Integración de Google Analytics 4 para el Centro de Presencia Digital.
 *
 * REGLAS DE SEGURIDAD Y HONESTIDAD:
 * 1. Las credenciales NO se guardan en el repositorio; se leen de variables de entorno del servidor.
 * 2. Cero números inventados: si no hay credenciales configuradas, se devuelve `hasCredentials: false`
 *    y la pantalla explica exactamente qué variables faltan sin mostrar estadísticas falsas.
 * 3. Nombres de páginas traducidos al criollo ("Quinceañeras", "Simulador de presupuesto", etc.).
 */

export interface GoogleAnalyticsTrafficSource {
  source: 'Google Orgánico' | 'Instagram' | 'Facebook' | 'Directo' | 'Campañas / Otros';
  visitors: number;
  percentage: number;
}

export interface GoogleAnalyticsTopPage {
  path: string;
  label: string;
  views: number;
}

export interface GoogleAnalyticsSimulatorFunnel {
  started: number;
  completed: number;
  completionRatePct: number;
}

export interface GoogleAnalyticsDashboardData {
  hasCredentials: boolean;
  missingCredentialsNote?: string;
  periodoDias: number; // 7, 30, 90
  totalVisitors: number | null;
  visitorsChangePct: number | null;
  sources: GoogleAnalyticsTrafficSource[];
  topPages: GoogleAnalyticsTopPage[];
  simulatorFunnel: GoogleAnalyticsSimulatorFunnel;
  updatedAt: string;
}

/**
 * Traduce rutas técnicas a nombres en criollo comprensibles para el dueño.
 */
export function etiquetarRutaEnCriollo(path: string): string {
  const p = path.toLowerCase().trim().replace(/\/$/, '') || '/';

  if (p === '/') return 'Portada / Inicio';
  if (p.includes('quinceanera') || p.includes('xv-anos') || p.includes('15')) return '15 Años y Quinceañeras';
  if (p.includes('boda') || p.includes('casamiento')) return 'Bodas y Casamientos';
  if (p.includes('cumpleano') || p.includes('fiesta')) return 'Cumpleaños y Eventos';
  if (p.includes('simulador')) return 'Simulador de Presupuesto';
  if (p.includes('club-uruguay') || p.includes('salon')) return 'Salón Club Uruguay';
  if (p.includes('catalogo')) return 'Catálogo de Servicios';
  if (p.includes('blog')) return 'Blog y Guías';
  if (p.includes('experiencia-ak')) return 'Experiencia AK';

  return path;
}

/**
 * Obtiene las métricas de tráfico web desde GA4 respetando el período solicitado (7, 30 o 90 días).
 */
export async function getGoogleAnalyticsMetrics(
  periodoDias: number = 30
): Promise<GoogleAnalyticsDashboardData> {
  const propertyId = process.env.GA4_PROPERTY_ID || process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
  const clientEmail = process.env.GA4_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GA4_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  // Si no están configuradas las credenciales de entorno en el servidor:
  if (!propertyId || !clientEmail || !privateKey) {
    return {
      hasCredentials: false,
      missingCredentialsNote:
        'Faltan configurar las variables GA4_PROPERTY_ID y credenciales de Google en el servidor para ver el tráfico en vivo.',
      periodoDias,
      totalVisitors: null,
      visitorsChangePct: null,
      sources: [],
      topPages: [],
      simulatorFunnel: {
        started: 0,
        completed: 0,
        completionRatePct: 0,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  // Intento de conexión con la API REST oficial de Google Analytics Data v1beta
  try {
    const { google } = await import('googleapis');
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });

    const analyticsdata = google.analyticsdata({
      version: 'v1beta',
      auth,
    });

    const response = await analyticsdata.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [
          {
            startDate: `${periodoDias}daysAgo`,
            endDate: 'today',
          },
        ],
        metrics: [
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
        ],
        dimensions: [
          { name: 'sessionSource' },
          { name: 'pagePath' },
        ],
      },
    });

    let totalUsers = 0;
    const pageMap = new Map<string, number>();
    const sourceMap = new Map<string, number>();
    let simulatorStarted = 0;
    let simulatorCompleted = 0;

    const rows = response.data.rows || [];

    rows.forEach((row: any) => {
      const source = row.dimensionValues?.[0]?.value || 'Directo';
      const pagePath = row.dimensionValues?.[1]?.value || '/';
      const users = parseInt(row.metricValues?.[0]?.value || '0', 10);
      const views = parseInt(row.metricValues?.[1]?.value || '0', 10);

      totalUsers += users;

      // Fuentes
      let fuenteNormalizada: GoogleAnalyticsTrafficSource['source'] = 'Campañas / Otros';
      const srcLow = source.toLowerCase();
      if (srcLow.includes('google') || srcLow.includes('organic')) fuenteNormalizada = 'Google Orgánico';
      else if (srcLow.includes('instagram')) fuenteNormalizada = 'Instagram';
      else if (srcLow.includes('facebook')) fuenteNormalizada = 'Facebook';
      else if (srcLow === '(direct)' || srcLow === 'direct') fuenteNormalizada = 'Directo';

      sourceMap.set(fuenteNormalizada, (sourceMap.get(fuenteNormalizada) || 0) + users);

      // Páginas
      const labelCriollo = etiquetarRutaEnCriollo(pagePath);
      pageMap.set(labelCriollo, (pageMap.get(labelCriollo) || 0) + views);

      // Embudo simulador
      if (pagePath.includes('simulador')) {
        simulatorStarted += views;
        if (pagePath.includes('resultado') || pagePath.includes('enviado') || pagePath.includes('resumen')) {
          simulatorCompleted += views;
        }
      }
    });

    const sources: GoogleAnalyticsTrafficSource[] = Array.from(sourceMap.entries()).map(
      ([src, count]) => ({
        source: src as any,
        visitors: count,
        percentage: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0,
      })
    );

    const topPages: GoogleAnalyticsTopPage[] = Array.from(pageMap.entries())
      .map(([label, views]) => ({ path: label, label, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 6);

    const completionRate = simulatorStarted > 0
      ? Math.round((simulatorCompleted / simulatorStarted) * 100)
      : 0;

    return {
      hasCredentials: true,
      periodoDias,
      totalVisitors: totalUsers,
      visitorsChangePct: null,
      sources,
      topPages,
      simulatorFunnel: {
        started: simulatorStarted,
        completed: simulatorCompleted,
        completionRatePct: completionRate,
      },
      updatedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    console.warn('[google-analytics] Error consultando GA4:', err?.message);
    return {
      hasCredentials: true,
      missingCredentialsNote: `Error al consultar Google Analytics: ${err?.message || 'Error de conexión'}.`,
      periodoDias,
      totalVisitors: null,
      visitorsChangePct: null,
      sources: [],
      topPages: [],
      simulatorFunnel: {
        started: 0,
        completed: 0,
        completionRatePct: 0,
      },
      updatedAt: new Date().toISOString(),
    };
  }
}
