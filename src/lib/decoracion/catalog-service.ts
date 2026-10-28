import 'server-only';
import { randomUUID } from 'node:crypto';
import { createDataItem, mutateDataItem, readDataConDetalle } from '@/lib/data-service';
import { mutarDocumentoConTransaccion } from '@/lib/generic-json-store';
import { hayPresupuestoParaIA, registrarConsumoIA } from '@/lib/ai/consumo-servidor';
import type { CatalogoFoto } from '@/types/catalogo';
import type { GaleriaData } from '@/types/galeria';
import type { DecoCanvasTemplate, ElementoDecorativo } from '@/types/fiesta';
import type { DecorationDraft, DraftList } from './catalog-types';
import { decorationSources, decorationAnalysisToElements, hashDecoration, validateApprovedDecorationElements } from './catalog-core';
import { loadDecorationPhoto } from './catalog-photo';

const FILE = 'deco-catalogo-borradores.json';
const COLLECTION = 'deco_catalogo_borradores';
const LOCK = 'deco_catalogo_jobs/analisis.json';
interface AnalysisLock { token: string; until: number; day: string; attempts: number }
const EMPTY_LOCK: AnalysisLock = { token: '', until: 0, day: '', attempts: 0 };

async function readStrict<T>(file: string, empty: T): Promise<T> {
  const result = await readDataConDetalle(file, empty);
  if (result.huboFalla) throw new Error('No se pudo leer el catalogo actualizado. No se modificaron las propuestas.');
  return result.valor;
}
async function drafts(): Promise<DecorationDraft[]> { return readStrict<DecorationDraft[]>(FILE, []); }
function change(id: string, fn: (draft: DecorationDraft) => DecorationDraft | null) {
  if (!/^[a-f0-9]{64}$/.test(id)) throw new Error('Propuesta invalida.');
  return mutateDataItem<DecorationDraft>(FILE, COLLECTION, id, fn);
}

/** Reconciliation is deterministic and does not call a model or publish a template. */
export async function syncDecorationCatalog(): Promise<{ sources: number; added: number; activeIds: string[] }> {
  const catalog = await readStrict<CatalogoFoto[]>('catalogo-fotos.json', []);
  const gallery = await readStrict<GaleriaData>('galeria-publica.json', { fotos: [], videos: [] });
  const sources = decorationSources(catalog, gallery.fotos || []);
  const existing = new Map((await drafts()).map(d => [d.id, d]));
  let added = 0;
  for (const source of sources) {
    const previous = existing.get(source.id);
    if (previous) {
      if (previous.source.url !== source.url || previous.source.title !== source.title) {
        await change(source.id, current => ({ ...current, source }));
      }
      continue;
    }
    const now = new Date().toISOString();
    const draft: DecorationDraft = { id: source.id, source, status: 'queued', elementos: [], unknowns: [], revision: 1, createdAt: now, updatedAt: now };
    try { await createDataItem(FILE, COLLECTION, draft.id, draft); added++; }
    catch (error) {
      // Another instance won the same source ID. Never overwrite its review or approval.
      if (![6, 'already-exists'].includes((error as { code: number | string }).code)) throw error;
    }
  }
  return { sources: sources.length, added, activeIds: sources.map(s => s.id) };
}

export async function listDecorationDrafts(): Promise<DraftList> {
  const { activeIds } = await syncDecorationCatalog();
  const active = new Set(activeIds);
  const rows = await drafts();
  // A lost server response is uncertain, not permission to pay for the analysis twice.
  for (const draft of rows) {
    if (draft.status === 'analyzing' && Date.now() - Date.parse(draft.updatedAt) > 15 * 60_000) {
      await change(draft.id, current => current.status === 'analyzing' && current.analysisToken === draft.analysisToken
        ? { ...current, status: 'error', revision: current.revision + 1, updatedAt: new Date().toISOString(), error: 'El analisis no confirmo su resultado. Revisar antes de reintentarlo.' } : null);
    }
  }
  const latest = await drafts();
  const visible = latest.filter(d => active.has(d.id) && !['approved', 'dismissed'].includes(d.status));
  return { drafts: visible.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), pending: visible.filter(d => d.status === 'queued').length, automatic: true };
}

/** One bounded job across all server instances; transaction callbacks have no provider effects. */
export async function processDecorationDraft(): Promise<{ processed: boolean; error?: string }> {
  const { activeIds } = await syncDecorationCatalog();
  const rows = await drafts();
  const next = rows.find(d => d.status === 'queued' && activeIds.includes(d.id));
  if (!next) return { processed: false };
  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
    return { processed: false, error: 'La IA de decoracion no esta configurada. Las fotos y los 86 elementos siguen disponibles.' };
  }
  if (!(await hayPresupuestoParaIA())) return { processed: false, error: 'Se alcanzo el tope de IA. Las fotos quedan pendientes.' };
  const token = randomUUID(); const now = Date.now(); const day = new Date(now).toISOString().slice(0, 10);
  const lock = await mutarDocumentoConTransaccion<AnalysisLock>(LOCK, EMPTY_LOCK, current => {
    if (current.until > now) return null;
    const attempts = current.day === day ? current.attempts : 0;
    if (attempts >= 20) return null;
    return { token, until: now + 10 * 60_000, day, attempts: attempts + 1 };
  });
  if (!lock || lock.token !== token) return { processed: false, error: 'Hay otro analisis en curso o se alcanzo el limite diario (20). Las fotos quedan pendientes.' };
  let started = false;
  try {
    const claimed = await change(next.id, current => current.status === 'queued'
      ? { ...current, status: 'analyzing', analysisToken: token, updatedAt: new Date().toISOString() } : null);
    if (!claimed) return { processed: false };
    started = true;
    const photo = await loadDecorationPhoto(claimed.source.url);
    const contentHash = hashDecoration(photo);
    const reused = rows.find(d => d.id !== next.id && d.contentHash === contentHash && ['review', 'approved'].includes(d.status));
    let analysis: { elementos: ElementoDecorativo[]; unknowns: string[] };
    if (reused) analysis = { elementos: reused.elementos, unknowns: reused.unknowns };
    else {
      const { analyzeDecorationCatalog } = await import('@/ai/flows/analyze-decoration-catalog');
      try { analysis = decorationAnalysisToElements(await analyzeDecorationCatalog(photo)); }
      finally { await registrarConsumoIA('catalogo-decoracion'); }
    }
    await change(next.id, current => current.status === 'analyzing' && current.analysisToken === token
      ? { ...current, ...analysis, contentHash, status: reused ? 'dismissed' : 'review',
        revision: current.revision + 1, updatedAt: new Date().toISOString(),
        ...(reused ? { error: 'Misma foto que otra propuesta; no se genero otra plantilla.' } : {}) } : null);
    return { processed: true };
  } catch {
    if (started) await change(next.id, current => current.status === 'analyzing' && current.analysisToken === token
      ? { ...current, status: 'error', revision: current.revision + 1, updatedAt: new Date().toISOString(),
        error: 'No se pudo analizar esta foto. No se publico ninguna plantilla. Revisar el archivo o reintentar.' } : null);
    return { processed: false, error: 'No se pudo completar el analisis. La foto queda para revision.' };
  } finally {
    await mutarDocumentoConTransaccion<AnalysisLock>(LOCK, EMPTY_LOCK, current => current.token === token ? { ...current, until: 0 } : null);
  }
}

export async function approveCatalogDraft(id: string, revision: number, nombre: string, elementos: ElementoDecorativo[]) {
  const name = nombre.trim();
  if (!name || name.length > 140) throw new Error('Escribir un nombre de hasta 140 caracteres.');
  const clean = validateApprovedDecorationElements(elementos);
  const result = await change(id, current => {
    // A repeat acknowledgement accepts only the same approved edit, not someone else's edit.
    if (current.status === 'approved' && current.approvedName === name && JSON.stringify(current.elementos) === JSON.stringify(clean)) return current;
    if (current.status !== 'review' || current.revision !== revision) throw new Error('La propuesta cambio. Recargar antes de aprobar.');
    return { ...current, elementos: clean, approvedName: name, status: 'approved', revision: current.revision + 1, updatedAt: new Date().toISOString() };
  });
  if (!result) throw new Error('La propuesta ya no existe.');
}

export async function dismissCatalogDraft(id: string) {
  const result = await change(id, current => {
    if (current.status === 'analyzing') throw new Error('Esperar a que termine el analisis.');
    return { ...current, status: 'dismissed', revision: current.revision + 1, updatedAt: new Date().toISOString() };
  });
  if (!result) throw new Error('La propuesta ya no existe.');
}

export async function retryCatalogDraft(id: string) {
  const result = await change(id, current => {
    if (current.status !== 'error') throw new Error('Solo se reintentan los analisis fallidos.');
    const { error: _error, analysisToken: _token, ...rest } = current;
    void _error; void _token;
    return { ...rest, status: 'queued', revision: current.revision + 1, updatedAt: new Date().toISOString() };
  });
  if (!result) throw new Error('La propuesta ya no existe.');
}

export async function approvedCatalogTemplates(): Promise<DecoCanvasTemplate[]> {
  return (await drafts()).filter(d => d.status === 'approved').map(d => ({
    id: `catalog_deco_${d.id}`, nombre: d.approvedName || d.source.title,
    elementos: d.elementos, fondoColor: '#f8f9fa', creadoEn: d.updatedAt,
  }));
}
