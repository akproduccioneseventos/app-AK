'use server';

import type { SocialPlatform, SocialPost } from '@/types/social-media';
import { readData, writeData } from '@/lib/data-service';
import { requirePermiso } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';
import { assertHistoryPlatform, parseHistoricalSocialArchive } from '@/lib/social-media/history-import';
import { fetchAllYouTubeHistory } from '@/lib/social-media/youtube-history';

const POSTS_FILE = 'social-posts.json';

export interface SocialHistoryImportResponse {
  success: boolean;
  imported: number;
  skipped: number;
  scannedFiles: number;
  oldestDate?: string;
  newestDate?: string;
  warnings?: string[];
  error?: string;
}

export interface SocialHistorySummary {
  totalHistorical: number;
  oldestDate?: string;
  newestDate?: string;
  byPlatform: Partial<Record<SocialPlatform, number>>;
}

function sameHistoricalPost(a: SocialPost, b: SocialPost): boolean {
  if (a.contentHash && b.contentHash && a.contentHash === b.contentHash) return true;
  if (a.sourceId && b.sourceId && a.platform === b.platform && a.sourceId === b.sourceId) return true;
  if (a.sourceUrl && b.sourceUrl && a.platform === b.platform && a.sourceUrl === b.sourceUrl) return true;
  return false;
}

async function persistNewHistoricalPosts(candidates: SocialPost[]): Promise<{ imported: SocialPost[]; skipped: number }> {
  const existing = await readData<SocialPost[]>(POSTS_FILE, []);
  const accepted: SocialPost[] = [];
  let skipped = 0;

  for (const candidate of candidates) {
    const duplicate = existing.some((post) => sameHistoricalPost(post, candidate))
      || accepted.some((post) => sameHistoricalPost(post, candidate));
    if (duplicate) {
      skipped += 1;
      continue;
    }
    accepted.push(candidate);
  }

  if (accepted.length) {
    await writeData(
      POSTS_FILE,
      [...existing, ...accepted],
      (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime(),
    );
  }
  return { imported: accepted, skipped };
}

function responseFromPosts(imported: SocialPost[], skipped: number, scannedFiles: number, warnings?: string[]): SocialHistoryImportResponse {
  const dates = imported.map((post) => post.publishDate).sort();
  return {
    success: true,
    imported: imported.length,
    skipped,
    scannedFiles,
    oldestDate: dates[0],
    newestDate: dates[dates.length - 1],
    warnings,
  };
}

export async function importSocialHistory(formData: FormData): Promise<SocialHistoryImportResponse> {
  const permiso = await requirePermiso(PERMISOS.CRM);
  if (!permiso.ok) {
    return { success: false, imported: 0, skipped: 0, scannedFiles: 0, error: permiso.error };
  }

  try {
    const platformValue = String(formData.get('platform') || '');
    assertHistoryPlatform(platformValue);
    const platform = platformValue as SocialPlatform;
    const file = formData.get('archive');
    if (!(file instanceof File)) {
      return { success: false, imported: 0, skipped: 0, scannedFiles: 0, error: 'Seleccioná el archivo oficial de la red social.' };
    }

    const parsed = await parseHistoricalSocialArchive(file, platform);
    if (!parsed.posts.length) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        scannedFiles: parsed.scannedFiles,
        warnings: parsed.warnings,
        error: 'No encontré publicaciones reconocibles en ese archivo. Revisá que sea la exportación de publicaciones de la cuenta.',
      };
    }

    const saved = await persistNewHistoricalPosts(parsed.posts);
    return responseFromPosts(saved.imported, saved.skipped, parsed.scannedFiles, parsed.warnings);
  } catch (error) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      scannedFiles: 0,
      error: error instanceof Error ? error.message : 'No se pudo importar el historial.',
    };
  }
}

export async function syncYouTubeHistory(): Promise<SocialHistoryImportResponse> {
  const permiso = await requirePermiso(PERMISOS.CRM);
  if (!permiso.ok) {
    return { success: false, imported: 0, skipped: 0, scannedFiles: 0, error: permiso.error };
  }

  try {
    const posts = await fetchAllYouTubeHistory();
    const saved = await persistNewHistoricalPosts(posts);
    return responseFromPosts(saved.imported, saved.skipped, 1);
  } catch (error) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      scannedFiles: 0,
      error: error instanceof Error ? error.message : 'No se pudo sincronizar YouTube.',
    };
  }
}

export async function getSocialHistorySummary(): Promise<SocialHistorySummary> {
  const permiso = await requirePermiso(PERMISOS.CRM);
  if (!permiso.ok) return { totalHistorical: 0, byPlatform: {} };

  const posts = await readData<SocialPost[]>(POSTS_FILE, []);
  const historical = posts.filter((post) => post.status === 'Importado historial' || Boolean(post.importBatchId));
  const byPlatform: Partial<Record<SocialPlatform, number>> = {};
  for (const post of historical) byPlatform[post.platform] = (byPlatform[post.platform] || 0) + 1;

  const dates = historical.map((post) => post.publishDate).filter(Boolean).sort();
  return {
    totalHistorical: historical.length,
    oldestDate: dates[0],
    newestDate: dates[dates.length - 1],
    byPlatform,
  };
}
