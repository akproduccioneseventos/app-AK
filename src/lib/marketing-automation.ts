import 'server-only';

import { generateBlogPostAndSocialDraft } from '@/lib/blog-ai-generator';
import { readData, writeData } from '@/lib/data-service';
import { syncInstagramPosts } from '@/app/actions/social-media';

const AUTOMATION_STATE_FILE = 'marketing-automation-state.json';
const SEO_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
const INSTAGRAM_INTERVAL_MS = 6 * 60 * 60 * 1000;

interface MarketingAutomationState {
  lastSeoRunAt?: string;
  lastInstagramSyncAt?: string;
  lastRunAt?: string;
  updatedAt?: string;
}

export interface MarketingAutomationResult {
  success: boolean;
  skipped: boolean;
  source: 'admin' | 'cron';
  ranSeo: boolean;
  ranInstagram: boolean;
  nextSeoAt?: string;
  nextInstagramAt?: string;
  blogPost?: {
    slug: string;
    title: string;
    category: string;
  };
  socialPost?: {
    id: string;
    platform: string;
  };
  instagram?: {
    photosCount: number;
    videosCount: number;
    plannerCount: number;
  };
  message: string;
  error?: string;
}

function addMs(iso: string | undefined, ms: number) {
  const base = iso ? new Date(iso).getTime() : 0;
  return new Date(base + ms).toISOString();
}

function isDue(lastRunAt: string | undefined, intervalMs: number, nowMs: number) {
  if (!lastRunAt) return true;
  const last = new Date(lastRunAt).getTime();
  if (!Number.isFinite(last)) return true;
  return nowMs - last >= intervalMs;
}

export async function runMarketingAutomation(options?: {
  force?: boolean;
  source?: 'admin' | 'cron';
  includeSeo?: boolean;
  includeInstagram?: boolean;
}): Promise<MarketingAutomationResult> {
  const source = options?.source ?? 'admin';
  const includeSeo = options?.includeSeo !== false;
  const includeInstagram = options?.includeInstagram !== false;
  const force = options?.force === true;

  const state = await readData<MarketingAutomationState>(AUTOMATION_STATE_FILE, {});
  const now = new Date();
  const nowMs = now.getTime();
  const seoDue = includeSeo && (force || isDue(state.lastSeoRunAt, SEO_INTERVAL_MS, nowMs));
  const instagramDue = includeInstagram && (force || isDue(state.lastInstagramSyncAt, INSTAGRAM_INTERVAL_MS, nowMs));

  const nextSeoAt = state.lastSeoRunAt ? addMs(state.lastSeoRunAt, SEO_INTERVAL_MS) : now.toISOString();
  const nextInstagramAt = state.lastInstagramSyncAt ? addMs(state.lastInstagramSyncAt, INSTAGRAM_INTERVAL_MS) : now.toISOString();

  if (!seoDue && !instagramDue) {
    return {
      success: true,
      skipped: true,
      source,
      ranSeo: false,
      ranInstagram: false,
      nextSeoAt,
      nextInstagramAt,
      message: 'Marketing automatico al dia. No habia tareas pendientes.',
    };
  }

  const nextState: MarketingAutomationState = {
    ...state,
    lastRunAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  let blogResult: Awaited<ReturnType<typeof generateBlogPostAndSocialDraft>> | undefined;
  let instagramResult: Awaited<ReturnType<typeof syncInstagramPosts>> | undefined;

  if (instagramDue) {
    instagramResult = await syncInstagramPosts();
    if (!instagramResult.success) {
      return {
        success: false,
        skipped: false,
        source,
        ranSeo: false,
        ranInstagram: false,
        nextSeoAt,
        nextInstagramAt,
        message: 'No se pudo sincronizar Instagram.',
        error: instagramResult.error,
      };
    }
    nextState.lastInstagramSyncAt = now.toISOString();
  }

  if (seoDue) {
    blogResult = await generateBlogPostAndSocialDraft();
    nextState.lastSeoRunAt = now.toISOString();
  }

  await writeData(AUTOMATION_STATE_FILE, nextState, undefined, { skipAutoBackup: true });

  return {
    success: true,
    skipped: false,
    source,
    ranSeo: seoDue,
    ranInstagram: instagramDue,
    nextSeoAt: nextState.lastSeoRunAt ? addMs(nextState.lastSeoRunAt, SEO_INTERVAL_MS) : nextSeoAt,
    nextInstagramAt: nextState.lastInstagramSyncAt ? addMs(nextState.lastInstagramSyncAt, INSTAGRAM_INTERVAL_MS) : nextInstagramAt,
    blogPost: blogResult?.blogPost,
    socialPost: blogResult?.socialPost,
    instagram: instagramResult
      ? {
          photosCount: instagramResult.photosCount,
          videosCount: instagramResult.videosCount,
          plannerCount: instagramResult.plannerCount,
        }
      : undefined,
    message: [
      seoDue ? 'SEO generado' : '',
      instagramDue ? 'Instagram sincronizado' : '',
    ].filter(Boolean).join(' y ') || 'Marketing automatico al dia.',
  };
}
