import 'server-only';

import type { SocialPlatform, SocialPost } from '@/types/social-media';
import history2019 from '@/data/social-history-recovered/2019.json';
import history2020 from '@/data/social-history-recovered/2020.json';
import history2021 from '@/data/social-history-recovered/2021.json';
import history2022 from '@/data/social-history-recovered/2022.json';
import history2023 from '@/data/social-history-recovered/2023.json';
import history2024 from '@/data/social-history-recovered/2024.json';
import history2025 from '@/data/social-history-recovered/2025.json';
import history2026 from '@/data/social-history-recovered/2026.json';

type PublicRecoveredRecord = {
  platform: string;
  date: string;
  confidence: string;
  label: string;
  text?: string;
  category?: string;
  eventName?: string;
  sourceUrl?: string;
  source?: string;
};

const RAW_PUBLIC_HISTORY: PublicRecoveredRecord[] = [
  ...history2019,
  ...history2020,
  ...history2021,
  ...history2022,
  ...history2023,
  ...history2024,
  ...history2025,
  ...history2026,
];

function normalizePublicDate(value: string): string {
  if (/^\d{4}$/.test(value)) return `${value}-01-01T12:00:00.000Z`;
  if (/^\d{4}-\d{2}$/.test(value)) return `${value}-01T12:00:00.000Z`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T12:00:00.000Z`;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '1970-01-01T00:00:00.000Z' : parsed.toISOString();
}

function isSocialPlatform(value: string): value is SocialPlatform {
  return ['Facebook', 'Instagram', 'Threads', 'TikTok', 'YouTube', 'X', 'WhatsApp'].includes(value);
}

export function getPublicRecoveredHistory(): SocialPost[] {
  return RAW_PUBLIC_HISTORY.flatMap((record, index): SocialPost[] => {
    if (!isSocialPlatform(record.platform)) return [];
    const publishDate = normalizePublicDate(record.date);
    const sourceId = `public_recovered_${publishDate.slice(0, 10)}_${index}`;
    const text = record.text?.trim() || record.label;
    return [{
      id: sourceId,
      platform: record.platform,
      isGeneralCampaign: !record.eventName,
      eventName: record.eventName,
      publishDate,
      text,
      link: record.sourceUrl,
      sourceUrl: record.sourceUrl,
      sourceId,
      sourceFile: `public-index:${record.source || 'manual-recovery'}`,
      importBatchId: `public-recovery-${publishDate.slice(0, 4)}`,
      contentHash: sourceId,
      status: 'Importado historial',
      createdAt: publishDate,
      updatedAt: publishDate,
    }];
  });
}

export function getPublicRecoveredHistoryCount(): number {
  return RAW_PUBLIC_HISTORY.length;
}
