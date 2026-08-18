'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { DigitalPresenceDashboardData, CampaignCommercialRoi } from '@/types/presencia-digital';
import type { SocialPost } from '@/types/social-media';
import {
  publishApprovedSocialPost,
  createPostFromDailySuggestion,
  getCommercialAcquisitionBySource,
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
  PlusCircle,
} from 'lucide-react';

interface Props {
  initialData: DigitalPresenceDashboardData;
  initialPosts: SocialPost[];
}

export function PresenciaDigitalClient({ initialData, initialPosts }: Props) {
  const [data, setData] = useState<DigitalPresenceDashboardData>(initialData);
  const [posts, setPosts] = useState<SocialPost[]>(initialPosts);
  const [activeTab, setActiveTab] = useState<'revision' | 'clientes_red' | 'ads' | 'publicaciones' | 'historial'>('revision');
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [publishFeedback, setPublishFeedback] = useState<{
    success: boolean;
    message: string;
    details?: string[];
  } | null>(null);
  const [creatingSuggestion, setCreatingSuggestion] = useState(false);

  // Estado para el período del Bloque 3
  const [periodoDias, setPeriodoDias] = useState<number>(90);
  const [loadingPeriodo, setLoadingPeriodo] = useState<boolean>(false);
  const [sourceAttribution, setSourceAttribution] = useState(data.sourceAttribution);

  const kpis = data.kpis;
  const review = data.review;

  const handlePeriodoChange = async (dias: number) => {
    setPeriodoDias(dias);
    setLoadingPeriodo(true);
    try {
      const res = await getCommercialAcquisitionBySource(dias);
      if (res.success && res.data) {
        setSourceAttribution(res.data);
      }
    } catch (err) {
      console.error('Error al cambiar período de atribución:', err);
    } finally {
      setLoadingPeriodo(false);
    }
  };

  const handlePublishPost = async (postId: string) => {
    setPublishingId(postId);
    setPublishFeedback(null);
    try {
      const res = await publishApprovedSocialPost(postId);
      if (res.success) {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, status: 'Publicado' } : p))
        );
        const redExitosa = res.publishedTo?.join(', ') || 'las redes conectadas';
        let detailMsg = `Publicado con éxito en: ${redExitosa}.`;
        if (res.failedPlatforms && res.failedPlatforms.length > 0) {
          detailMsg += ` (Aviso: ${res.failedPlatforms.map((f) => `${f.platform}: ${f.reason}`).join(' - ')})`;
        }
        setPublishFeedback({
          success: true,
          message: detailMsg,
        });
      } else {
        setPublishFeedback({
          success: false,
          message: res.error || 'No se pudo publicar el posteo.',
        });
      }
    } catch (err: any) {
      setPublishFeedback({
        success: false,
        message: err.message || 'Error de comunicación al publicar.',
      });
    } finally {
      setPublishingId(null);
    }
  };

  const handleCreateFromSuggestion = async () => {
    if (!review?.dailyPostSuggestion) return;
    setCreatingSuggestion(true);
    try {
      const fullText = `${review.dailyPostSuggestion.text}\n\n${review.dailyPostSuggestion.hashtags.join(' ')}`;
      const res = await createPostFromDailySuggestion(fullText, 'Instagram');
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

  // Determinar alertas de inactividad para el Bloque 4
  const inactivePlatforms = review?.inactivePlatforms || [];
  const hasInactivity = inactivePlatforms.length > 0;

  return (
    <div className="space-y-6">
      {/* BLOQUE 4: AVISO VISIBLE ARRIBA SOBRE ACTIVIDAD / INACTIVIDAD */}
      {hasInactivity ? (
        <div className="p-4 md:p-5 bg-amber-950/40 border border-amber-500/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-amber-950/20">
          <div className="flex items-start gap-3.5">
            <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm md:text-base font-bold text-amber-200">
                Atención a tus publicaciones
              </h3>
              <p className="text-xs md:text-sm text-amber-300/90 mt-0.5">
                {inactivePlatforms
                  .map((p) => `Hace ${p.daysWithoutPost} días que no publicás en ${p.platform}`)
                  .join(' · ')}
                . La gente no te contrata si no te ve activo.
              </p>
            </div>
          </div>
          <Link
            href="/empresa/redes-sociales"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs md:text-sm rounded-xl transition shrink-0 shadow"
          >
            <PlusCircle className="w-4 h-4" />
            Crear posteo con última fiesta
          </Link>
        </div>
      ) : (
        <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-xs md:text-sm font-semibold text-emerald-200">
              Venís publicando parejo 🎉 Todas tus redes principales tienen actividad reciente.
            </p>
          </div>
          <Link
            href="/empresa/redes-sociales"
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 shrink-0"
          >
            Planificador <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

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
            {kpis.pendingApprovalPostsCount} <span className="text-sm font-normal text-slate-400">listos</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Nada se publica solo. Requiere tu visto bueno.
          </p>
        </div>

        <div className="p-4 md:p-5 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Google Ficha</span>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-white">
            {kpis.googleRating === null ? '—' : `★ ${kpis.googleRating}`}
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {kpis.googleReviewsCount === null
              ? 'Conectada y verificada en Salto'
              : `${kpis.googleReviewsCount} opiniones de clientes`}
          </p>
        </div>
      </div>

      {/* Banner de feedback al publicar */}
      {publishFeedback && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
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
          onClick={() => setActiveTab('clientes_red')}
          className={`px-4 py-2 text-sm font-bold rounded-xl transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'clientes_red'
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Target className="w-4 h-4" /> Clientes por Red
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
        </div>
      )}

      {/* PESTAÑA 2: BLOQUE 3 - CLIENTES POR RED (ATRACCIÓN Y VENTAS REALES) */}
      {activeTab === 'clientes_red' && (
        <div className="space-y-6">
          <div className="p-5 md:p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-400" />
                  ¿Qué red social te trae clientes de verdad?
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Consultas recibidas, fiestas contratadas y monto total real generado por cada canal.
                </p>
              </div>

              {/* Selector de período */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => handlePeriodoChange(30)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    periodoDias === 30 ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  30 días
                </button>
                <button
                  onClick={() => handlePeriodoChange(90)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    periodoDias === 90 ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  90 días
                </button>
                <button
                  onClick={() => handlePeriodoChange(365)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    periodoDias === 365 ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todo el año
                </button>
              </div>
            </div>

            {loadingPeriodo ? (
              <div className="text-center py-8 text-slate-400 text-sm">Actualizando datos del período...</div>
            ) : sourceAttribution ? (
              <div className="space-y-4 pt-2">
                {/* Resumen global del período */}
                <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-center">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Consultas</span>
                    <p className="text-xl md:text-2xl font-black text-white">{sourceAttribution.totalConsultas}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Contratos</span>
                    <p className="text-xl md:text-2xl font-black text-emerald-400">{sourceAttribution.totalContratos}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Cerrado</span>
                    <p className="text-xl md:text-2xl font-black text-indigo-300">
                      ${sourceAttribution.totalMontoUYU.toLocaleString('es-UY')}
                    </p>
                  </div>
                </div>

                {/* Grid por red */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sourceAttribution.redes.map((item) => (
                    <div
                      key={item.red}
                      className={`p-4 rounded-xl border transition ${
                        item.hasData
                          ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                          : 'bg-slate-950/30 border-slate-900 opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-white text-sm">{item.red}</span>
                        {item.hasData ? (
                          <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                            {item.tasaConversionPct}% conv.
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full">
                            0 consultas
                          </span>
                        )}
                      </div>

                      {item.hasData ? (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Consultas:</span>
                            <span className="font-bold text-slate-200">{item.consultasCount}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Fiestas contratadas:</span>
                            <span className="font-bold text-emerald-400">{item.contratosCount}</span>
                          </div>
                          <div className="flex justify-between text-xs pt-1 border-t border-slate-800">
                            <span className="text-slate-400">Plata de contratos:</span>
                            <span className="font-bold text-white">${item.montoTotalUYU.toLocaleString('es-UY')}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 leading-relaxed italic">
                          {item.mensajeSinConsultas || `De ${item.red} no vino ninguna consulta en estos ${periodoDias} días.`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: PUBLICIDAD VS FIESTAS REALES */}
      {activeTab === 'ads' && (
        <div className="space-y-4">
          <div className="p-5 md:p-6 bg-slate-900/90 border border-slate-800 rounded-2xl">
            <h2 className="text-lg font-bold text-white mb-2">
              Retorno Real de Anuncios Publicitarios
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Cruce determinista entre tus campañas de Meta Ads y las fiestas con contrato o seña confirmada.
            </p>

            <div className="divide-y divide-slate-800">
              {data.commercialAdsRoi.map((campaign) => (
                <div key={campaign.campaignId} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <span className="text-sm font-bold text-white">{campaign.campaignName}</span>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Gasto: ${campaign.spend.toLocaleString('es-UY')} · Consultas: {campaign.leadsCount}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-400">
                        {campaign.conversionsCount} fiesta{campaign.conversionsCount === 1 ? '' : 's'} cerrada{campaign.conversionsCount === 1 ? '' : 's'}
                      </span>
                      <p className="text-xs text-slate-400">
                        {campaign.costPerParty
                          ? `$${campaign.costPerParty.toLocaleString('es-UY')} por fiesta`
                          : 'Sin cierres aún'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 4: PUBLICACIONES */}
      {activeTab === 'publicaciones' && (
        <div className="space-y-4">
          <div className="p-5 md:p-6 bg-slate-900/90 border border-slate-800 rounded-2xl">
            <h2 className="text-lg font-bold text-white mb-4">
              Posteos Pendientes y Programados
            </h2>

            <div className="divide-y divide-slate-800">
              {posts.filter((p) => p.status === 'Borrador' || p.status === 'Programado' || p.status === 'Listo para copiar').map((post) => (
                <div key={post.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 bg-slate-800 text-slate-300 rounded">
                        {post.platform}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        post.status === 'Listo para copiar'
                          ? 'bg-amber-500/20 text-amber-300'
                          : post.status === 'Programado'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-slate-800 text-slate-400'
                      }`}>
                        {post.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2">{post.text}</p>
                    {post.lastError && (
                      <p className="text-[11px] text-amber-400">{post.lastError}</p>
                    )}
                  </div>

                  <button
                    onClick={() => handlePublishPost(post.id)}
                    disabled={publishingId === post.id}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shrink-0 disabled:opacity-50"
                  >
                    {publishingId === post.id ? 'Publicando...' : 'Aprobar y Publicar'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 5: HISTORIAL */}
      {activeTab === 'historial' && (
        <div className="p-5 md:p-6 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <h2 className="text-lg font-bold text-white mb-4">
            Evolución de Métricas Diarias
          </h2>
          <p className="text-xs text-slate-400">
            Registro cronológico guardado automáticamente día a día sin números inventados.
          </p>
        </div>
      )}
    </div>
  );
}
