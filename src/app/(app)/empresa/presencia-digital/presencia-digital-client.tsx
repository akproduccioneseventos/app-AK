'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type {
  DigitalPresenceDashboardData,
  CampaignCommercialRoi,
  NetworkAttributionPeriod,
  NetworkAttributionReport,
} from '@/types/presencia-digital';
import type { GoogleAnalyticsDashboardData } from '@/lib/presencia-digital/google-analytics';
import type { SocialPost } from '@/types/social-media';
import type { SocialComment, NetworkCommentsBackfillState, CommentNetwork } from '@/types/comentarios-redes';
import {
  publishApprovedSocialPost,
  createPostFromDailySuggestion,
  getNetworkAttributionReport,
  getWebsiteAnalyticsData,
} from '@/app/actions/presencia-digital';
import {
  getSocialCommentsDashboardAction,
  triggerCommentsSyncAction,
  restoreHiddenCommentAction,
  hideCommentAction,
  publishCommentAsTestimonialAction,
  type CommentsDashboardResponse,
} from '@/app/actions/comentarios-redes';
import { GoogleBusinessProfileWidget } from '@/components/google-business-profile';
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
  Globe,
  MapPin,
  ExternalLink,
  HelpCircle,
  MessageSquare,
  ThumbsUp,
  EyeOff,
  ShieldCheck,
  RefreshCw,
  MessageCircle,
} from 'lucide-react';

interface Props {
  initialData: DigitalPresenceDashboardData;
  initialPosts: SocialPost[];
}

export function PresenciaDigitalClient({ initialData, initialPosts }: Props) {
  const [data, setData] = useState<DigitalPresenceDashboardData>(initialData);
  const [posts, setPosts] = useState<SocialPost[]>(initialPosts);
  const [activeTab, setActiveTab] = useState<'revision' | 'comentarios' | 'web' | 'atribucion' | 'ads' | 'google_ficha' | 'publicaciones' | 'historial'>('revision');
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

  // Estado para la solapa "Comentarios de redes" (Bloque 4)
  const [commentsData, setCommentsData] = useState<CommentsDashboardResponse['data'] | null>(null);
  const [loadingComments, setLoadingComments] = useState<boolean>(false);
  const [syncingComments, setSyncingComments] = useState<boolean>(false);

  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const res = await getSocialCommentsDashboardAction();
      if (res.success && res.data) {
        setCommentsData(res.data);
      }
    } catch {
      //
    } finally {
      setLoadingComments(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'comentarios' && !commentsData) {
      loadComments();
    }
  }, [activeTab, commentsData, loadComments]);

  const handleSyncComments = async (full: boolean = false) => {
    setSyncingComments(true);
    try {
      const res = await triggerCommentsSyncAction(full);
      if (res.success) {
        setPublishFeedback({
          success: true,
          message: `¡Comentarios sincronizados con éxito! ${res.result?.totalNew || 0} nuevos encontrados.`,
        });
        await loadComments();
      } else {
        setPublishFeedback({
          success: false,
          message: res.error || 'No se pudo sincronizar los comentarios.',
        });
      }
    } catch (err: any) {
      setPublishFeedback({
        success: false,
        message: err.message || 'Error al sincronizar comentarios.',
      });
    } finally {
      setSyncingComments(false);
    }
  };

  const handleRestoreComment = async (commentId: string) => {
    try {
      const res = await restoreHiddenCommentAction(commentId);
      if (res.success) {
        setPublishFeedback({
          success: true,
          message: '¡Comentario devuelto a la vista en la red social con éxito!',
        });
        await loadComments();
      } else {
        setPublishFeedback({
          success: false,
          message: res.error || 'No se pudo restaurar el comentario.',
        });
      }
    } catch (err: any) {
      setPublishFeedback({
        success: false,
        message: err.message || 'Error al restaurar comentario.',
      });
    }
  };

  const handleHideComment = async (commentId: string) => {
    try {
      const res = await hideCommentAction(commentId);
      if (res.success) {
        setPublishFeedback({
          success: true,
          message: 'Comentario ocultado en la red social.',
        });
        await loadComments();
      } else {
        setPublishFeedback({
          success: false,
          message: res.error || 'No se pudo ocultar el comentario.',
        });
      }
    } catch (err: any) {
      setPublishFeedback({
        success: false,
        message: err.message || 'Error al ocultar comentario.',
      });
    }
  };

  const handlePublishAsTestimonial = async (commentId: string) => {
    try {
      const res = await publishCommentAsTestimonialAction(commentId);
      if (res.success) {
        setPublishFeedback({
          success: true,
          message: '¡Testimonio publicado en la web con éxito!',
        });
        await loadComments();
      } else {
        setPublishFeedback({
          success: false,
          message: res.error || 'No se pudo publicar como testimonio.',
        });
      }
    } catch (err: any) {
      setPublishFeedback({
        success: false,
        message: err.message || 'Error al publicar testimonio.',
      });
    }
  };

  // Estado para la solapa "Tu página web" (Bloque 1)
  const [webPeriodo, setWebPeriodo] = useState<number>(30);
  const [loadingWeb, setLoadingWeb] = useState<boolean>(false);
  const [websiteAnalytics, setWebsiteAnalytics] = useState<GoogleAnalyticsDashboardData | undefined>(data.websiteAnalytics);

  const handleWebPeriodoChange = async (dias: number) => {
    setWebPeriodo(dias);
    setLoadingWeb(true);
    try {
      const res = await getWebsiteAnalyticsData(dias);
      if (res.success && res.data) {
        setWebsiteAnalytics(res.data);
      }
    } catch {
      //
    } finally {
      setLoadingWeb(false);
    }
  };

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
          onClick={() => setActiveTab('comentarios')}
          className={`px-4 py-2 text-sm font-bold rounded-xl transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'comentarios'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Comentarios de redes
        </button>

        <button
          onClick={() => setActiveTab('web')}
          className={`px-4 py-2 text-sm font-bold rounded-xl transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'web'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-4 h-4" /> Tu página web
        </button>

        <button
          onClick={() => setActiveTab('google_ficha')}
          className={`px-4 py-2 text-sm font-bold rounded-xl transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'google_ficha'
              ? 'bg-yellow-500 text-slate-950 shadow-md shadow-yellow-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapPin className="w-4 h-4" /> Ficha de Google
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

      {/* PESTAÑA: COMENTARIOS DE REDES (Orden Comentarios de las Redes) */}
      {activeTab === 'comentarios' && (
        <div className="space-y-6">
          {/* Header con botón de sincronización */}
          <div className="p-5 md:p-6 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-rose-400" />
                Comentarios de Facebook, Instagram y YouTube
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Moderación automática de insultos, rescate de testimonios para la web y atención de quejas legítimas.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSyncComments(false)}
                disabled={syncingComments}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingComments ? 'animate-spin' : ''}`} />
                {syncingComments ? 'Buscando...' : 'Traer lo nuevo'}
              </button>
              <button
                onClick={() => handleSyncComments(true)}
                disabled={syncingComments}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Historial completo
              </button>
            </div>
          </div>

          {loadingComments ? (
            <div className="text-center py-12 text-slate-400 text-sm">Cargando comentarios de tus redes...</div>
          ) : commentsData ? (
            <div className="space-y-6">
              {/* Tarjetas resumen */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Comentarios Leídos</span>
                  <p className="text-2xl font-black text-white mt-1">{commentsData.summaryCounts.total}</p>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-xs font-semibold text-emerald-400 uppercase">Buenos / Elogios</span>
                  <p className="text-2xl font-black text-emerald-400 mt-1">{commentsData.summaryCounts.positive}</p>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-xs font-semibold text-amber-400 uppercase">Ocultados Solos</span>
                  <p className="text-2xl font-black text-amber-400 mt-1">{commentsData.summaryCounts.autoHidden}</p>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-xs font-semibold text-rose-400 uppercase">Quejas para Atender</span>
                  <p className="text-2xl font-black text-rose-400 mt-1">{commentsData.summaryCounts.complaints}</p>
                </div>
              </div>

              {/* SECCIÓN 2: OCULTADOS AUTOMÁTICAMENTE (AVISO PERMANENTE REVERSIBLE) */}
              {commentsData.autoHiddenComments.length > 0 && (
                <div className="p-5 bg-amber-950/40 border border-amber-800/80 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                    <ShieldAlert className="w-5 h-5 text-amber-400" />
                    <span>Comentarios ocultados automáticamente ({commentsData.autoHiddenComments.length})</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Se ocultaron en la red por insultos, spam o datos personales. Nadie más los ve, pero si la máquina se equivocó podés devolverlos con un toque.
                  </p>
                  <div className="space-y-3">
                    {commentsData.autoHiddenComments.map((c) => (
                      <div key={c.id} className="p-4 bg-slate-950/90 border border-amber-900/50 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="space-y-1 max-w-2xl">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-amber-300">{c.authorName}</span>
                            <span className="text-slate-500">• {c.network}</span>
                            <span className="text-slate-500">• {new Date(c.createdAt).toLocaleDateString('es-UY')}</span>
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] font-semibold border border-amber-500/30">
                              {c.autoHiddenReason || 'Ocultado por seguridad'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-200 whitespace-pre-wrap">"{c.text}"</p>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          {c.permalink && (
                            <a
                              href={c.permalink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1"
                            >
                              Ver original <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <button
                            onClick={() => handleRestoreComment(c.id)}
                            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition"
                          >
                            Volver a mostrarlo
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECCIÓN 3: QUEJAS LEGÍTIMAS (AVISAR, NO TOCAR AUTOMÁTICAMENTE) */}
              {commentsData.legitimateComplaints.length > 0 && (
                <div className="p-5 bg-rose-950/40 border border-rose-800/80 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                    <AlertCircle className="w-5 h-5 text-rose-400" />
                    <span>Quejas legítimas de clientes ({commentsData.legitimateComplaints.length})</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Reclamos o inquietudes de clientes reales. NO se ocultaron solos para que vos decidas cómo responder y moderar.
                  </p>
                  <div className="space-y-3">
                    {commentsData.legitimateComplaints.map((c) => (
                      <div key={c.id} className="p-4 bg-slate-950/90 border border-rose-900/50 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="space-y-1 max-w-2xl">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-rose-300">{c.authorName}</span>
                            <span className="text-slate-500">• {c.network}</span>
                            <span className="text-slate-500">• {new Date(c.createdAt).toLocaleDateString('es-UY')}</span>
                          </div>
                          <p className="text-sm text-slate-200 whitespace-pre-wrap">"{c.text}"</p>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          {c.permalink && (
                            <a
                              href={c.permalink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1"
                            >
                              Ver original <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <button
                            onClick={() => handleHideComment(c.id)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition"
                          >
                            Ocultar en la red
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECCIÓN 1: BUENOS / TESTIMONIOS LISTOS PARA MOSTRAR */}
              <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                    <ThumbsUp className="w-5 h-5" />
                    <span>Elogios y comentarios positivos listos para la web</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {commentsData.positiveComments.length} comentarios
                  </span>
                </div>

                {commentsData.positiveComments.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    Aún no hay comentarios clasificados como positivos. Hacé clic en "Traer lo nuevo" para sincronizar.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {commentsData.positiveComments.map((c) => (
                      <div
                        key={c.id}
                        className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-white">{c.authorName}</span>
                            <span className="text-xs text-slate-400 font-medium">{c.network}</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed italic">
                            "{c.text}"
                          </p>
                          {c.sentimentReason && (
                            <p className="text-[11px] text-emerald-400/90">
                              ✓ {c.sentimentReason}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          {c.permalink ? (
                            <a
                              href={c.permalink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 font-medium"
                            >
                              Ver original <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : <span />}

                          {c.isTestimonialApproved ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" /> En la web
                            </span>
                          ) : (
                            <button
                              onClick={() => handlePublishAsTestimonial(c.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition flex items-center gap-1"
                            >
                              <Sparkles className="w-3.5 h-3.5" /> Mostrar en la web
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 bg-slate-950/60 border border-slate-800 rounded-xl text-center space-y-3">
              <MessageCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Comentarios de redes sociales</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Conectá tus cuentas de Facebook, Instagram y YouTube en Ajustes y hacé clic en "Traer lo nuevo" para leer todos los comentarios.
              </p>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA: TU PÁGINA WEB (Bloque 1 - Google Analytics 4) */}
      {activeTab === 'web' && (
        <div className="space-y-6">
          <div className="p-5 md:p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-sky-400" />
                  Tu Página Web (Google Analytics 4)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Visitas reales, fuentes de tráfico, páginas más leídas y cuántos completan el simulador.
                </p>
              </div>

              {/* Selector de período */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                <button
                  onClick={() => handleWebPeriodoChange(7)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    webPeriodo === 7 ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  7 días
                </button>
                <button
                  onClick={() => handleWebPeriodoChange(30)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    webPeriodo === 30 ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  30 días
                </button>
                <button
                  onClick={() => handleWebPeriodoChange(90)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    webPeriodo === 90 ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  90 días
                </button>
              </div>
            </div>

            {loadingWeb ? (
              <div className="text-center py-12 text-slate-400 text-sm">Cargando métricas de Google Analytics...</div>
            ) : websiteAnalytics?.hasCredentials && websiteAnalytics.totalVisitors !== null ? (
              <div className="space-y-6">
                {/* Métricas Principales */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
                    <span className="text-xs font-semibold text-slate-400 uppercase">Visitas Únicas</span>
                    <p className="text-2xl md:text-3xl font-black text-white mt-1">
                      {websiteAnalytics.totalVisitors.toLocaleString('es-UY')}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">en los últimos {webPeriodo} días</p>
                  </div>

                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
                    <span className="text-xs font-semibold text-slate-400 uppercase">Empezaron Simulador</span>
                    <p className="text-2xl md:text-3xl font-black text-amber-400 mt-1">
                      {websiteAnalytics.simulatorFunnel.started}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">visitaron la calculadora</p>
                  </div>

                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
                    <span className="text-xs font-semibold text-slate-400 uppercase">Terminaron Simulador</span>
                    <p className="text-2xl md:text-3xl font-black text-emerald-400 mt-1">
                      {websiteAnalytics.simulatorFunnel.completed}
                    </p>
                    <p className="text-xs text-emerald-400/90 mt-1 font-medium">
                      {websiteAnalytics.simulatorFunnel.completionRatePct}% de conversión
                    </p>
                  </div>
                </div>

                {/* Fuentes de Tráfico y Páginas Más Vistas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* De dónde llegaron */}
                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Target className="w-4 h-4 text-sky-400" />
                      ¿De dónde llegaron a la web?
                    </h3>
                    <div className="space-y-2.5">
                      {websiteAnalytics.sources.map((src) => (
                        <div key={src.source} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-300">{src.source}</span>
                            <span className="text-white font-bold">{src.visitors} ({src.percentage}%)</span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-sky-500 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(5, src.percentage))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Páginas más vistas en criollo */}
                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-400" />
                      Páginas más miradas
                    </h3>
                    <div className="space-y-2">
                      {websiteAnalytics.topPages.map((page, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/40">
                          <span className="text-slate-200 font-medium">{page.label}</span>
                          <span className="text-slate-400 font-bold">{page.views} vistas</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-950/60 border border-slate-800 rounded-xl text-center space-y-3">
                <HelpCircle className="w-8 h-8 text-sky-400 mx-auto" />
                <h3 className="text-base font-bold text-white">Sin dato configurado</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  {websiteAnalytics?.missingCredentialsNote ||
                    'Falta configurar la variable GA4_PROPERTY_ID y credenciales de Google en el servidor para ver el tráfico en vivo.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA: FICHA DE GOOGLE (Bloque 3) */}
      {activeTab === 'google_ficha' && (
        <div className="space-y-6">
          <GoogleBusinessProfileWidget
            rating={kpis.googleRating}
            reviewsCount={kpis.googleReviewsCount}
          />
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
