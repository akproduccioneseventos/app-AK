import { NextResponse } from 'next/server';
import { getMetaAdsSummary, generateMetaCommercialAIRecommendations } from '@/lib/marketing/meta-ads';
import { loadMetaCommercialMetrics } from '@/lib/marketing/meta-commercial-metrics';

export async function GET(request: Request) {
  const authHeader = request.headers.get('x-api-key');
  const secretKey = process.env.MARKETING_API_SECRET_KEY;

  if (!secretKey) {
    return NextResponse.json(
      { error: 'API de marketing no configurada. Definí MARKETING_API_SECRET_KEY en las variables de entorno.' },
      { status: 503 }
    );
  }

  const isAuthorized = authHeader === secretKey;

  if (!isAuthorized) {
    return NextResponse.json(
      { error: 'No autorizado. Proporcione una clave x-api-key válida.' },
      { status: 401 }
    );
  }

  try {
    const summary = await getMetaAdsSummary(await loadMetaCommercialMetrics());
    const recommendations = generateMetaCommercialAIRecommendations(summary);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      brand: 'AK Producciones Eventos',
      adCurrency: summary.adCurrency,
      revenueCurrency: summary.revenueCurrency,
      summary: {
        connectionStatus: summary.connectionStatus,
        totalSpend: summary.totalSpend,
        totalLeads: summary.totalLeads,
        totalConversions: summary.totalConversions,
        totalRevenue: summary.totalRevenue,
        averageCpl: summary.averageCpl,
        overallRoas: summary.overallRoas,
        reportedCampaignsCount: summary.reportedCampaignsCount,
      },
      campaigns: summary.campaigns,
      aiRecommendations: recommendations,
      insightsForExternalAI: {
        bestPerformingCampaign: summary.campaigns
          .filter((campaign) => campaign.roasRatio !== null)
          .sort((a, b) => (b.roasRatio || 0) - (a.roasRatio || 0))[0]?.name || null,
        topEventType: summary.topEventType || null,
        dataWindow: 'last_30d',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error interno al consultar métricas de marketing.' },
      { status: 500 }
    );
  }
}
