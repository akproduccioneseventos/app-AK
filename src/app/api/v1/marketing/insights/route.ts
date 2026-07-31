import { NextResponse } from 'next/server';
import { getMetaAdsSummary, generateMetaCommercialAIRecommendations } from '@/lib/marketing/meta-ads';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get('x-api-key');
  const tokenParam = searchParams.get('token');
  const secretKey = process.env.MARKETING_API_SECRET_KEY || 'ak-marketing-ai-token-2026';

  const isAuthorized = authHeader === secretKey || tokenParam === secretKey || process.env.NODE_ENV === 'development';

  if (!isAuthorized) {
    return NextResponse.json(
      { error: 'No autorizado. Proporcione la clave x-api-key o token de acceso válido.' },
      { status: 401 }
    );
  }

  try {
    const summary = await getMetaAdsSummary();
    const recommendations = generateMetaCommercialAIRecommendations(summary);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      brand: 'AK Producciones Eventos',
      currency: 'USD',
      summary: {
        totalSpendUsd: summary.totalSpendUsd,
        totalLeads: summary.totalLeads,
        totalConversions: summary.totalConversions,
        totalRevenueUsd: summary.totalRevenueUsd,
        averageCplUsd: summary.averageCplUsd,
        overallRoas: summary.overallRoas,
        activeCampaignsCount: summary.activeCampaignsCount,
      },
      campaigns: summary.campaigns,
      aiRecommendations: recommendations,
      insightsForExternalAI: {
        bestPerformingChannel: 'Meta Ads (Instagram / Facebook)',
        topEventType: 'Fiestas de 15 años',
        suggestedAdCopyHook: 'Celebrá tus 15 con el Espejo Mágico IA y la Barra de Tragos sin Alcohol de AK Producciones.',
        targetAudienceFocus: 'Madres de jóvenes entre 14 y 15 años en Salto y región Norte de Uruguay.',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error interno al consultar métricas de marketing.' },
      { status: 500 }
    );
  }
}
