'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type {
  DigitalPresenceDashboardData,
  CampaignCommercialRoi,
  NetworkAttributionPeriod,
  NetworkAttributionReport,
} from '@/types/presencia-digital';
import type { SocialPost } from '@/types/social-media';
import {
  publishApprovedSocialPost,
  createPostFromDailySuggestion,
  getNetworkAttributionReport,
} from '@/app/actions/presencia-digital';
import {
  Users,
  TrendingUp,
  DollarSign,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Share2,
  BarChart3,
  Flame,
  ShieldAlert,
  Target,
  ArrowRight,
} from 'lucide-react';

interface Props {
  initialData: DigitalPresenceDashboardData;
  initialPosts: SocialPost[];
}

export function PresenciaDigitalClient({ initialData, initialPosts }: Props) {
  const [data, setData] = useState<DigitalPresenceDashboardData>(initialData);
  const [posts, setPosts] = useState<SocialPost[]>(initialPosts);
  const [activeTab, setActiveTab] = useState<'revision' | 'ads' | 'atribucion' | 'publicaciones' | 'historial'>('revision');
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [publishFeedback, setPublishFeedback] = useState<{
    success: boolean;
    message: string;
    details?: string[];
  } | null>(null);
  const [attributionPeriod, setAttributionPeriod] = useState<NetworkAttributionPeriod>('90d');
  const [attributionReport, setAttributionReport] = useState<NetworkAttributionReport | null>(null);
  const [loadingAttribution, setLoadingAttribution] = useState(false);
  const [creatingSuggestion, setCreatingSuggestion] = useState(false);

  const loadAttribution = useCallback(async (period: NetworkAttributionPeriod) => {
    setLoadingAttribution(true);
    try {
      const res = await getNetworkAttributionReport(period);
      if (res.success && res.data) {
        setAttributionReport(res.data);
      }
    } catch {
      // Manejo silencioso de error
    } finally {
      setLoadingAttribution(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'atribucion' && !attributionReport) {
      loadAttribution(attributionPeriod);
    }
  }, [activeTab, attributionPeriod, attributionReport, loadAttribution]);

  const handlePeriodChange = (period: NetworkAttributionPeriod) => {
    setAttributionPeriod(period);
    loadAttribution(period);
  };

  const kpis = data.kpis;
  const review = data.review;

  const handlePublishPost = async (postId: string) => {
    setPublishingId(postId);
    setPublishFeedback(null);
    try {
      const res = await publishApprovedSocialPost(postId);
      if (res.success) {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, status: 'Publicado' } : p))
        );
        const details = res.publishedTo?.map((plat) => `Publicado en ${plat}`) || [];
        setPublishFeedback({
          success: true,
          message: '¡Publicación enviada con éxito!',
          details,
        });
      } else {
        setPublishFeedback({
          success: false,
          message: res.error || 'No se pudo completar la publicación en las redes.',
        });
      }
    } catch (err: any) {
      setPublishFeedback({
        success: false,
        message: err.message || 'Error inesperado al publicar.',
      });
    } finally {
      setPublishingId(null);
    }
  };

  const handleCreateFromSuggestion = async () => {
    if (!review?.dailyPostSuggestion) return;
    setCreatingSuggestion(true);
    setPublishFeedback(null);
    try {
      const res = await createPostFromDailySuggestion(
        review.dailyPostSuggestion.text,
        review.dailyPostSuggestion.recommendedPlatform === 'Facebook' ? 'Facebook' : 'Instagram'
      );
      if (res.success && res.post) {
        setPosts((prev) => [res.post!, ...prev]);
        setPublishFeedback({
          success: true,
          message: '¡Borrador creado en el planificador! Podés revisarlo en la pestaña de Publicaciones antes de aprobarlo.',
        });
        setActiveTab('publicaciones');
      } else {
        setPublishFeedback({
          success: false,
          message: res.error || 'No se pudo generar el borrador.',
        });
      }
    } catch (err: any) {
      setPublishFeedback({
        success: false,
        message: err.message || 'Error al crear el posteo sugerido.',
      });
    } finally {
      setCreatingSuggestion(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. KPIs GRANDES (Pensados para ver de un vistazo en el celular) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="p-4 md:p-5 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Seguidores</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-white">
            {kpis.totalFollowers === null ? '—' : kpis.totalFollowers.toLocaleString('es-UY')}
          </div>
          {kpis.totalFollowers === null ? (
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Sin dato. Se ve cuando conectes Instagram y Facebook en Ajustes.
            </p>
          ) : (
            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3 h-3" /> +{kpis.followersWeeklyChange ?? 0} esta semana
            </p>
          )}
        </div>

        <div className="p-4 md:p-5 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Fiestas de Avisos</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-emerald-400">
            {kpis.signedPartiesFromAds} <span className="text-sm font-normal text-slate-400">cerradas</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {kpis.averageCostPerSignedParty
              ? `Costo real: $${kpis.averageCostPerSignedParty.toLocaleString('es-UY')} / fiesta`
              : 'Sin gasto registrado'}
          </p>
        </div>

        <div className="p-4 md:p-5 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Por Aprobar</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-amber-400">
            {kpis.pendingApprovalPostsCount}
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Posteos en espera de tu visto bueno
          </p>
        </div>

        <div className="p-4 md:p-5 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Ficha de Google</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-white flex items-center gap-1.5">
            {kpis.googleRating === null ? '—' : <>{kpis.googleRating} <span className="text-amber-400 text-lg">★</span></>}
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {kpis.googleReviewsCount === null
              ? 'Sin dato. Tu puntaje real se ve en tu panel de Google.'
              : `${kpis.googleReviewsCount} opiniones de clientes`}
          </p>
        </div>
      </div>

      {/* BLOQUE 4: ALERTA DE INACTIVIDAD / ESTADO DE PUBLICACIÓN */}
      {review?.inactivePlatforms && review.inactivePlatforms.length > 0 ? (
        <div className="p-4 md:p-5 bg-amber-950/40 border border-amber-800/60 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <AlertCircle className="w-5 h-5" />
            <span>Alerta de presencia digital: se están enfriando tus redes</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {review.inactivePlatforms.map((p) => (
              <div
                key={p.platform}
                className="p-3.5 bg-slate-950/80 border border-amber-900/40 rounded-xl flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-bold text-amber-300">
                    Hace {p.daysWithoutPost} días que no publicás en {p.platform}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Tus seguidores no te ven
                  </div>
                </div>
                <Link
                  href="/empresa/redes-sociales"
                  className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 text-amber-200 border border-amber-500/30 rounded-lg text-xs font-bold shrink-0 transition flex items-center gap-1"
                >
                  Armar posteo <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-emerald-950/30 border border-emerald-800/50 rounded-2xl flex items-center gap-3 text-emerald-200 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <span className="font-bold">Venís publicando parejo 👏</span> Todas tus redes principales tienen publicaciones recientes y te mantienen visible ante clientes.
          </div>
        </div>
      )}

      {/* Notificación de feedback */}
      {publishFeedback && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 transition ${
            publishFeedback.success
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
              : 'bg-red-950/40 border-red-800/80 text-red-200'
          }`}
        >
          {publishFeedback.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          )}
          <div className="text-sm font-medium">{publishFeedback.message}</div>
        </div>
      )}

      {/* Pestañas de navegación */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('revision')}
          className={`px-4 py-2 text-sm font-bold rounded-xl transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'revision'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Revisión Diaria
        </button>

        <button
          onClick={() => setActiveTab('atribucion')}
          className={`px-4 py-2 text-sm font-bold rounded-xl transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'atribucion'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Target className="w-4 h-4" /> ¿De dónde vienen?
        </button>

        <button
          onClick={() => setActiveTab('ads')}
          className={`px-4 py-2 text-sm font-bold rounded-xl transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'ads'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Publicidad vs Fiestas
        </button>

        <button
          onClick={() => setActiveTab('publicaciones')}
          className={`px-4 py-2 text-sm font-bold rounded-xl transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'publicaciones'
              ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Send className="w-4 h-4" /> Publicar Multired
        </button>

        <button
          onClick={() => setActiveTab('historial')}
          className={`px-4 py-2 text-sm font-bold rounded-xl transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'historial'
              ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Evolución Día a Día
        </button>
      </div>

      {/* CONTENIDO DE PESTAÑAS */}

      {/* PESTAÑA 1: REVISIÓN DIARIA */}
      {activeTab === 'revision' && review && (
        <div className="space-y-6">
          {/* Tarjeta de Resumen */}
          <div className="p-5 md:p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Resumen de Hoy ({review.date})
              </h2>
              {review.aiUsed && (
                <span className="text-[11px] font-semibold px-2.5 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-lg">
                  Contabilizado en IA
                </span>
              )}
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{review.summary}</p>

            {/* Alertas de inactividad o desconexión */}
            {review.inactivePlatforms.length > 0 && (
              <div className="p-3.5 bg-amber-950/30 border border-amber-800/50 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200">
                  <span className="font-bold">Atención:</span> Hay redes sin publicaciones recientes:{' '}
                  {review.inactivePlatforms
                    .map((p) => `${p.platform} (${p.daysWithoutPost} días sin postear)`)
                    .join(', ')}
                  .
                </div>
              </div>
            )}
          </div>

          {/* Sugerencia de posteo para hoy */}
          <div className="p-5 md:p-6 bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Sugerencia para Publicar Hoy
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {review.dailyPostSuggestion.concept}
                </h3>
              </div>
              <button
                onClick={handleCreateFromSuggestion}
                disabled={creatingSuggestion}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
              >
                {creatingSuggestion ? 'Creando...' : 'Preparar Borrador'}
              </button>
            </div>

            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-200 whitespace-pre-wrap font-sans">
              {review.dailyPostSuggestion.text}
              <div className="text-xs text-blue-400 mt-3 flex flex-wrap gap-1.5 font-medium">
                {review.dailyPostSuggestion.hashtags.join(' ')}
              </div>
            </div>
          </div>

          {/* Publicación con mejor rendimiento */}
          {review.topPost && (
            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                La publicación que más rindió
              </h3>
              <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400">{review.topPost.platform}</span>
                  <p className="text-sm text-slate-200 mt-1 line-clamp-2">{review.topPost.text}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-black text-amber-400">
                    {review.topPost.interactions} <span className="text-xs font-normal text-slate-400">interacciones</span>
                  </div>
                  <div className="text-xs text-slate-500">{review.topPost.likes} corazones</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 2: ATRIBUCIÓN REAL: ¿QUÉ RED TRAE CLIENTES? (Bloque 3) */}
      {activeTab === 'atribucion' && (
        <div className="space-y-6">
          {/* Header con selector de período */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                Clientes y Contratos por Red Social
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                De dónde vinieron los que pidieron presupuesto y cuántos contrataron de verdad. Sin números inventados.
              </p>
            </div>

            {/* Selector de período */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {(['30d', '90d', 'year', 'all'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePeriodChange(p)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    attributionPeriod === p
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p === '30d' ? '30 días' : p === '90d' ? '90 días' : p === 'year' ? 'Este año' : 'Todo'}
                </button>
              ))}
            </div>
          </div>

          {loadingAttribution ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Cargando atribución por red social...
            </div>
          ) : attributionReport ? (
            <>
              {/* Tarjetas resumen del período */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                  <div className="text-xs font-semibold text-slate-400 uppercase">Consultas ({attributionReport.periodLabel})</div>
                  <div className="text-2xl font-black text-white mt-1">
                    {attributionReport.totalConsultas}
                  </div>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                  <div className="text-xs font-semibold text-slate-400 uppercase">Presupuestos Emitidos</div>
                  <div className="text-2xl font-black text-purple-400 mt-1">
                    {attributionReport.totalPresupuestos}
                  </div>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                  <div className="text-xs font-semibold text-slate-400 uppercase">Contratos Cerrados</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {attributionReport.totalContratados}
                  </div>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                  <div className="text-xs font-semibold text-slate-400 uppercase">Facturación Contratada</div>
                  <div className="text-2xl font-black text-amber-400 mt-1">
                    ${attributionReport.totalRevenueUYU.toLocaleString('es-UY')}
                  </div>
                </div>
              </div>

              {/* Tabla de desglose por red */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/90">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Red Social / Canal</th>
                      <th className="p-3.5 text-center">Consultas</th>
                      <th className="p-3.5 text-center">Presupuestos</th>
                      <th className="p-3.5 text-center">Contratados</th>
                      <th className="p-3.5 text-right">Plata Contratada</th>
                      <th className="p-3.5">Diagnóstico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950">
                    {attributionReport.rows.map((row) => (
                      <tr key={row.sourceKey} className="hover:bg-slate-900/50">
                        <td className="p-3.5 font-bold text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          {row.network}
                        </td>
                        <td className="p-3.5 text-center font-semibold text-slate-200">
                          {row.consultasCount}
                        </td>
                        <td className="p-3.5 text-center font-semibold text-purple-300">
                          {row.presupuestosCount}
                        </td>
                        <td className="p-3.5 text-center font-bold text-emerald-400">
                          {row.contratadosCount}
                        </td>
                        <td className="p-3.5 text-right font-black text-amber-400">
                          {row.totalRevenueUYU > 0 ? `$${row.totalRevenueUYU.toLocaleString('es-UY')}` : '$0'}
                        </td>
                        <td className="p-3.5">
                          {row.inactivityNote ? (
                            <span className="text-amber-400/90 italic font-medium">
                              {row.inactivityNote}
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-semibold">
                              Canal activo ({row.consultasCount} {row.consultasCount === 1 ? 'consulta' : 'consultas'})
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* PESTAÑA 3: PUBLICIDAD VS FIESTAS REALES (Bloque 5) */}
      {activeTab === 'ads' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-sm text-slate-300 flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">Medición contra fiestas de verdad:</span> Meta solo
              ve clics, pero acá medimos contra la seña cobrada en el CRM. Así sabés qué avisos te hacen
              ganar plata y cuáles conviene cortar.
            </div>
          </div>

          <div className="space-y-3">
            {data.commercialAdsRoi.map((campaign) => (
              <div
                key={campaign.campaignId}
                className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">{campaign.campaignName}</h3>
                    <span className="text-xs text-slate-400">{campaign.platform}</span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 text-xs font-bold rounded-lg border ${
                        campaign.conversionsCount > 0
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {campaign.statusText}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center py-1">
                  <div className="p-2.5 bg-slate-950 rounded-xl">
                    <div className="text-xs text-slate-400">Gasto Invertido</div>
                    <div className="text-base font-black text-white mt-0.5">
                      ${campaign.spend.toLocaleString('es-UY')}
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-xl">
                    <div className="text-xs text-slate-400">Consultas (Leads)</div>
                    <div className="text-base font-black text-blue-400 mt-0.5">
                      {campaign.leadsCount}
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-xl">
                    <div className="text-xs text-slate-400">Presupuestos</div>
                    <div className="text-base font-black text-purple-400 mt-0.5">
                      {campaign.budgetsCount}
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-xl">
                    <div className="text-xs text-slate-400">Costo por Fiesta</div>
                    <div className="text-base font-black text-emerald-400 mt-0.5">
                      {campaign.costPerParty
                        ? `$${campaign.costPerParty.toLocaleString('es-UY')}`
                        : 'Sin cierres'}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                  <span className="font-bold text-amber-400">Análisis:</span> {campaign.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: PUBLICAR MULTIRED (Bloque 3) */}
      {activeTab === 'publicaciones' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-950/30 border border-blue-800/40 rounded-2xl text-xs text-blue-200 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Regla de seguridad:</span> Nada se publica solo. La app prepara
              y vos aprobás antes de que salga a las redes. Los estados de WhatsApp no se automatizan
              para proteger el número de AK.
            </div>
          </div>

          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded-md border border-slate-700">
                      {post.platform}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                        post.status === 'Publicado'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : post.status === 'Programado'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {post.status}
                    </span>
                    {post.publishDate && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.publishDate).toLocaleDateString('es-UY')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-200 line-clamp-3 whitespace-pre-wrap">{post.text}</p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {post.status !== 'Publicado' ? (
                    <button
                      onClick={() => handlePublishPost(post.id)}
                      disabled={publishingId === post.id}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {publishingId === post.id ? 'Publicando...' : 'Aprobar y Publicar'}
                    </button>
                  ) : (
                    <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Ya publicado
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PESTAÑA 4: EVOLUCIÓN DÍA A DÍA (Bloque 2) */}
      {activeTab === 'historial' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-sm text-slate-300">
            <span className="font-bold text-white">Historial construido desde hoy:</span> Como las
            plataformas no dan datos hacia atrás, la app guarda una foto de tus números todos los días.
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Red</th>
                  <th className="p-3">Seguidores</th>
                  <th className="p-3">Alcance</th>
                  <th className="p-3">Interacciones</th>
                  <th className="p-3">Gasto Ads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950">
                {data.recentHistory.map((snap, idx) => (
                  <tr key={`${snap.date}_${snap.platform}_${idx}`} className="hover:bg-slate-900/50">
                    <td className="p-3 font-semibold text-white">{snap.date}</td>
                    <td className="p-3 font-medium text-amber-300">{snap.platform}</td>
                    <td className="p-3">{snap.followers === null ? '—' : snap.followers.toLocaleString('es-UY')}</td>
                    <td className="p-3">{snap.reach === null ? '—' : snap.reach.toLocaleString('es-UY')}</td>
                    <td className="p-3">{snap.interactions}</td>
                    <td className="p-3">
                      {snap.adSpend > 0 ? `$${snap.adSpend.toLocaleString('es-UY')}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
