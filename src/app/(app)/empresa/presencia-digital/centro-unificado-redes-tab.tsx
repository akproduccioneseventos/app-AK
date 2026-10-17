'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type {
  SocialComment,
  AutoReplyRule,
  ExtendedSocialNetwork,
  CommentIntentCategory,
} from '@/types/comentarios-redes';
import type { DigitalPresenceDashboardData } from '@/types/presencia-digital';
import {
  saveAutoReplySettingsAction,
  replyToSocialCommentAction,
  runBatchAutoReplyAction,
  markCommentWhatsAppSentAction,
  createLeadFromCommentAction,
  type CommentsDashboardResponse,
} from '@/app/actions/comentarios-redes';
import { toWhatsAppDigits } from '@/lib/commercial/contact';
import {
  MessageSquare,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  AlertCircle,
  ThumbsUp,
  ExternalLink,
  CheckCircle2,
  MessageCircle,
  Bot,
  Send,
  UserPlus,
  Search,
  Filter,
  Zap,
  Plus,
  Trash2,
  EyeOff,
  Eye,
  Radio,
  PhoneCall,
  SlidersHorizontal,
  Check,
} from 'lucide-react';

interface CentroUnificadoRedesTabProps {
  commentsData: NonNullable<CommentsDashboardResponse['data']> | null;
  loadingComments: boolean;
  syncingComments: boolean;
  platformsStatus: DigitalPresenceDashboardData['platformsStatus'];
  onSyncComments: (full?: boolean) => Promise<void>;
  onRestoreComment: (commentId: string) => Promise<void>;
  onHideComment: (commentId: string) => Promise<void>;
  onPublishAsTestimonial: (commentId: string) => Promise<void>;
  onReloadComments: () => Promise<void>;
  onFeedback: (fb: { success: boolean; message: string }) => void;
}

const DEFAULT_RULES_CLIENT: AutoReplyRule[] = [
  {
    id: 'regla_precios_presupuesto',
    nombre: 'Precios, Costos y Presupuestos',
    keywords: ['precio', 'cuanto', 'cuánto', 'presupuesto', 'valor', 'costo', 'tarifa', 'cotizar', 'info'],
    network: 'Todas',
    respuestaPublica:
      '¡Hola! Qué alegría leerte. Cada fiesta la armamos a medida según tus invitados y lo que quieras sumar; escribinos por WhatsApp o probá nuestro Simulador online y te armamos la propuesta al toque.',
    enviarWhatsApp: true,
    plantillaWhatsApp:
      '¡Hola {autor}! Vi tu comentario en {red} consultando por presupuesto ("{comentario}"). Te escribo de AK Producciones para armarte opciones a medida. ¿Qué fecha aproximada y cantidad de invitados tenés en mente?',
    activa: true,
  },
  {
    id: 'regla_fechas_disponibilidad',
    nombre: 'Disponibilidad de Fechas y Agenda',
    keywords: ['fecha', 'disponible', 'disponibilidad', 'libre', 'agenda', 'reservar', 'sábado', 'sabado', 'lugar'],
    network: 'Todas',
    respuestaPublica:
      '¡Hola! Para revisar la agenda en vivo y confirmar si tenemos libre la fecha que buscás, escribinos directo por WhatsApp y lo miramos juntos ahora mismo.',
    enviarWhatsApp: true,
    plantillaWhatsApp:
      '¡Hola {autor}! Vi tu consulta en {red} por disponibilidad de fecha ("{comentario}"). Contame qué día estás pensando festejar así revisamos ahora mismo la agenda de AK Producciones.',
    activa: true,
  },
  {
    id: 'regla_quince_anos',
    nombre: 'Fiestas de Quince Años',
    keywords: ['quince', 'quinceañera', 'mis quince', 'fiesta de quince', 'cumple de quince'],
    network: 'Todas',
    respuestaPublica:
      '¡Hola! Nos encanta acompañar los Quince con pista LED, DJ, gastronomía, decoración y organización total. Escribinos por WhatsApp y charlamos sobre cómo imaginás tu noche.',
    enviarWhatsApp: true,
    plantillaWhatsApp:
      '¡Hola {autor}! Qué emoción que estén planificando los Quince. Vi tu comentario en {red} y te escribo de AK Producciones para pasarte nuestro simulador y mostrarte todo lo que incluye la fiesta completa.',
    activa: true,
  },
  {
    id: 'regla_casamientos_bodas',
    nombre: 'Casamientos y Bodas',
    keywords: ['boda', 'casamiento', 'novios', 'casarnos', 'civil'],
    network: 'Todas',
    respuestaPublica:
      '¡Felicitaciones! Para armar la propuesta integral de tu casamiento a medida y sin estrés, escribinos por WhatsApp y coordinamos todos los detalles.',
    enviarWhatsApp: true,
    plantillaWhatsApp:
      '¡Hola {autor}! Muchas felicitaciones por el casamiento. Vi tu comentario en {red} y te escribo de AK Producciones para asesorarte con salón, catering y fiesta completa.',
    activa: true,
  },
];

function classifyIntentClient(c: SocialComment): CommentIntentCategory {
  if (c.intentCategory) return c.intentCategory;
  if (c.isInsultOrSpam || c.isAutoHidden) return 'spam';
  if (c.isLegitimateComplaint) return 'reclamo';
  const t = (c.text || '').toLowerCase();
  if (/(precio|cuanto|cuánto|presupuesto|valor|costo|tarifa|cotiz|info|\$)/i.test(t)) {
    return 'precio_presupuesto';
  }
  if (/(fecha|disponible|disponibilidad|libre|agenda|reserv|sábado|sabado)/i.test(t)) {
    return 'fecha_disponibilidad';
  }
  if (c.sentiment === 'positivo') return 'elogio';
  return 'consulta_general';
}

function buildWhatsAppMessageClient(c: SocialComment, rules: AutoReplyRule[]): string {
  const autor = (c.authorName || 'Cliente').replace(/^@/, '');
  const red = c.canalOrigen || c.network;
  const extracto = c.text.length > 90 ? `${c.text.slice(0, 87)}...` : c.text;
  const lower = (c.text || '').toLowerCase();

  const matchingRule = rules.find(
    (r) =>
      r.activa &&
      (r.network === 'Todas' || r.network === red) &&
      r.keywords.some((kw) => kw.trim() && lower.includes(kw.trim().toLowerCase()))
  );

  if (matchingRule?.plantillaWhatsApp) {
    return matchingRule.plantillaWhatsApp
      .replace(/\{autor\}/gi, autor)
      .replace(/\{red\}/gi, red)
      .replace(/\{comentario\}/gi, extracto);
  }

  return `¡Hola ${autor}! Vi tu comentario en ${red} ("${extracto}"). Te escribo de AK Producciones para asesorarte a medida y pasarte nuestro Simulador de fiestas. ¿Para qué fecha aproximada estás averiguando?`;
}

export function CentroUnificadoRedesTab({
  commentsData,
  loadingComments,
  syncingComments,
  platformsStatus,
  onSyncComments,
  onRestoreComment,
  onHideComment,
  onPublishAsTestimonial,
  onReloadComments,
  onFeedback,
}: CentroUnificadoRedesTabProps) {
  // Sincronización en tiempo real
  const [liveSyncEnabled, setLiveSyncEnabled] = useState<boolean>(true);
  const [liveSyncSeconds, setLiveSyncSeconds] = useState<number>(30);
  const [lastLiveTick, setLastLiveTick] = useState<string>(() =>
    new Date().toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  // Filtros de la Tabla Maestra Unificada
  const [networkFilter, setNetworkFilter] = useState<string>('Todas');
  const [statusFilter, setStatusFilter] = useState<
    | 'todos'
    | 'preguntas_precios'
    | 'pendientes'
    | 'respondidos_auto'
    | 'whatsapp_enviado'
    | 'positivos'
    | 'quejas'
    | 'ocultados'
  >('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Contestaciones automáticas y reglas
  const [showRulesPanel, setShowRulesPanel] = useState<boolean>(false);
  const [autoReplyActive, setAutoReplyActive] = useState<boolean>(false);
  const [whatsappEmpresa, setWhatsappEmpresa] = useState<string>('098355530');
  const [rules, setRules] = useState<AutoReplyRule[]>(DEFAULT_RULES_CLIENT);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [runningBatch, setRunningBatch] = useState<boolean>(false);

  // Nueva regla
  const [newRuleName, setNewRuleName] = useState<string>('');
  const [newRuleKeywords, setNewRuleKeywords] = useState<string>('');
  const [newRuleReply, setNewRuleReply] = useState<string>('');
  const [newRuleWaTemplate, setNewRuleWaTemplate] = useState<string>('');

  // Acciones por fila en la tabla
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null);
  const [openReplyInputId, setOpenReplyInputId] = useState<string | null>(null);
  const [customReplyTexts, setCustomReplyTexts] = useState<Record<string, string>>({});
  const [phoneInputs, setPhoneInputs] = useState<Record<string, string>>({});
  const [creatingLeadId, setCreatingLeadId] = useState<string | null>(null);

  useEffect(() => {
    if (commentsData?.autoReplySettings) {
      setAutoReplyActive(commentsData.autoReplySettings.activo);
      if (commentsData.autoReplySettings.whatsappNumero) {
        setWhatsappEmpresa(commentsData.autoReplySettings.whatsappNumero);
      }
      if (
        Array.isArray(commentsData.autoReplySettings.reglas) &&
        commentsData.autoReplySettings.reglas.length > 0
      ) {
        setRules(commentsData.autoReplySettings.reglas);
      }
      if (commentsData.autoReplySettings.sincronizacionTiempoRealSegundos) {
        setLiveSyncSeconds(commentsData.autoReplySettings.sincronizacionTiempoRealSegundos);
      }
    }
  }, [commentsData]);

  // Motor de sincronización en tiempo real (auto-polling limpio)
  useEffect(() => {
    if (!liveSyncEnabled) return;
    const ms = Math.max(15, liveSyncSeconds) * 1000;
    const timer = setInterval(() => {
      setLastLiveTick(
        new Date().toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      onReloadComments();
    }, ms);
    return () => clearInterval(timer);
  }, [liveSyncEnabled, liveSyncSeconds, onReloadComments]);

  const handleToggleAutoReplyMaster = async (nextVal: boolean) => {
    setAutoReplyActive(nextVal);
    setSavingSettings(true);
    try {
      const res = await saveAutoReplySettingsAction({
        activo: nextVal,
        whatsappNumero: whatsappEmpresa,
        reglas: rules,
      });
      if (res.success) {
        onFeedback({
          success: true,
          message: nextVal
            ? '¡Contestador automático 24/7 activado! Responderá consultas en tus redes e invitará al WhatsApp sin inventar precios.'
            : 'Contestador automático en pausa.',
        });
      } else {
        onFeedback({
          success: false,
          message: res.error || 'No se pudo cambiar el estado del contestador automático.',
        });
      }
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveRules = async (updatedRules: AutoReplyRule[]) => {
    setRules(updatedRules);
    setSavingSettings(true);
    try {
      const res = await saveAutoReplySettingsAction({
        activo: autoReplyActive,
        whatsappNumero: whatsappEmpresa,
        sincronizacionTiempoRealSegundos: liveSyncSeconds,
        reglas: updatedRules,
      });
      if (res.success) {
        onFeedback({
          success: true,
          message: 'Reglas de contestación automática y WhatsApp guardadas.',
        });
      } else {
        onFeedback({
          success: false,
          message: res.error || 'No se pudieron guardar las reglas.',
        });
      }
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddRule = async () => {
    if (!newRuleName.trim() || !newRuleKeywords.trim() || !newRuleReply.trim()) {
      onFeedback({
        success: false,
        message: 'Completá nombre, palabras clave y el texto de respuesta pública.',
      });
      return;
    }
    const nueva: AutoReplyRule = {
      id: `regla_${Date.now().toString(36)}`,
      nombre: newRuleName.trim(),
      keywords: newRuleKeywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean),
      network: 'Todas',
      respuestaPublica: newRuleReply.trim(),
      enviarWhatsApp: true,
      plantillaWhatsApp:
        newRuleWaTemplate.trim() ||
        '¡Hola {autor}! Vi tu comentario en {red} ("{comentario}"). Te escribo de AK Producciones para pasarte toda la info a medida.',
      activa: true,
    };
    const nextRules = [nueva, ...rules];
    await handleSaveRules(nextRules);
    setNewRuleName('');
    setNewRuleKeywords('');
    setNewRuleReply('');
    setNewRuleWaTemplate('');
  };

  const handleQuickReply = async (comment: SocialComment, customText?: string) => {
    setReplyingCommentId(comment.id);
    try {
      const res = await replyToSocialCommentAction(comment.id, customText);
      if (res.success) {
        onFeedback({
          success: true,
          message: ('publishedOnNetwork' in res && res.publishedOnNetwork)
            ? `¡Respuesta publicada en ${comment.network} y registrada en la tabla!`
            : `Respuesta lista y registrada para ${comment.authorName}.`,
        });
        setOpenReplyInputId(null);
        await onReloadComments();
      } else {
        onFeedback({
          success: false,
          message: res.error || 'No se pudo responder el comentario.',
        });
      }
    } finally {
      setReplyingCommentId(null);
    }
  };

  const handleBatchAutoReply = async () => {
    setRunningBatch(true);
    try {
      const res = await runBatchAutoReplyAction();
      if (res.success) {
        onFeedback({
          success: true,
          message:
            res.respondidosCount > 0
              ? `¡Listo! Se respondieron ${res.respondidosCount} consultas pendientes con las reglas inteligentes y derivación a WhatsApp.`
              : 'No había consultas nuevas pendientes de contestar.',
        });
        await onReloadComments();
      } else {
        onFeedback({
          success: false,
          message: res.error || 'Error al responder en lote.',
        });
      }
    } finally {
      setRunningBatch(false);
    }
  };

  const handleOpenWhatsAppForComment = async (comment: SocialComment) => {
    const rawPhone = phoneInputs[comment.id] ?? comment.authorPhone ?? '';
    const digits = toWhatsAppDigits(rawPhone);
    const msg = buildWhatsAppMessageClient(comment, rules);
    const url = digits
      ? `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(url, '_blank', 'noopener,noreferrer');

    const res = await markCommentWhatsAppSentAction(comment.id, rawPhone);
    if (res.success) {
      await onReloadComments();
    }
  };

  const handleCreateCrmLead = async (comment: SocialComment) => {
    setCreatingLeadId(comment.id);
    try {
      const rawPhone = phoneInputs[comment.id] ?? comment.authorPhone ?? '';
      const res = await createLeadFromCommentAction(comment.id, rawPhone);
      if (res.success) {
        onFeedback({
          success: true,
          message: res.alreadyExisted
            ? `${comment.authorName} ya estaba cargado en el CRM.`
            : `¡${comment.authorName} fue sumado al CRM como nuevo prospecto desde ${comment.network}!`,
        });
        await onReloadComments();
      } else {
        onFeedback({
          success: false,
          message: res.error || 'No se pudo crear el prospecto en el CRM.',
        });
      }
    } finally {
      setCreatingLeadId(null);
    }
  };

  const allComments = useMemo(() => commentsData?.allComments ?? [], [commentsData]);

  const filteredComments = useMemo(() => {
    return allComments.filter((c) => {
      const red = c.canalOrigen || c.network;
      if (networkFilter !== 'Todas' && red !== networkFilter) return false;

      const intent = classifyIntentClient(c);
      if (statusFilter === 'preguntas_precios') {
        if (
          !c.esPregunta &&
          intent !== 'precio_presupuesto' &&
          intent !== 'fecha_disponibilidad'
        ) {
          return false;
        }
      } else if (statusFilter === 'pendientes') {
        if (c.respuestaAutomatica || c.isAutoHidden || c.isInsultOrSpam) return false;
      } else if (statusFilter === 'respondidos_auto') {
        if (!c.respuestaAutomatica) return false;
      } else if (statusFilter === 'whatsapp_enviado') {
        if (!c.whatsappEnviadoAt) return false;
      } else if (statusFilter === 'positivos') {
        if (c.sentiment !== 'positivo' || c.isAutoHidden) return false;
      } else if (statusFilter === 'quejas') {
        if (!c.isLegitimateComplaint || c.isAutoHidden) return false;
      } else if (statusFilter === 'ocultados') {
        if (!c.isAutoHidden) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchAuthor = (c.authorName || '').toLowerCase().includes(q);
        const matchText = (c.text || '').toLowerCase().includes(q);
        const matchPost = (c.postTitle || '').toLowerCase().includes(q);
        if (!matchAuthor && !matchText && !matchPost) return false;
      }

      return true;
    });
  }, [allComments, networkFilter, statusFilter, searchQuery]);

  // Resumen unificado por red para la tabla superior de sincronización
  const networkTableRows = useMemo(() => {
    const basePlatforms: Array<{
      platform: ExtendedSocialNetwork;
      label: string;
      channelType: string;
    }> = [
      { platform: 'Instagram', label: 'Instagram Oficial', channelType: 'Comentarios + Reels + Bio' },
      { platform: 'Facebook', label: 'Facebook Fanpage', channelType: 'Comentarios + Publicaciones' },
      { platform: 'YouTube', label: 'YouTube Canal AK', channelType: 'Comentarios en Videos/Shorts' },
      { platform: 'TikTok', label: 'TikTok AK', channelType: 'Videos + Derivación a Bio' },
      { platform: 'Google', label: 'Ficha de Google', channelType: 'Opiniones y Presencia Local' },
      { platform: 'WhatsApp', label: 'WhatsApp Comercial', channelType: 'Cierre Directo y Plantillas' },
    ];

    return basePlatforms.map((item) => {
      const statusInfo = platformsStatus.find((p) => p.platform === item.platform);
      const backfill =
        item.platform === 'Facebook' || item.platform === 'Instagram' || item.platform === 'YouTube'
          ? commentsData?.backfillState?.[item.platform]
          : undefined;
      const networkComments = allComments.filter(
        (c) => (c.canalOrigen || c.network) === item.platform
      );
      const repliedCount = networkComments.filter((c) => Boolean(c.respuestaAutomatica)).length;
      const pendingCount = networkComments.filter(
        (c) =>
          !c.respuestaAutomatica &&
          !c.isAutoHidden &&
          !c.isInsultOrSpam &&
          (c.esPregunta ||
            classifyIntentClient(c) === 'precio_presupuesto' ||
            classifyIntentClient(c) === 'fecha_disponibilidad')
      ).length;
      const waDerivedCount = networkComments.filter((c) => Boolean(c.whatsappEnviadoAt)).length;

      return {
        ...item,
        isConnected:
          item.platform === 'WhatsApp' || item.platform === 'Google'
            ? true
            : Boolean(statusInfo?.isConnected || backfill?.lastSyncAt),
        totalComments: networkComments.length,
        repliedCount,
        pendingCount,
        waDerivedCount,
        lastSyncAt: backfill?.lastSyncAt,
        error: backfill?.error,
      };
    });
  }, [platformsStatus, commentsData, allComments]);

  return (
    <div className="space-y-6">
      {/* 1. BARRA MAESTRA DE SINCRONIZACIÓN EN TIEMPO REAL + CONTESTADOR 24/7 */}
      <div className="p-5 md:p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-rose-500/30 rounded-2xl space-y-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span
                  className={`w-2 h-2 rounded-full ${
                    liveSyncEnabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                  }`}
                />
                {liveSyncEnabled ? `Sincronizado en Tiempo Real (${liveSyncSeconds}s)` : 'Modo Manual'}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Último latido: <strong className="text-slate-200">{lastLiveTick}</strong>
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <Radio className="w-6 h-6 text-rose-400" />
              Centro Unificado de Redes, Comentarios, Auto-Respuestas y WhatsApp
            </h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-3xl">
              Todos los comentarios y preguntas de tus redes en una sola tabla en vivo, con contestación automática inteligente (sin inventar precios ni fechas) y pase directo a tu WhatsApp y al CRM.
            </p>
          </div>

          {/* Botonera de Sincronización y Automatización */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setLiveSyncEnabled((v) => !v)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 ${
                liveSyncEnabled
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              {liveSyncEnabled ? 'Tiempo Real: ACTIVO' : 'Activar Tiempo Real'}
            </button>

            <button
              onClick={() => onSyncComments(false)}
              disabled={syncingComments}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingComments ? 'animate-spin' : ''}`} />
              {syncingComments ? 'Sincronizando...' : 'Traer lo nuevo'}
            </button>

            <button
              onClick={() => onSyncComments(true)}
              disabled={syncingComments}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/20 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Historial completo
            </button>
          </div>
        </div>

        {/* Cinta de Control: Contestador Automático 24/7 + Configurar Reglas + Lote */}
        <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                autoReplyActive
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  Contestador Automático Inteligente (Precios, Fechas y Consultas)
                </span>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                    autoReplyActive
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {autoReplyActive ? 'ENCENDIDO 24/7' : 'APAGADO'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Detecta palabras clave (&quot;precio&quot;, &quot;info&quot;, &quot;fecha&quot;, &quot;quince&quot;, &quot;boda&quot;), responde en el comentario público y lleva al cliente a tu WhatsApp ({whatsappEmpresa}).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => handleToggleAutoReplyMaster(!autoReplyActive)}
              disabled={savingSettings}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
                autoReplyActive
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              {autoReplyActive ? 'Pausar Auto-Respuesta' : 'Encender Auto-Respuesta 24/7'}
            </button>

            <button
              onClick={handleBatchAutoReply}
              disabled={runningBatch}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md shadow-amber-500/10 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {runningBatch ? 'Respondiendo...' : 'Responder pendientes ahora'}
            </button>

            <button
              onClick={() => setShowRulesPanel((v) => !v)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {showRulesPanel ? 'Ocultar Reglas' : `Reglas y Plantillas (${rules.length})`}
            </button>
          </div>
        </div>

        {/* PANEL CONFIGURADOR DE REGLAS AUTOMÁTICAS Y PLANTILLAS DE WHATSAPP */}
        {showRulesPanel && (
          <div className="p-5 bg-slate-950 border border-amber-500/30 rounded-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Motor de Reglas por Palabra Clave + Derivación a WhatsApp
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Supera a ManyChat y Metricool: configurá qué contesta la app en público cuando comentan una palabra clave y qué mensaje te deja armado para WhatsApp.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 font-semibold">WhatsApp AK:</label>
                <input
                  type="text"
                  value={whatsappEmpresa}
                  onChange={(e) => setWhatsappEmpresa(e.target.value)}
                  onBlur={() => handleSaveRules(rules)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono w-32"
                  placeholder="098355530"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-4 rounded-xl border space-y-3 transition ${
                    rule.activa
                      ? 'bg-slate-900/90 border-emerald-500/30'
                      : 'bg-slate-900/40 border-slate-800 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const next = rules.map((r) =>
                            r.id === rule.id ? { ...r, activa: !r.activa } : r
                          );
                          handleSaveRules(next);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition ${
                          rule.activa
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {rule.activa ? 'ACTIVA' : 'PAUSADA'}
                      </button>
                      <span className="text-sm font-bold text-white">{rule.nombre}</span>
                    </div>

                    <button
                      onClick={() => {
                        const next = rules.filter((r) => r.id !== rule.id);
                        handleSaveRules(next);
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                      title="Eliminar regla"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {rule.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-md text-[11px] font-semibold"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-[10px] font-bold uppercase text-sky-400 block mb-0.5">
                        Respuesta pública en el comentario:
                      </span>
                      <p className="text-slate-200">{rule.respuestaPublica}</p>
                    </div>
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-emerald-900/40">
                      <span className="text-[10px] font-bold uppercase text-emerald-400 block mb-0.5">
                        Plantilla al pasar a WhatsApp:
                      </span>
                      <p className="text-slate-300">{rule.plantillaWhatsApp}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Crear nueva regla */}
            <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-amber-400" />
                Agregar Nueva Regla Automática
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="Nombre (ej: Consultas por Catering o Decoración)"
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
                <input
                  type="text"
                  value={newRuleKeywords}
                  onChange={(e) => setNewRuleKeywords(e.target.value)}
                  placeholder="Palabras clave separadas por coma (ej: catering, comida, menu, salón)"
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
                <input
                  type="text"
                  value={newRuleReply}
                  onChange={(e) => setNewRuleReply(e.target.value)}
                  placeholder="Respuesta en el comentario (sin precios, invitando a WhatsApp)"
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
                <input
                  type="text"
                  value={newRuleWaTemplate}
                  onChange={(e) => setNewRuleWaTemplate(e.target.value)}
                  placeholder="Plantilla de WhatsApp (opcional, usa {autor}, {red}, {comentario})"
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>
              <button
                onClick={handleAddRule}
                disabled={savingSettings}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Guardar Regla Nueva
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. TABLA DE ESTADO EN VIVO Y SINCRONIZACIÓN DE TODAS LAS REDES */}
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Tabla de Estado y Sincronización por Red Social
            </h3>
            <p className="text-xs text-slate-400">
              Control unificado de conexión, comentarios recibidos, respuestas automáticas y pases a WhatsApp.
            </p>
          </div>
          <Link
            href="/settings/social-connections"
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            Configurar llaves de redes <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="p-3">Red / Canal</th>
                <th className="p-3">Estado en Vivo</th>
                <th className="p-3 text-center">Comentarios Leídos</th>
                <th className="p-3 text-center">Preguntas sin Responder</th>
                <th className="p-3 text-center">Contestados (IA / Reglas)</th>
                <th className="p-3 text-center">Derivados a WhatsApp</th>
                <th className="p-3">Última Sincronización</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/60">
              {networkTableRows.map((row) => (
                <tr key={row.platform} className="hover:bg-slate-900/60">
                  <td className="p-3">
                    <div className="font-bold text-white">{row.label}</div>
                    <div className="text-[11px] text-slate-500">{row.channelType}</div>
                  </td>
                  <td className="p-3">
                    {row.isConnected ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Conectada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        Pendiente en Ajustes
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center font-black text-white">{row.totalComments}</td>
                  <td className="p-3 text-center">
                    {row.pendingCount > 0 ? (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-black rounded-md border border-amber-500/30">
                        {row.pendingCount} pendientes
                      </span>
                    ) : (
                      <span className="text-slate-500">Al día</span>
                    )}
                  </td>
                  <td className="p-3 text-center font-bold text-emerald-400">
                    {row.repliedCount}
                  </td>
                  <td className="p-3 text-center font-bold text-sky-400">
                    {row.waDerivedCount}
                  </td>
                  <td className="p-3 text-[11px] text-slate-400">
                    {row.lastSyncAt
                      ? new Date(row.lastSyncAt).toLocaleString('es-UY')
                      : row.error
                      ? row.error
                      : 'Sincronización lista'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {loadingComments ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          Cargando bandeja y tabla unificada de tus redes...
        </div>
      ) : commentsData ? (
        <div className="space-y-6">
          {/* 3. KPIs DEL CENTRO DE COMENTARIOS Y CONVERSIÓN */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">
                Comentarios Leídos
              </span>
              <p className="text-2xl font-black text-white mt-1">
                {commentsData.summaryCounts.total}
              </p>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[11px] font-semibold text-amber-400 uppercase">
                Preguntas Pendientes
              </span>
              <p className="text-2xl font-black text-amber-400 mt-1">
                {commentsData.summaryCounts.pendingQuestions ?? 0}
              </p>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[11px] font-semibold text-sky-400 uppercase">
                Contestados (Auto/IA)
              </span>
              <p className="text-2xl font-black text-sky-400 mt-1">
                {commentsData.summaryCounts.replied ?? 0}
              </p>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase">
                Buenos / Elogios
              </span>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {commentsData.summaryCounts.positive}
              </p>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[11px] font-semibold text-amber-300 uppercase">
                Ocultados Solos
              </span>
              <p className="text-2xl font-black text-amber-300 mt-1">
                {commentsData.summaryCounts.autoHidden}
              </p>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[11px] font-semibold text-rose-400 uppercase">
                Quejas para Atender
              </span>
              <p className="text-2xl font-black text-rose-400 mt-1">
                {commentsData.summaryCounts.complaints}
              </p>
            </div>
          </div>

          {/* 4. TABLA MAESTRA UNIFICADA DE COMENTARIOS DE TODAS LAS REDES */}
          <div className="p-5 bg-slate-900/95 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-rose-400" />
                  Tabla Unificada de Comentarios, Contestaciones y WhatsApp ({filteredComments.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Filtrá por red o intención, contestá en 1 clic con reglas inteligentes, abrí WhatsApp con el mensaje armado o pasá al cliente al CRM.
                </p>
              </div>

              {/* Buscador en vivo */}
              <div className="relative w-full lg:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por cliente, texto o posteo..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Filtros por Red Social y Estado */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
                {(['Todas', 'Instagram', 'Facebook', 'YouTube'] as const).map((net) => (
                  <button
                    key={net}
                    onClick={() => setNetworkFilter(net)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      networkFilter === net
                        ? 'bg-rose-600 text-white shadow'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {net === 'Todas' ? 'Todas las redes' : net}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {(
                  [
                    { id: 'todos', label: 'Todos' },
                    { id: 'preguntas_precios', label: '🔥 Precios y Fechas' },
                    { id: 'pendientes', label: '⏳ Sin responder' },
                    { id: 'respondidos_auto', label: '🤖 Contestados' },
                    { id: 'whatsapp_enviado', label: '📲 En WhatsApp' },
                    { id: 'positivos', label: '💚 Elogios' },
                    { id: 'quejas', label: '⚠️ Quejas' },
                    { id: 'ocultados', label: '🛡️ Ocultados' },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setStatusFilter(st.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      statusFilter === st.id
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabla Maestra */}
            {filteredComments.length === 0 ? (
              <div className="p-8 bg-slate-950/70 border border-slate-800 rounded-xl text-center space-y-2">
                <p className="text-sm font-bold text-white">
                  No hay comentarios con este filtro ahora mismo
                </p>
                <p className="text-xs text-slate-400">
                  Probá cambiando el filtro arriba o tocá &quot;Traer lo nuevo&quot; para sincronizar con tus redes.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-200">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Red / Fecha</th>
                      <th className="p-3">Cliente / Celular</th>
                      <th className="p-3">Comentario y Publicación</th>
                      <th className="p-3">Intención IA</th>
                      <th className="p-3">Contestación (Automática / Red)</th>
                      <th className="p-3 text-right">Acciones & WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 bg-slate-950/80">
                    {filteredComments.map((c) => {
                      const intent = classifyIntentClient(c);
                      const isReplying = replyingCommentId === c.id;
                      const isReplyBoxOpen = openReplyInputId === c.id;

                      return (
                        <tr
                          key={c.id}
                          className={`hover:bg-slate-900/70 align-top ${
                            c.isAutoHidden ? 'opacity-65 bg-amber-950/10' : ''
                          }`}
                        >
                          {/* Columna 1: Red y Fecha */}
                          <td className="p-3 whitespace-nowrap">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-black border ${
                                c.network === 'Instagram'
                                  ? 'bg-pink-500/15 text-pink-300 border-pink-500/30'
                                  : c.network === 'Facebook'
                                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                  : 'bg-red-500/15 text-red-300 border-red-500/30'
                              }`}
                            >
                              {c.canalOrigen || c.network}
                            </span>
                            <div className="text-[11px] text-slate-400 mt-1">
                              {new Date(c.createdAt).toLocaleDateString('es-UY')}
                            </div>
                            {c.permalink && (
                              <a
                                href={c.permalink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-sky-400 hover:underline inline-flex items-center gap-1 mt-1"
                              >
                                Ver post <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </td>

                          {/* Columna 2: Autor y Teléfono para WhatsApp */}
                          <td className="p-3 min-w-[170px]">
                            <div className="font-bold text-white">{c.authorName}</div>
                            {c.leadCreadoId && (
                              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                                <Check className="w-3 h-3" /> En CRM
                              </span>
                            )}
                            <div className="mt-2">
                              <input
                                type="text"
                                value={phoneInputs[c.id] ?? c.authorPhone ?? ''}
                                onChange={(e) =>
                                  setPhoneInputs((prev) => ({
                                    ...prev,
                                    [c.id]: e.target.value,
                                  }))
                                }
                                placeholder="Celular (ej: 099...)"
                                className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-[11px] text-slate-200 placeholder:text-slate-500 font-mono"
                              />
                            </div>
                          </td>

                          {/* Columna 3: Texto del comentario */}
                          <td className="p-3 max-w-md">
                            <p className="text-xs text-slate-100 whitespace-pre-wrap leading-relaxed">
                              &ldquo;{c.text}&rdquo;
                            </p>
                            {c.postTitle && (
                              <p className="text-[11px] text-slate-500 mt-1 truncate">
                                En: {c.postTitle}
                              </p>
                            )}
                          </td>

                          {/* Columna 4: Intención / Sentimiento */}
                          <td className="p-3 whitespace-nowrap">
                            {intent === 'precio_presupuesto' && (
                              <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-black">
                                💰 Pide Precio / Info
                              </span>
                            )}
                            {intent === 'fecha_disponibilidad' && (
                              <span className="inline-block px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[11px] font-black">
                                📅 Consulta Fecha
                              </span>
                            )}
                            {intent === 'elogio' && (
                              <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                                💚 Elogio / Positivo
                              </span>
                            )}
                            {intent === 'reclamo' && (
                              <span className="inline-block px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-black">
                                ⚠️ Queja Legítima
                              </span>
                            )}
                            {intent === 'spam' && (
                              <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800 text-amber-400 border border-amber-700/40 text-[11px] font-bold">
                                🛡️ Ocultado / Spam
                              </span>
                            )}
                            {intent === 'consulta_general' && (
                              <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-semibold">
                                {c.esPregunta ? '❓ Pregunta' : '💬 Comentario'}
                              </span>
                            )}
                          </td>

                          {/* Columna 5: Contestación */}
                          <td className="p-3 min-w-[240px] max-w-xs">
                            {c.respuestaAutomatica ? (
                              <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/50 rounded-xl space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {c.respuestaAutomatica.modo === 'regla_keyword'
                                      ? `Regla: ${c.respuestaAutomatica.reglaNombre || 'Palabra clave'}`
                                      : c.respuestaAutomatica.modo === 'manual'
                                      ? 'Respondido por vos'
                                      : 'Respondido con IA'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-200 leading-snug">
                                  {c.respuestaAutomatica.texto}
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <button
                                    onClick={() => handleQuickReply(c)}
                                    disabled={isReplying}
                                    className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] rounded-lg transition flex items-center gap-1 disabled:opacity-50"
                                  >
                                    <Zap className="w-3 h-3" />
                                    {isReplying ? 'Enviando...' : 'Auto-Responder (1 Clic)'}
                                  </button>
                                  <button
                                    onClick={() =>
                                      setOpenReplyInputId(isReplyBoxOpen ? null : c.id)
                                    }
                                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] rounded-lg border border-slate-700 transition"
                                  >
                                    Escribir
                                  </button>
                                </div>

                                {isReplyBoxOpen && (
                                  <div className="space-y-1.5 pt-1">
                                    <textarea
                                      rows={2}
                                      value={customReplyTexts[c.id] ?? ''}
                                      onChange={(e) =>
                                        setCustomReplyTexts((prev) => ({
                                          ...prev,
                                          [c.id]: e.target.value,
                                        }))
                                      }
                                      placeholder="Escribí tu respuesta pública..."
                                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                                    />
                                    <button
                                      onClick={() =>
                                        handleQuickReply(c, customReplyTexts[c.id])
                                      }
                                      disabled={isReplying}
                                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg"
                                    >
                                      Publicar respuesta
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Columna 6: Acciones de WhatsApp, CRM y Moderación */}
                          <td className="p-3 text-right whitespace-nowrap">
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenWhatsAppForComment(c)}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow ${
                                  c.whatsappEnviadoAt
                                    ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-700/50 hover:bg-emerald-900'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                }`}
                                title="Abrir WhatsApp con mensaje personalizado listo para enviar"
                              >
                                <PhoneCall className="w-3 h-3" />
                                {c.whatsappEnviadoAt ? 'WhatsApp enviado' : 'Mandar WhatsApp'}
                              </button>

                              <button
                                onClick={() => handleCreateCrmLead(c)}
                                disabled={creatingLeadId === c.id}
                                className="px-2.5 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/30 rounded-lg text-[11px] font-bold transition flex items-center gap-1 disabled:opacity-50"
                                title="Convertir en Prospecto del CRM con 1 clic"
                              >
                                <UserPlus className="w-3 h-3" />
                                {c.leadCreadoId ? 'Ver en CRM' : 'Pasar al CRM'}
                              </button>

                              {c.sentiment === 'positivo' && !c.isTestimonialApproved && (
                                <button
                                  onClick={() => onPublishAsTestimonial(c.id)}
                                  className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                                  title="Publicar como testimonio en la web"
                                >
                                  <Sparkles className="w-3 h-3" /> A la web
                                </button>
                              )}

                              {c.isAutoHidden ? (
                                <button
                                  onClick={() => onRestoreComment(c.id)}
                                  className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" /> Mostrar
                                </button>
                              ) : (
                                <button
                                  onClick={() => onHideComment(c.id)}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-700 transition"
                                  title="Ocultar comentario en la red"
                                >
                                  <EyeOff className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 5. SECCIONES CLÁSICAS DE MODERACIÓN Y TESTIMONIOS */}
          {commentsData.autoHiddenComments.length > 0 && (
            <div className="p-5 bg-amber-950/40 border border-amber-800/80 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <span>
                  Comentarios ocultados automáticamente ({commentsData.autoHiddenComments.length})
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Se ocultaron en la red por insultos, spam o datos personales. Nadie más los ve, pero si la máquina se equivocó podés devolverlos con un toque.
              </p>
              <div className="space-y-3">
                {commentsData.autoHiddenComments.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 bg-slate-950/90 border border-amber-900/50 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-amber-300">{c.authorName}</span>
                        <span className="text-slate-500">• {c.network}</span>
                        <span className="text-slate-500">
                          • {new Date(c.createdAt).toLocaleDateString('es-UY')}
                        </span>
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] font-semibold border border-amber-500/30">
                          {c.autoHiddenReason || 'Ocultado por seguridad'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-200 whitespace-pre-wrap">&ldquo;{c.text}&rdquo;</p>
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
                        onClick={() => onRestoreComment(c.id)}
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

          {commentsData.legitimateComplaints.length > 0 && (
            <div className="p-5 bg-rose-950/40 border border-rose-800/80 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                <AlertCircle className="w-5 h-5 text-rose-400" />
                <span>
                  Quejas legítimas de clientes ({commentsData.legitimateComplaints.length})
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Reclamos o inquietudes de clientes reales. NO se ocultaron solos para que vos decidas cómo responder y moderar.
              </p>
              <div className="space-y-3">
                {commentsData.legitimateComplaints.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 bg-slate-950/90 border border-rose-900/50 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-rose-300">{c.authorName}</span>
                        <span className="text-slate-500">• {c.network}</span>
                        <span className="text-slate-500">
                          • {new Date(c.createdAt).toLocaleDateString('es-UY')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-200 whitespace-pre-wrap">&ldquo;{c.text}&rdquo;</p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        onClick={() => handleOpenWhatsAppForComment(c)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-1"
                      >
                        <PhoneCall className="w-3 h-3" /> Atender por WhatsApp
                      </button>
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
                        onClick={() => onHideComment(c.id)}
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

          {/* Elogios y comentarios positivos listos para mostrar */}
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
                Aún no hay comentarios clasificados como positivos. Hacé clic en &quot;Traer lo nuevo&quot; para sincronizar.
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
                        &ldquo;{c.text}&rdquo;
                      </p>
                      {c.sentimentReason && (
                        <p className="text-[11px] text-emerald-400/90">✓ {c.sentimentReason}</p>
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
                      ) : (
                        <span />
                      )}

                      {c.isTestimonialApproved ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> En la web
                        </span>
                      ) : (
                        <button
                          onClick={() => onPublishAsTestimonial(c.id)}
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
            Conectá tus cuentas de Facebook, Instagram y YouTube en Ajustes y hacé clic en &quot;Traer lo nuevo&quot; para leer todos los comentarios.
          </p>
        </div>
      )}
    </div>
  );
}
