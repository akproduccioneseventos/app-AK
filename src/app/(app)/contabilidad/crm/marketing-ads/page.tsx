import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  Users,
  Target,
  Sparkles,
  Megaphone,
  HelpCircle,
  ArrowRight,
  Eye,
  MousePointerClick,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Wand2,
} from 'lucide-react';
import { getMetaAdsSummary, generateMetaCommercialAIRecommendations } from '@/lib/marketing/meta-ads';
import { loadMetaCommercialMetrics } from '@/lib/marketing/meta-commercial-metrics';

export const metadata: Metadata = {
  title: 'Cerebro de Publicidad & Meta Ads | AK Producciones',
  description: 'Dónde poner la plata en publicidad: inversión, consultas reales y retorno en contratos.',
};

export default async function MarketingAdsPage() {
  const summary = await getMetaAdsSummary(await loadMetaCommercialMetrics());
  const recommendations = generateMetaCommercialAIRecommendations(summary);

  const isConnected = summary.connectionStatus === 'connected';

  // Cálculos del embudo
  const totalImpresiones = summary.campaigns.reduce((acc, c) => acc + c.impressions, 0);
  const totalClics = summary.campaigns.reduce((acc, c) => acc + c.clicks, 0);
  const totalConsultas = summary.totalLeads;
  const totalContratos = summary.totalConversions;
  const totalFacturado = summary.totalRevenue;

  // Acciones concretas para "Qué hago mañana"
  const accionesManana: Array<{ tipo: 'frenar' | 'escalar' | 'optimizar' | 'aviso'; texto: string }> = [];

  if (isConnected && summary.campaigns.length > 0) {
    for (const c of summary.campaigns) {
      if (c.spend > 1200 && c.leadsCount === 0) {
        accionesManana.push({
          tipo: 'frenar',
          texto: `El anuncio "${c.name}" te viene costando ${summary.adCurrency} ${c.spend.toFixed(0)} y no trajo ninguna consulta: apagalo o cambiale el texto.`,
        });
      } else if (c.leadsCount >= 2 && c.conversionsCount >= 1) {
        accionesManana.push({
          tipo: 'escalar',
          texto: `El anuncio "${c.name}" trae consultas a ${summary.adCurrency} ${c.cpl.toFixed(0)} y ya cerró ${c.conversionsCount} fiestas: subile el presupuesto para traer más.`,
        });
      } else if (c.ctrPct < 0.8 && c.impressions > 500) {
        accionesManana.push({
          tipo: 'optimizar',
          texto: `En "${c.name}" de cada 100 personas menos de 1 hace clic (${c.ctrPct}%): cambiá la foto principal por una de pista llena o show en vivo.`,
        });
      }
    }

    if (accionesManana.length === 0) {
      accionesManana.push({
        tipo: 'aviso',
        texto: 'Tus campañas vienen con números equilibrados. Monitoreá las consultas que entren esta semana antes de hacer cambios grandes.',
      });
    }
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              <Megaphone className="h-3.5 w-3.5" /> Cerebro de Publicidad
            </span>
            <span className="text-xs text-zinc-500 font-medium">Meta Ads + CRM AK</span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-zinc-950 sm:text-3xl">
            Dónde Poner la Plata de Publicidad
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Cruza lo que gastás en Facebook e Instagram con las fiestas de verdad que se contratan en Salto.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/empresa/creador-anuncios"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-purple-700 transition"
          >
            <Wand2 className="h-4 w-4" />
            Crear Anuncio con IA
          </Link>
        </div>
      </div>

      {/* Si no está conectado Meta */}
      {!isConnected && (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-amber-950 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-amber-200 p-3 text-amber-900 shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold">Tu cuenta de Meta Ads no está conectada todavía</h3>
              <p className="text-sm text-amber-800 leading-relaxed max-w-3xl">
                Para que la app pueda leer tus gastos reales, calcular cuánto te cuesta cada consulta y decirte qué anuncio apagar o prender, necesitás conectar el token de acceso en los ajustes del sistema.
              </p>
              <div className="pt-2">
                <Link
                  href="/settings/social-connections"
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-900 px-4 py-2 text-xs font-bold text-white hover:bg-amber-800 transition"
                >
                  Conectar cuenta de Meta en Ajustes
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LAS 4 PREGUNTAS EN CRIOLLO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Cuánto gasté */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-500">1. ¿Cuánto gasté?</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-zinc-950">
              {summary.adCurrency} {Math.round(summary.totalSpend).toLocaleString('es-UY')}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Inversión total en los últimos 30 días</p>
          </div>
          <div className="pt-2 border-t border-zinc-100 text-[11px] text-zinc-600">
            <span className="font-semibold">{summary.reportedCampaignsCount}</span> campañas publicitarias analizadas
          </div>
        </div>

        {/* 2. Qué me trajo */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-500">2. ¿Qué me trajo?</span>
            <div className="rounded-lg bg-purple-50 p-2 text-purple-700">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-zinc-950">
              {summary.totalLeads} <span className="text-sm font-bold text-zinc-500">consultas</span>
            </p>
            <p className="text-xs text-emerald-700 font-bold mt-1">
              🎉 {summary.totalConversions} fiestas confirmadas
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-100 text-[11px] text-zinc-600">
            Facturado: <span className="font-bold text-zinc-950">${Math.round(totalFacturado).toLocaleString('es-UY')}</span>
          </div>
        </div>

        {/* 3. Cuánto me sale conseguir un cliente */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-500">3. ¿Cuánto me sale cada consulta?</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
              <Target className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-zinc-950">
              {summary.totalLeads > 0 ? `${summary.adCurrency} ${Math.round(summary.averageCpl).toLocaleString('es-UY')}` : '—'}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Costo promedio por persona que escribe</p>
          </div>
          <div className="pt-2 border-t border-zinc-100 text-[11px] text-zinc-600">
            Retorno: <span className="font-bold text-emerald-700">{summary.overallRoas !== null ? `${summary.overallRoas.toFixed(2)}x` : 'Calculando'}</span> ($ vuelve por cada $ invertido)
          </div>
        </div>

        {/* 4. Resumen rápido */}
        <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-900 to-zinc-950 p-5 text-white shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Eficiencia Comercial</span>
            <div className="rounded-lg bg-zinc-800 p-2 text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-emerald-400">
              {summary.totalLeads > 0 ? `${((summary.totalConversions / summary.totalLeads) * 100).toFixed(1)}%` : '0%'}
            </p>
            <p className="text-xs text-zinc-300 mt-1">De las consultas terminan en contrato</p>
          </div>
          <div className="pt-2 border-t border-zinc-800 text-[11px] text-zinc-400">
            Promedio del rubro: 15% - 25%
          </div>
        </div>
      </div>

      {/* 4. ¿QUÉ HAGO MAÑANA? (ACCIONES CONCRETAS EN CRIOLLO) */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-950 via-zinc-900 to-zinc-950 p-6 text-white shadow-xl space-y-4">
        <div className="flex items-center gap-3 border-b border-emerald-800/60 pb-4">
          <div className="rounded-xl bg-emerald-800/40 p-2 text-emerald-400 border border-emerald-700">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white">4. ¿Qué hago mañana con mis anuncios?</h2>
            <p className="text-xs text-emerald-200">Recomendaciones directas y en criollo basadas en las fiestas reales de Salto</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {accionesManana.map((acc, idx) => (
            <div
              key={idx}
              className={`rounded-xl border p-4 backdrop-blur-sm space-y-2 ${
                acc.tipo === 'frenar'
                  ? 'border-red-800/60 bg-red-950/30'
                  : acc.tipo === 'escalar'
                  ? 'border-emerald-700/60 bg-emerald-950/30'
                  : 'border-zinc-800 bg-zinc-900/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                    acc.tipo === 'frenar'
                      ? 'bg-red-900/80 text-red-300'
                      : acc.tipo === 'escalar'
                      ? 'bg-emerald-800/80 text-emerald-300'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {acc.tipo === 'frenar' ? '⚠️ Apagar / Modificar' : acc.tipo === 'escalar' ? '🚀 Subir presupuesto' : '💡 Sugerencia'}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-zinc-200">{acc.texto}</p>
            </div>
          ))}

          {recommendations.map((rec) => (
            <div key={rec.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded">
                Consejo Comercial
              </span>
              <h4 className="text-xs font-bold text-white">{rec.title}</h4>
              <p className="text-xs leading-relaxed text-zinc-300">{rec.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* EL CAMINO COMPLETO: EMBUDO VISUAL DONDE SE VE DÓNDE SE PIERDE LA GENTE */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-5">
        <div>
          <h2 className="text-lg font-bold text-zinc-950">El Camino Completo de tu Publicidad</h2>
          <p className="text-xs text-zinc-500">
            Mirá paso a paso cómo viaja la persona desde que ve la foto en Instagram hasta que paga la seña de su fiesta.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {/* Paso 1: Impresiones */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 text-center space-y-1.5">
            <div className="mx-auto w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
              1
            </div>
            <p className="text-[11px] font-bold text-zinc-600">Se mostró</p>
            <p className="text-xl font-black text-zinc-950">{totalImpresiones.toLocaleString('es-UY')}</p>
            <p className="text-[10px] text-zinc-400">veces en pantalla</p>
          </div>

          {/* Paso 2: Clics */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 text-center space-y-1.5">
            <div className="mx-auto w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
              2
            </div>
            <p className="text-[11px] font-bold text-zinc-600">Hicieron clic</p>
            <p className="text-xl font-black text-zinc-950">{totalClics.toLocaleString('es-UY')}</p>
            <p className="text-[10px] text-indigo-600 font-semibold">
              {totalImpresiones > 0 ? `${((totalClics / totalImpresiones) * 100).toFixed(1)}% entraron` : '—'}
            </p>
          </div>

          {/* Paso 3: Consultas */}
          <div className="rounded-xl border border-zinc-200 bg-purple-50/50 p-4 text-center space-y-1.5 border-purple-200">
            <div className="mx-auto w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
              3
            </div>
            <p className="text-[11px] font-bold text-purple-900">Escribieron</p>
            <p className="text-xl font-black text-purple-950">{totalConsultas}</p>
            <p className="text-[10px] text-purple-700 font-semibold">
              {totalClics > 0 ? `${((totalConsultas / totalClics) * 100).toFixed(1)}% consultó` : '—'}
            </p>
          </div>

          {/* Paso 4: Reunión / Simulador */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 text-center space-y-1.5">
            <div className="mx-auto w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">
              4
            </div>
            <p className="text-[11px] font-bold text-zinc-600">Presupuesto</p>
            <p className="text-xl font-black text-zinc-950">{Math.max(totalConsultas, totalContratos)}</p>
            <p className="text-[10px] text-amber-700 font-semibold">propuestas armadas</p>
          </div>

          {/* Paso 5: Contratos */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-center space-y-1.5">
            <div className="mx-auto w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
              5
            </div>
            <p className="text-[11px] font-bold text-emerald-900">Contrataron</p>
            <p className="text-xl font-black text-emerald-800">{totalContratos}</p>
            <p className="text-[10px] text-emerald-700 font-bold">fiestas cerradas</p>
          </div>

          {/* Paso 6: Facturación */}
          <div className="rounded-xl border border-emerald-300 bg-emerald-100/50 p-4 text-center space-y-1.5">
            <div className="mx-auto w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
              $
            </div>
            <p className="text-[11px] font-bold text-emerald-950">Facturación</p>
            <p className="text-lg font-black text-emerald-950">${Math.round(totalFacturado).toLocaleString('es-UY')}</p>
            <p className="text-[10px] text-emerald-800 font-semibold">en contratos</p>
          </div>
        </div>
      </div>

      {/* TABLA DETALLADA DE CAMPAÑAS (TRADUCIDA AL CRIOLLO) */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-950">Tus Anuncios y Campañas Reales</h2>
            <p className="text-xs text-zinc-500">Muestra cuánto pusiste y cuántas consultas te trajo cada anuncio en los últimos 30 días.</p>
          </div>
          <span className="text-xs font-semibold text-zinc-500">
            {isConnected ? 'Sincronizado con Meta Ads' : 'Sin conexión activa'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-700 border-b border-zinc-200">
              <tr>
                <th className="px-4 py-3">Nombre del Anuncio</th>
                <th className="px-4 py-3">Inversión</th>
                <th className="px-4 py-3">Cuántas veces se mostró</th>
                <th className="px-4 py-3">De cada 100, cuántos hicieron clic</th>
                <th className="px-4 py-3">Lo que te sale cada consulta</th>
                <th className="px-4 py-3">Fiestas cerradas</th>
                <th className="px-4 py-3">Plata facturada</th>
                <th className="px-4 py-3 text-right">Cuánto volvió por cada $</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {summary.campaigns.map((camp) => (
                <tr key={camp.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="px-4 py-4 font-bold text-zinc-950 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                    {camp.name}
                  </td>
                  <td className="px-4 py-4 font-medium text-zinc-900">
                    {summary.adCurrency} {Math.round(camp.spend).toLocaleString('es-UY')}
                  </td>
                  <td className="px-4 py-4">{camp.impressions.toLocaleString('es-UY')}</td>
                  <td className="px-4 py-4 font-semibold text-zinc-700">{camp.ctrPct.toFixed(1)}%</td>
                  <td className="px-4 py-4 font-semibold text-purple-700">
                    {camp.leadsCount > 0 ? `${summary.adCurrency} ${Math.round(camp.cpl).toLocaleString('es-UY')}` : 'Sin consultas'}
                  </td>
                  <td className="px-4 py-4 font-bold text-emerald-700">{camp.conversionsCount}</td>
                  <td className="px-4 py-4 font-bold text-zinc-950">
                    ${Math.round(camp.revenue).toLocaleString('es-UY')}
                  </td>
                  <td className="px-4 py-4 text-right font-black text-amber-600">
                    {camp.roasRatio === null ? '—' : `${camp.roasRatio.toFixed(2)}x`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {summary.campaigns.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500">
              {isConnected
                ? 'No hay campañas con gasto registrado en los últimos 30 días.'
                : 'Conectá tu cuenta de Meta en Ajustes para ver el rendimiento de tus campañas.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
