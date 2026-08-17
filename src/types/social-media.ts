export type SocialPlatform =
    | 'Facebook'
    | 'Instagram'
    | 'Threads'
    | 'TikTok'
    | 'YouTube'
    | 'X'
    | 'WhatsApp';

export type PostStatus =
    | 'Programado'
    | 'Publicado'
    | 'Importado de IG'
    | 'Importado historial'
    | 'Borrador';

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
    publishDate: string; // ISO Date String used for sorting
    /** Precision of a recovered date: exact/day/month/year/unknown. */
    dateConfidence?: string;
    /** Human-readable original date value when a public source only exposed partial timing. */
    sourceDateLabel?: string;
    text: string;
    link?: string; // Optional link for the post
    mediaUrl?: string; // Path or public URL to the uploaded image/video
    mediaType?: 'image' | 'video'; // To know how to render the media
    status: PostStatus;
    promotionCost?: number;
    performance?: PostPerformance;
    /** Stable identifier supplied by the original social network/export. */
    sourceId?: string;
    /** Original permalink when the archive provides one. */
    sourceUrl?: string;
    /** Relative media path inside an official export when the asset itself is not persisted. */
    archiveMediaPath?: string;
    /** File in the official export that produced this record. */
    sourceFile?: string;
    /** Import batch used to audit or undo a historical load. */
    importBatchId?: string;
    /** Hash used to avoid importing the same publication twice. */
    contentHash?: string;
    /** Groups the same creative/copy published across more than one platform. */
    crossPlatformGroupId?: string;
    importedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export type NewSocialPostData = Omit<SocialPost, 'id' | 'createdAt' | 'updatedAt' | 'mediaUrl' | 'mediaType'> & {
    mediaFile?: File; // For handling upload
};
