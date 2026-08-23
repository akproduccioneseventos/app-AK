
// Google, YouTube, Threads, X y Pinterest entran acá porque las tablas de colores e iconos del calendario
// y el centro de redes los tienen: sin sumarlos al tipo, no compila.
export type SocialPlatform = 'Facebook' | 'Instagram' | 'Google' | 'TikTok' | 'WhatsApp' | 'YouTube' | 'Threads' | 'X' | 'Pinterest';
export type PostStatus = 'Programado' | 'Publicado' | 'Importado de IG' | 'Importado historial' | 'Borrador' | 'Falló' | 'Listo para copiar' | 'Error';

export interface PostPerformance {
    likes?: number;
    views?: number;
    interactions?: number;
    comments?: number;
    shares?: number;
    saves?: number;
}

export interface SocialPost {
    id: string;
    platform: SocialPlatform;
    isGeneralCampaign: boolean; // true for general, false for event-specific
    eventId?: string; // Link to a FiestaEnPlanificacion ID
    eventName?: string; // Denormalized for easy display
    publishDate: string; // ISO Date String
    text: string;
    link?: string; // Optional link for the post
    mediaUrl?: string; // Path to the uploaded image/video
    mediaType?: 'image' | 'video'; // To know how to render the media
    status: PostStatus;
    promotionCost?: number;
    performance?: PostPerformance;
    createdAt: string;
    updatedAt: string;
    // Campos opcionales para memoria histórica y desduplicación
    sourceId?: string;
    sourceUrl?: string;
    sourceFile?: string;
    importBatchId?: string;
    contentHash?: string;
    crossPlatformGroupId?: string;
    archiveMediaPath?: string;
    importedAt?: string;
    // Control de reintentos y errores para cron de programación
    retryCount?: number;
    lastError?: string;
    lastAttemptAt?: string;
}

export type NewSocialPostData = Omit<SocialPost, 'id' | 'createdAt' | 'updatedAt' | 'mediaUrl' | 'mediaType'> & {
    mediaFile?: File; // For handling upload
};

