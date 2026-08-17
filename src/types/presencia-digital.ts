export type PlatformName = 'Instagram' | 'Facebook' | 'TikTok' | 'Google' | 'YouTube' | 'WhatsApp';

export interface DailySocialMetricSnapshot {
  date: string; // YYYY-MM-DD
  platform: PlatformName;
  followers: number;
  reach: number;
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

export interface DigitalPresenceDashboardData {
  kpis: {
    totalFollowers: number;
    followersWeeklyChange: number;
    weeklyReach: number;
    reachWeeklyChangePct: number;
    activeAdSpendMonth: number;
    signedPartiesFromAds: number;
    averageCostPerSignedParty: number | null;
    pendingApprovalPostsCount: number;
    googleRating: number;
    googleReviewsCount: number;
  };
  commercialAdsRoi: CampaignCommercialRoi[];
  review: DigitalPresenceReview | null;
  recentHistory: DailySocialMetricSnapshot[];
  platformsStatus: Array<{
    platform: PlatformName;
    isConnected: boolean;
    username?: string;
    followers: number;
    daysWithoutPost: number;
    canAutoPublish: boolean;
    publishNote?: string;
  }>;
}
