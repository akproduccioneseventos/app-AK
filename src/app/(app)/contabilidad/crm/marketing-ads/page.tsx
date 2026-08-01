import type { Metadata } from 'next';
import { DollarSign, TrendingUp, Users, Target, Sparkles, Megaphone, ShieldCheck } from 'lucide-react';
import { getMetaAdsSummary, generateMetaCommercialAIRecommendations } from '@/lib/marketing/meta-ads';
import { loadMetaCommercialMetrics } from '@/lib/marketing/meta-commercial-metrics';

export const metadata: Metadata = {
  title: 'Meta Ads & Inteligencia Comercial | CRM AK Producciones',
  description: 'Rendimiento de campañas publicitarias en Meta Ads, ROI real y recomendaciones de la IA comercial.',
};

export default async function MarketingAdsPage() {
  const summary = await getMetaAdsSummary(await loadMetaCommercialMetrics());
  const recommendations = generateMetaCommercialAIRecommendations(summary);

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
              <Megaphone className="h-3.5 w-3.5" /> Meta Ads Intelligence
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-zinc-950 sm:text-3xl">
            Rendimiento Publicitario & ROI Real
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Análisis de inversión en Facebook/Instagram Ads cruzado con los contratos confirmados en el CRM.
          </p>
        </div>
      </div>

      {/* Tarjetas de Métricas Clave */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Inversión en Ads</span>
            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-700">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-black text-zinc-950">{summary.adCurrency} {summary.totalSpend.toLocaleString()}</p>
          <p className="mt-1 text-xs font-medium text-zinc-500">{summary.reportedCampaignsCount} campañas con datos en 30 días</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Leads Generados</span>
            <div className="rounded-lg bg-purple-50 p-2.5 text-purple-700">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-black text-zinc-950">{summary.totalLeads}</p>
          <p className="mt-1 text-xs font-medium text-emerald-600">Costo prom.: {summary.adCurrency} {summary.averageCpl.toFixed(2)} / lead atribuido</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Ingresos por Contratos</span>
            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-700">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-black text-emerald-700">{summary.revenueCurrency} {summary.totalRevenue.toLocaleString()}</p>
          <p className="mt-1 text-xs font-medium text-emerald-600">{summary.totalConversions} fiestas cerradas</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Retorno ROAS</span>
            <div className="rounded-lg bg-amber-50 p-2.5 text-amber-700">
              <Target className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-black text-amber-600">{summary.overallRoas === null ? 'No comparable' : `${summary.overallRoas.toFixed(2)}x`}</p>
          <p className="mt-1 text-xs font-medium text-zinc-500">{summary.currencyComparable ? 'Retorno por unidad monetaria invertida' : 'La inversión y los contratos usan monedas distintas'}</p>
        </div>
      </div>

      {/* Recomendaciones de la IA Comercial */}
      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-950 to-zinc-900 p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 border-b border-red-800/60 pb-4">
          <div className="rounded-lg bg-red-800/40 p-2 text-red-400 border border-red-700">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white">Recomendaciones de la IA Comercial</h2>
            <p className="text-xs text-red-200">Asesoramiento inteligente para maximizar ventas y reducir costo por cliente</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.map((rec) => (
            <div key={rec.id} className="rounded-xl border border-red-900/60 bg-red-950/40 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-900/60 px-2 py-0.5 rounded">
                  {rec.impactLevel === 'alto' ? 'Prioridad alta' : rec.impactLevel === 'medio' ? 'Recomendado' : 'Sugerencia'}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-white">{rec.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-300">{rec.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla de Campañas Activas */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <h2 className="text-lg font-bold text-zinc-950">Campañas Publicitarias Activas</h2>
          <span className="text-xs font-semibold text-zinc-500">
            {summary.connectionStatus === 'connected' ? 'Datos reales de Meta y CRM · últimos 30 días' : summary.connectionMessage}
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-700 border-b border-zinc-200">
              <tr>
                <th className="px-4 py-3">Campaña</th>
                <th className="px-4 py-3">Inversión</th>
                <th className="px-4 py-3">Clics</th>
                <th className="px-4 py-3">CTR</th>
                <th className="px-4 py-3">Costo / Lead</th>
                <th className="px-4 py-3">Contratos</th>
                <th className="px-4 py-3">Ingresos</th>
                <th className="px-4 py-3 text-right">ROAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {summary.campaigns.map((camp) => (
                <tr key={camp.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="px-4 py-4 font-bold text-zinc-950 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"></span>
                    {camp.name}
                  </td>
                  <td className="px-4 py-4 font-medium text-zinc-900">{summary.adCurrency} {camp.spend.toFixed(2)}</td>
                  <td className="px-4 py-4">{camp.clicks.toLocaleString()}</td>
                  <td className="px-4 py-4 font-semibold text-zinc-700">{camp.ctrPct}%</td>
                  <td className="px-4 py-4 font-semibold text-purple-700">{camp.leadsCount > 0 ? `${summary.adCurrency} ${camp.cpl.toFixed(2)}` : 'Sin leads atribuidos'}</td>
                  <td className="px-4 py-4 font-bold text-emerald-700">{camp.conversionsCount}</td>
                  <td className="px-4 py-4 font-bold text-zinc-950">{summary.revenueCurrency} {camp.revenue.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right font-black text-amber-600">{camp.roasRatio === null ? '—' : `${camp.roasRatio.toFixed(2)}x`}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {summary.campaigns.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500">No hay campañas de Meta disponibles para este período.</p>
          )}
        </div>
      </div>

      {/* Conexión para otras IAs */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-zinc-900 p-2.5 text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-950">Conexión Segura para Tus Otras IAs (Claude / n8n / GPTs)</h3>
            <p className="mt-1 text-xs text-zinc-600 leading-relaxed">
              Podés usar la URL de API de tu aplicación para que tus otros agentes de inteligencia artificial lean estas métricas y te ayuden a redactar posteos, imágenes y videos para redes sociales.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <code className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-mono text-emerald-400 overflow-x-auto block">
                GET /api/v1/marketing/insights
              </code>
              <p className="text-[11px] text-zinc-500">
                Autenticación: enviá el header <code className="bg-zinc-200 px-1 rounded text-zinc-700">x-api-key</code> con el valor de la variable de entorno <code className="bg-zinc-200 px-1 rounded text-zinc-700">MARKETING_API_SECRET_KEY</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
