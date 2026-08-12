import 'server-only';

import { generateBlogPostAndSocialDraft } from '@/lib/blog-ai-generator';
import { readData, writeData } from '@/lib/data-service';
import { syncInstagramPosts } from '@/app/actions/social-media';
import { getWhatsAppSettings } from '@/app/actions/settings';
import { getCrmLeads } from '@/app/actions/crm';
import { processUnbookedLeadsRemarketing, UnbookedLeadRemarketingCandidate } from '@/lib/marketing/whatsapp-remarketing';
import { MARKETING_AUTOMATION_INTERNAL_TOKEN } from '@/lib/marketing/internal-token';

const AUTOMATION_STATE_FILE = 'marketing-automation-state.json';
const SEO_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
const INSTAGRAM_INTERVAL_MS = 6 * 60 * 60 * 1000;
const REMARKETING_INTERVAL_MS = 24 * 60 * 60 * 1000; // Corre una vez por día

interface MarketingAutomationState {
  lastSeoRunAt?: string;
  lastInstagramSyncAt?: string;
  lastRemarketingRunAt?: string;
  lastRunAt?: string;
  updatedAt?: string;
}

export interface MarketingAutomationResult {
  success: boolean;
  skipped: boolean;
  source: 'admin' | 'cron';
  ranSeo: boolean;
  ranInstagram: boolean;
  ranRemarketing: boolean;
  nextSeoAt?: string;
  nextInstagramAt?: string;
  nextRemarketingAt?: string;
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
  remarketing?: {
    processedCount: number;
    sentCount: number;
    failedCount: number;
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
  const includeRemarketing = true; // Por defecto siempre evaluamos si toca
  const force = options?.force === true;

  const state = await readData<MarketingAutomationState>(AUTOMATION_STATE_FILE, {});
  const now = new Date();
  const nowMs = now.getTime();
  const seoDue = includeSeo && (force || isDue(state.lastSeoRunAt, SEO_INTERVAL_MS, nowMs));
  const instagramDue = includeInstagram && (force || isDue(state.lastInstagramSyncAt, INSTAGRAM_INTERVAL_MS, nowMs));
  const remarketingDue = includeRemarketing && (force || isDue(state.lastRemarketingRunAt, REMARKETING_INTERVAL_MS, nowMs));

  const nextSeoAt = state.lastSeoRunAt ? addMs(state.lastSeoRunAt, SEO_INTERVAL_MS) : now.toISOString();
  const nextInstagramAt = state.lastInstagramSyncAt ? addMs(state.lastInstagramSyncAt, INSTAGRAM_INTERVAL_MS) : now.toISOString();
  const nextRemarketingAt = state.lastRemarketingRunAt ? addMs(state.lastRemarketingRunAt, REMARKETING_INTERVAL_MS) : now.toISOString();

  if (!seoDue && !instagramDue && !remarketingDue) {
    return {
      success: true,
      skipped: true,
      source,
      ranSeo: false,
      ranInstagram: false,
      ranRemarketing: false,
      nextSeoAt,
      nextInstagramAt,
      nextRemarketingAt,
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
  let remarketingResult: Awaited<ReturnType<typeof processUnbookedLeadsRemarketing>> | undefined;
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

  if (remarketingDue) {
    const wsSettings = await getWhatsAppSettings();
    if (wsSettings.whatsappRemarketingEnabled) {
      const allLeads = await getCrmLeads();
      const cutoffTime = nowMs - (48 * 60 * 60 * 1000); // 48 hours ago
      
      const candidates: UnbookedLeadRemarketingCandidate[] = allLeads
        .filter(lead => 
          !lead.presupuestoId && // No señó
          lead.createdAt && new Date(lead.createdAt).getTime() < cutoffTime // Más de 48 hs
          // NOTA: Se podría filtrar también por status de que no se le haya enviado remarketing antes
          // pero el pedido es "conectar los cables", podemos mejorarlo luego.
        )
        .map(lead => ({
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          eventType: lead.partyType,
          createdAt: lead.createdAt!,
        }));

      if (candidates.length > 0) {
        remarketingResult = await processUnbookedLeadsRemarketing(candidates);
      } else {
        remarketingResult = { processedCount: 0, sentCount: 0, failedCount: 0, skippedCount: 0, details: [] };
      }
    }
    nextState.lastRemarketingRunAt = now.toISOString();
  }

  const instagramFailed = instagramDue && instagramResult?.success === false;
  const instagramSucceeded = instagramDue && instagramResult?.success === true;
  const seoSucceeded = seoDue && Boolean(blogResult);
  const remarketingSucceeded = remarketingDue && remarketingResult !== undefined;
  const completedJobs = Number(instagramSucceeded) + Number(seoSucceeded) + Number(remarketingSucceeded);
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
    ranRemarketing: remarketingSucceeded,
    nextSeoAt: nextState.lastSeoRunAt ? addMs(nextState.lastSeoRunAt, SEO_INTERVAL_MS) : nextSeoAt,
    nextInstagramAt: nextState.lastInstagramSyncAt ? addMs(nextState.lastInstagramSyncAt, INSTAGRAM_INTERVAL_MS) : nextInstagramAt,
    nextRemarketingAt: nextState.lastRemarketingRunAt ? addMs(nextState.lastRemarketingRunAt, REMARKETING_INTERVAL_MS) : nextRemarketingAt,
    blogPost: blogResult?.blogPost,
    socialPost: blogResult?.socialPost,
    instagram: instagramResult
      ? {
          photosCount: instagramResult.photosCount,
          videosCount: instagramResult.videosCount,
          plannerCount: instagramResult.plannerCount,
        }
      : undefined,
    remarketing: remarketingResult
      ? {
          processedCount: remarketingResult.processedCount,
          sentCount: remarketingResult.sentCount,
          failedCount: remarketingResult.failedCount,
        }
      : undefined,
    message: [
      seoSucceeded ? 'SEO generado' : '',
      instagramSucceeded ? 'Instagram sincronizado' : '',
      remarketingSucceeded ? `Remarketing: ${remarketingResult?.sentCount} enviados` : '',
      instagramFailed ? 'Instagram pendiente de conexion real' : '',
      seoError ? 'SEO pendiente de configuracion' : '',
    ].filter(Boolean).join(' y ') || 'Marketing automatico al dia.',
    error: success ? undefined : errors.join(' '),
    warning: success && errors.length > 0 ? errors.join(' ') : undefined,
  };
}
