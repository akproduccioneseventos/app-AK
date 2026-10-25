export type PlatformName = 'Instagram' | 'Facebook' | 'TikTok' | 'Google' | 'YouTube' | 'WhatsApp' | 'Pinterest' | 'Threads' | 'X';

export interface DailySocialMetricSnapshot {
  date: string; // YYYY-MM-DD
  platform: PlatformName;
  /**
   * Seguidores y alcance van en `null` mientras no haya de dónde leerlos.
   * Antes se guardaban todos los días con números inventados y una cuenta hecha
   * a ojo, así que el historial de crecimiento que se armaba era falso entero.
   */
  followers: number | null;
  reach: number | null;
  interactions: number;
  postsCount: number;
  adSpend: number;
  leadsCount: number;
  contractsCount: number;
  revenue: number;
  updatedAt: string;
}

export interface SocialHistoryData {
  snapshots: DailySocialMetricSnapshot[];
  lastRunDate?: string;
}

export interface CampaignCommercialRoi {
  campaignId: string;
  campaignName: string;
  platform: string;
  spend: number;
  impressions: number;
  clicks: number;
  leadsCount: number;
  budgetsCount: number;
  conversionsCount: number; // Fiestas firmadas / señadas
  revenue: number;
  costPerParty: number | null; // spend / conversionsCount
  statusText: string;
  recommendation: string;
}

export interface DigitalPresenceReview {
  date: string; // YYYY-MM-DD
  generatedAt: string;
  summary: string;
  topPost: {
    id: string;
    platform: string;
    text: string;
    likes: number;
    interactions: number;
    mediaUrl?: string;
  } | null;
  inactivePlatforms: Array<{
    platform: PlatformName;
    daysWithoutPost: number;
  }>;
  disconnectedPlatforms: string[];
  dailyPostSuggestion: {
    concept: string;
    text: string;
    recommendedPlatform: 'Instagram' | 'Facebook' | 'Multi';
    hashtags: string[];
  };
  aiUsed: boolean;
}

/**
 * Los que pueden venir en `null` es porque **todavía no hay de dónde sacarlos**.
 * Antes venían con un número escrito a mano —1420 seguidores, 4,9 de puntaje,
 * 38 opiniones— que se mostraba igual que los de verdad. El dueño miraba su
 * panel y tomaba decisiones sobre datos inventados.
 *
 * Regla: si no se midió, va `null` y la pantalla dice "sin dato". Un número
 * inventado es peor que un casillero vacío.
 */
export interface DigitalPresenceDashboardData {
  kpis: {
    totalFollowers: number | null;
    followersWeeklyChange: number | null;
    weeklyReach: number | null;
    reachWeeklyChangePct: number | null;
    activeAdSpendMonth: number;
    signedPartiesFromAds: number;
    averageCostPerSignedParty: number | null;
    pendingApprovalPostsCount: number;
    googleRating: number | null;
    googleReviewsCount: number | null;
  };
  commercialAdsRoi: CampaignCommercialRoi[];
  review: DigitalPresenceReview | null;
  recentHistory: DailySocialMetricSnapshot[];
  platformsStatus: Array<{
    platform: PlatformName;
    isConnected: boolean;
    username?: string;
    /** `null` mientras no haya de dónde leerlo de verdad. */
    followers: number | null;
    daysWithoutPost: number;
    canAutoPublish: boolean;
    publishNote?: string;
  }>;
  websiteAnalytics?: import('@/lib/presencia-digital/google-analytics').GoogleAnalyticsDashboardData;
}

export type NetworkAttributionPeriod = '30d' | '90d' | 'year' | 'all';

export interface NetworkAttributionRow {
  network: string; // 'Instagram' | 'Facebook' | 'TikTok' | 'YouTube' | 'WhatsApp' | 'Web / Directo' | 'Otros'
  sourceKey: string;
  consultasCount: number;
  presupuestosCount: number;
  contratadosCount: number;
  totalRevenueUYU: number;
  inactivityNote?: string;
}

export interface NetworkAttributionReport {
  period: NetworkAttributionPeriod;
  periodLabel: string;
  rows: NetworkAttributionRow[];
  totalConsultas: number;
  totalPresupuestos: number;
  totalContratados: number;
  totalRevenueUYU: number;
}

