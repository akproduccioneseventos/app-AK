import 'server-only';

import { generateBlogPostAndSocialDraft } from '@/lib/blog-ai-generator';
import { readData, writeData } from '@/lib/data-service';
import { syncInstagramPosts } from '@/app/actions/social-media';
import { MARKETING_AUTOMATION_INTERNAL_TOKEN } from '@/lib/marketing/internal-token';

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
  warning?: string;
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

function hasUsableAiKey(): boolean {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  return Boolean(key && key.trim() && key !== 'dummy');
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
  let seoError: string | undefined;

  if (instagramDue) {
    instagramResult = await syncInstagramPosts(MARKETING_AUTOMATION_INTERNAL_TOKEN);
    if (instagramResult.success) {
      nextState.lastInstagramSyncAt = now.toISOString();
    }
  }

  if (seoDue) {
    if (hasUsableAiKey()) {
      blogResult = await generateBlogPostAndSocialDraft();
      nextState.lastSeoRunAt = now.toISOString();
    } else {
      seoError = 'SEO automatico pendiente: falta una clave valida de Gemini.';
    }
  }

  const instagramFailed = instagramDue && instagramResult?.success === false;
  const instagramSucceeded = instagramDue && instagramResult?.success === true;
  const seoSucceeded = seoDue && Boolean(blogResult);
  const completedJobs = Number(instagramSucceeded) + Number(seoSucceeded);
  const errors = [instagramFailed ? instagramResult?.error : undefined, seoError].filter(
    (message): message is string => Boolean(message)
  );
  const success = completedJobs > 0;

  if (success) {
    await writeData(AUTOMATION_STATE_FILE, nextState, undefined, { skipAutoBackup: true });
  }

  return {
    success,
    skipped: false,
    source,
    ranSeo: seoSucceeded,
    ranInstagram: instagramSucceeded,
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
      seoSucceeded ? 'SEO generado' : '',
      instagramSucceeded ? 'Instagram sincronizado' : '',
      instagramFailed ? 'Instagram pendiente de conexion real' : '',
      seoError ? 'SEO pendiente de configuracion' : '',
    ].filter(Boolean).join(' y ') || 'Marketing automatico al dia.',
    error: success ? undefined : errors.join(' '),
    warning: success && errors.length > 0 ? errors.join(' ') : undefined,
  };
}
