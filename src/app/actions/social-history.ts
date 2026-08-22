'use server';

import type { SocialPlatform, SocialPost } from '@/types/social-media';
import { readData, writeData } from '@/lib/data-service';
import { requirePermiso } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';
import { assertHistoryPlatform, parseHistoricalSocialArchive } from '@/lib/social-media/history-import';
import { syncMetaPublicHistory, type MetaHistoryBackfillResult } from '@/lib/social-media/meta-history-backfill';
import { syncYouTubePublicHistory, type YouTubeHistoryResult } from '@/lib/social-media/youtube-history-backfill';

const POSTS_FILE = 'social-posts.json';
const META_STATE_FILE = 'meta-public-history-backfill.json';
const YOUTUBE_STATE_FILE = 'youtube-public-history-backfill.json';

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

export interface PlatformHistoryDetail {
  platform: SocialPlatform;
  total: number;
  oldestDate?: string;
  newestDate?: string;
  lastSyncAt?: string;
  isComplete: boolean;
  error?: string;
}

export interface SocialHistorySummary {
  totalHistorical: number;
  oldestDate?: string;
  newestDate?: string;
  byPlatform: Partial<Record<SocialPlatform, number>>;
  platforms: PlatformHistoryDetail[];
}

export interface SincronizarHistorialRedesResponse {
  success: boolean;
  totalImportadas: number;
  totalActualizadas: number;
  totalLeidas: number;
  mensaje: string;
  detallesPorRed: {
    red: string;
    traidas: number;
    importadas: number;
    completo: boolean;
    fechaMasVieja?: string;
    fechaMasNueva?: string;
    error?: string;
  }[];
  error?: string;
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
        error: `No encontré publicaciones reconocibles en ese archivo. Fijate que sea la exportación de publicaciones de ${platform}.`,
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

export async function getSocialHistorySummary(): Promise<SocialHistorySummary> {
  const permiso = await requirePermiso(PERMISOS.CRM);
  if (!permiso.ok) return { totalHistorical: 0, byPlatform: {}, platforms: [] };

  const [posts, metaState, youtubeState] = await Promise.all([
    readData<SocialPost[]>(POSTS_FILE, []),
    readData<any>(META_STATE_FILE, null),
    readData<any>(YOUTUBE_STATE_FILE, null),
  ]);

  const byPlatform: Partial<Record<SocialPlatform, number>> = {};
  const datesByPlatform: Partial<Record<SocialPlatform, string[]>> = {};

  for (const post of posts) {
    if (!post.platform) continue;
    byPlatform[post.platform] = (byPlatform[post.platform] || 0) + 1;
    if (post.publishDate) {
      if (!datesByPlatform[post.platform]) datesByPlatform[post.platform] = [];
      datesByPlatform[post.platform]!.push(post.publishDate);
    }
  }

  const allDates = posts.map((post) => post.publishDate).filter(Boolean).sort();

  const monitoredPlatforms: SocialPlatform[] = ['Instagram', 'YouTube', 'Facebook'];
  const platforms: PlatformHistoryDetail[] = monitoredPlatforms.map((plat) => {
    const dates = (datesByPlatform[plat] || []).sort();
    let lastSyncAt: string | undefined;
    let isComplete = false;
    let error: string | undefined;

    if (plat === 'Instagram') {
      const igState = metaState?.platforms?.Instagram;
      lastSyncAt = igState?.lastAttemptAt || igState?.lastFullSyncAt;
      isComplete = Boolean(igState?.lastFullSyncAt && !igState?.error);
      error = igState?.error;
    } else if (plat === 'Facebook') {
      const fbState = metaState?.platforms?.Facebook;
      lastSyncAt = fbState?.lastAttemptAt || fbState?.lastFullSyncAt;
      isComplete = Boolean(fbState?.lastFullSyncAt && !fbState?.error);
      error = fbState?.error;
    } else if (plat === 'YouTube') {
      lastSyncAt = youtubeState?.lastAttemptAt || youtubeState?.lastFullSyncAt;
      isComplete = Boolean(youtubeState?.complete && !youtubeState?.error);
      error = youtubeState?.error;
    }

    return {
      platform: plat,
      total: byPlatform[plat] || 0,
      oldestDate: dates[0],
      newestDate: dates[dates.length - 1],
      lastSyncAt,
      isComplete,
      error,
    };
  });

  return {
    totalHistorical: posts.length,
    oldestDate: allDates[0],
    newestDate: allDates[allDates.length - 1],
    byPlatform,
    platforms,
  };
}

export async function sincronizarHistorialRedesAction(options?: {
  forceFull?: boolean;
}): Promise<SincronizarHistorialRedesResponse> {
  const permiso = await requirePermiso(PERMISOS.CRM);
  if (!permiso.ok) {
    return {
      success: false,
      totalImportadas: 0,
      totalActualizadas: 0,
      totalLeidas: 0,
      mensaje: permiso.error || 'No tenés permisos para sincronizar redes.',
      detallesPorRed: [],
      error: permiso.error,
    };
  }

  try {
    const [historialMeta, historialYouTube] = await Promise.all([
      syncMetaPublicHistory({ forceFull: options?.forceFull ?? true }).catch((err): MetaHistoryBackfillResult => ({
        success: false,
        earliestDate: '2019-09-01T00:00:00.000Z',
        fetched: 0,
        imported: 0,
        updated: 0,
        platforms: [
          {
            platform: 'Instagram' as const,
            mode: 'skipped' as const,
            fetched: 0,
            imported: 0,
            updated: 0,
            oldestDate: undefined,
            newestDate: undefined,
            complete: false,
            error: err instanceof Error ? err.message : 'Error en Meta',
          },
        ],
      })),
      syncYouTubePublicHistory().catch((err): YouTubeHistoryResult => ({
        success: false,
        mode: 'rss' as const,
        channelId: 'UClq6YnypA9PFuBgunzk306A',
        fetched: 0,
        imported: 0,
        updated: 0,
        complete: false,
        oldestDate: undefined,
        newestDate: undefined,
        error: err instanceof Error ? err.message : 'Error en YouTube',
      })),
    ]);

    const detallesPorRed = [
      ...historialMeta.platforms.map((p) => ({
        red: p.platform,
        traidas: p.fetched,
        importadas: p.imported,
        completo: p.complete,
        fechaMasVieja: p.oldestDate,
        fechaMasNueva: p.newestDate,
        error: p.error,
      })),
      {
        red: 'YouTube',
        traidas: historialYouTube.fetched,
        importadas: historialYouTube.imported,
        completo: historialYouTube.complete,
        fechaMasVieja: historialYouTube.oldestDate,
        fechaMasNueva: historialYouTube.newestDate,
        error: historialYouTube.error,
      },
    ];

    const totalImportadas = (historialMeta.imported || 0) + (historialYouTube.imported || 0);
    const totalActualizadas = (historialMeta.updated || 0) + (historialYouTube.updated || 0);
    const totalLeidas = (historialMeta.fetched || 0) + (historialYouTube.fetched || 0);

    const algunaFalla = detallesPorRed.some((d) => d.error && d.traidas === 0);

    let mensaje = `Sincronización finalizada: se leyeron ${totalLeidas} publicaciones (${totalImportadas} nuevas guardadas, ${totalActualizadas} actualizadas).`;
    if (algunaFalla) {
      const redesConError = detallesPorRed.filter((d) => d.error).map((d) => d.red).join(', ');
      mensaje += ` Hubo advertencias en: ${redesConError}.`;
    }

    return {
      success: true,
      totalImportadas,
      totalActualizadas,
      totalLeidas,
      mensaje,
      detallesPorRed,
    };
  } catch (err: any) {
    return {
      success: false,
      totalImportadas: 0,
      totalActualizadas: 0,
      totalLeidas: 0,
      mensaje: err?.message || 'No se pudo completar la sincronización.',
      detallesPorRed: [],
      error: err?.message,
    };
  }
}
