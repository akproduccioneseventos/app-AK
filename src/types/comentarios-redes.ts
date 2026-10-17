export type CommentNetwork = 'Facebook' | 'Instagram' | 'YouTube';

export type ExtendedSocialNetwork =
  | CommentNetwork
  | 'TikTok'
  | 'Google'
  | 'WhatsApp'
  | 'Threads'
  | 'X'
  | 'Pinterest';

export type CommentSentiment = 'positivo' | 'neutro' | 'negativo';

export type CommentIntentCategory =
  | 'precio_presupuesto'
  | 'fecha_disponibilidad'
  | 'elogio'
  | 'reclamo'
  | 'consulta_general'
  | 'spam';

export interface AutoReplyRule {
  id: string;
  nombre: string;
  keywords: string[];
  network: ExtendedSocialNetwork | 'Todas';
  /** Texto público que se responde en el comentario (nunca inventa precios ni fechas). */
  respuestaPublica: string;
  /** Si prepara/abre derivación directa a WhatsApp con plantilla personalizada. */
  enviarWhatsApp: boolean;
  /** Plantilla para WhatsApp (soporta {autor}, {red}, {comentario}). */
  plantillaWhatsApp: string;
  activa: boolean;
  usosCount?: number;
}

export interface SocialComment {
  id: string; // ej: fb_123456_com_789
  network: CommentNetwork;
  canalOrigen?: ExtendedSocialNetwork;
  networkCommentId: string;
  postId: string;
  postTitle?: string;
  postUrl?: string;
  authorName: string;
  authorId?: string;
  authorPhone?: string;
  authorProfileUrl?: string;
  text: string;
  createdAt: string; // ISO String
  permalink?: string;

  // Clasificación por IA / Reglas
  sentiment?: CommentSentiment;
  sentimentReason?: string;
  intentCategory?: CommentIntentCategory;
  isInsultOrSpam?: boolean;
  isLegitimateComplaint?: boolean;
  esPregunta?: boolean;
  classifiedAt?: string;

  // Respuesta automática o manual a comentarios
  respuestaAutomatica?: {
    texto: string;
    at: string;
    modo?: 'automatica_ia' | 'regla_keyword' | 'manual';
    reglaId?: string;
    reglaNombre?: string;
  };

  // Seguimiento WhatsApp y CRM
  whatsappEnviadoAt?: string;
  leadCreadoId?: string;

  // Moderación y Estado
  isAutoHidden?: boolean;
  autoHiddenReason?: string;
  autoHiddenAt?: string;
  isManuallyRestored?: boolean;
  manuallyRestoredAt?: string;
  isDeleted?: boolean;

  // Conversión a Testimonio Público
  isTestimonialApproved?: boolean;
  testimonialScreenshotUrl?: string;
  approvedAsTestimonialAt?: string;
}

export interface NetworkCommentsBackfillState {
  accountId?: string;
  lastAttemptAt?: string;
  lastSyncAt?: string;
  fetchedCount: number;
  newCommentsCount: number;
  oldestDate?: string;
  newestDate?: string;
  exhausted: boolean;
  cursor?: string;
  error?: string;
}

export interface CommentsSyncSummary {
  success: boolean;
  totalFetched: number;
  totalNew: number;
  totalAutoHidden: number;
  /** Cuantos se mandaron a la inteligencia artificial en esta corrida. */
  totalClasificados: number;
  /**
   * Cuantos quedaron guardados pero sin revisar, porque se llego al tope de la
   * corrida o porque se acabo el presupuesto de inteligencia artificial. Se
   * toman en la corrida siguiente.
   */
  pendientesDeClasificar: number;
  platforms: Record<CommentNetwork, NetworkCommentsBackfillState>;
  syncedAt: string;
}

