
// YouTube entra aca porque las tablas de colores e iconos del calendario ya lo
// tienen: sin sumarlo al tipo, las dos propuestas juntas no compilaban.
export type SocialPlatform = 'Facebook' | 'Instagram' | 'TikTok' | 'WhatsApp' | 'YouTube' | 'Threads' | 'X';
export type PostStatus = 'Programado' | 'Publicado' | 'Importado de IG' | 'Borrador';

export interface PostPerformance {
    likes?: number;
    views?: number;
    interactions?: number;
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
}

export type NewSocialPostData = Omit<SocialPost, 'id' | 'createdAt' | 'updatedAt' | 'mediaUrl' | 'mediaType'> & {
    mediaFile?: File; // For handling upload
};
