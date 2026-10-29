import 'server-only';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { createDataItem, mutateDataItem, deleteDataItem, readDataConDetalle } from '@/lib/data-service';
import { mutarDocumentoConTransaccion } from '@/lib/generic-json-store';
import { hayPresupuestoParaIA, registrarConsumoIA } from '@/lib/ai/consumo-servidor';
import { generateGeminiImage } from '@/lib/ai/gemini-image';
import type { CatalogoFoto } from '@/types/catalogo';
import type { GaleriaData } from '@/types/galeria';
import type { DecoCanvasTemplate, ElementoDecorativo } from '@/types/fiesta';
import type { DecorationDraft, DraftList } from './catalog-types';
import type { LibraryElement } from '@/components/decoracion/DecoElementLibrary';
import { AK_DECORATION_ELEMENTS } from './ak-library';
import {
  decorationSources,
  decorationAnalysisToElements,
  hashDecoration,
  validateApprovedDecorationElements,
  normalizeElementName,
} from './catalog-core';
import { loadDecorationPhoto } from './catalog-photo';

const FILE = 'deco-catalogo-borradores.json';
const COLLECTION = 'deco_catalogo_borradores';
const LOCK = 'deco_catalogo_jobs/analisis.json';
const CUTOUT_LOCK = 'deco_catalogo_jobs/recortes.json';
const CUSTOM_ASSETS_FILE = 'deco-elementos-biblioteca.json';
const CUSTOM_ASSETS_COLLECTION = 'deco_elementos_biblioteca';

interface AnalysisLock { token: string; until: number; day: string; attempts: number }
const EMPTY_LOCK: AnalysisLock = { token: '', until: 0, day: '', attempts: 0 };

interface CutoutLock { day: string; count: number }
const EMPTY_CUTOUT_LOCK: CutoutLock = { day: '', count: 0 };

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

export async function getCustomDecorationElements(): Promise<LibraryElement[]> {
  return readStrict<LibraryElement[]>(CUSTOM_ASSETS_FILE, []);
}

export function inferDecorationCategory(name: string): string {
  const norm = normalizeElementName(name);
  if (/globo/i.test(norm)) return 'Globos';
  if (/mesa|pedestal|cilindro/i.test(norm)) return 'Mesas y pedestales';
  if (/flor|planta|follaje|hoja/i.test(norm)) return 'Flores y plantas';
  if (/neon|neón|cartel|luces|letrero/i.test(norm)) return 'Carteles y neon';
  if (/fondo|arco|panel|estructura|biombo|pared/i.test(norm)) return 'Fondos y estructuras';
  if (/sillon|sillón|asiento|trono/i.test(norm)) return 'Biombos y sillones';
  if (/alfombra|tapete/i.test(norm)) return 'Alfombras';
  if (/farol|vela|candelabro/i.test(norm)) return 'Faroles y candelabros';
  if (/letra/i.test(norm)) return 'Letras blancas';
  if (/numero|número/i.test(norm)) return 'Numeros decorativos';
  if (/torta|pastel/i.test(norm)) return 'Tortas';
  if (/baul|baúl/i.test(norm)) return 'Baules';
  return 'Accesorios';
}

function findExistingElement(name: string, category: string, customList: LibraryElement[]): LibraryElement | undefined {
  const normName = normalizeElementName(name);
  const normCat = normalizeElementName(category);
  const akMatch = AK_DECORATION_ELEMENTS.find(a =>
    normalizeElementName(a.label) === normName && (!category || normalizeElementName(a.categoria) === normCat)
  );
  if (akMatch) return akMatch;
  return customList.find(a =>
    normalizeElementName(a.label) === normName && (!category || normalizeElementName(a.categoria) === normCat)
  );
}

export async function saveCustomDecorationElement(element: LibraryElement): Promise<LibraryElement> {
  const customList = await getCustomDecorationElements();
  const existing = findExistingElement(element.label, element.categoria, customList);
  if (existing) return existing;

  const itemToSave: LibraryElement = {
    ...element,
    nuevoIA: true,
  };
  if (!itemToSave.id) itemToSave.id = `deco_ai_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  if (!itemToSave.tipo) itemToSave.tipo = itemToSave.id;

  await createDataItem(CUSTOM_ASSETS_FILE, CUSTOM_ASSETS_COLLECTION, itemToSave.id, itemToSave);
  return itemToSave;
}

export async function deleteCustomDecorationElement(id: string): Promise<boolean> {
  return deleteDataItem(CUSTOM_ASSETS_FILE, CUSTOM_ASSETS_COLLECTION, id);
}

async function consumirCupoRecorte(): Promise<boolean> {
  const day = new Date().toISOString().slice(0, 10);
  const result = await mutarDocumentoConTransaccion<CutoutLock>(CUTOUT_LOCK, EMPTY_CUTOUT_LOCK, current => {
    const count = current.day === day ? current.count : 0;
    if (count >= 20) return null;
    return { day, count: count + 1 };
  });
  return Boolean(result);
}

function defaultTemplateName(title?: string): string {
  const trimmed = title?.trim();
  if (trimmed) return trimmed.slice(0, 140);
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];
  const d = new Date();
  const mes = meses[d.getMonth()];
  const anio = d.getFullYear();
  return `Decoración — ${mes} ${anio}`;
}

function applyApproval(
  current: DecorationDraft,
  name: string,
  elementosValidados: ElementoDecorativo[],
  aprobadaSola: boolean,
): DecorationDraft {
  return {
    ...current,
    elementos: elementosValidados,
    approvedName: name,
    status: 'approved',
    aprobadaSola,
    revision: current.revision + 1,
    updatedAt: new Date().toISOString(),
  };
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

    const previouslyDismissed = rows.find(d => d.id !== next.id && d.contentHash === contentHash && (d.sacada || d.status === 'dismissed'));
    if (previouslyDismissed || claimed.sacada) {
      await change(next.id, current => current.status === 'analyzing' && current.analysisToken === token
        ? { ...current, contentHash, status: 'dismissed', sacada: true, revision: current.revision + 1, updatedAt: new Date().toISOString(),
            error: 'Misma foto que otra propuesta descartada; no se genero otra plantilla.' } : null);
      return { processed: true };
    }

    const reused = rows.find(d => d.id !== next.id && d.contentHash === contentHash && ['review', 'approved'].includes(d.status));
    let analysis: { elementos: ElementoDecorativo[]; unknowns: string[] };
    if (reused) {
      analysis = { elementos: reused.elementos, unknowns: reused.unknowns };
    } else {
      const { analyzeDecorationCatalog } = await import('@/ai/flows/analyze-decoration-catalog');
      try { analysis = decorationAnalysisToElements(await analyzeDecorationCatalog(photo)); }
      finally { await registrarConsumoIA('catalogo-decoracion'); }
    }

    if (reused) {
      await change(next.id, current => current.status === 'analyzing' && current.analysisToken === token
        ? { ...current, ...analysis, contentHash, status: 'dismissed', sacada: true,
          revision: current.revision + 1, updatedAt: new Date().toISOString(),
          error: 'Misma foto que otra propuesta; no se genero otra plantilla.' } : null);
      return { processed: true };
    }

    const customAssets = await getCustomDecorationElements();
    let elementos = [...analysis.elementos];
    let remainingUnknowns = [...analysis.unknowns];
    let recortesFoto = 0;

    for (const unknownName of analysis.unknowns) {
      const category = inferDecorationCategory(unknownName);

      const existing = findExistingElement(unknownName, category, customAssets);
      if (existing) {
        elementos.push({
          id: `propuesta_${elementos.length}_${existing.id}`,
          tipo: existing.tipo,
          x: 450,
          y: 275,
          width: existing.width,
          height: existing.height,
          escala: 1,
          colores: ['#ffffff'],
          rotacion: 0,
          zIndex: elementos.length + 1,
          isCustom: true,
          imageDataUri: existing.imageDataUri,
        });
        remainingUnknowns = remainingUnknowns.filter(u => u !== unknownName);
        continue;
      }

      if (!(await hayPresupuestoParaIA())) {
        break;
      }

      if (recortesFoto >= 5) {
        break;
      }

      const cupoOk = await consumirCupoRecorte();
      if (!cupoOk) {
        break;
      }

      recortesFoto++;
      try {
        let generatedBase64: string | null = null;
        try {
          generatedBase64 = await generateGeminiImage({
            prompt: `Aísla y recorta el objeto "${unknownName}" sobre fondo transparente en formato PNG.`,
            images: [{ base64: photo.toString('base64'), contentType: 'image/jpeg' }],
          });
        } finally {
          // El pedido a la IA se paga salga bien o mal: se cuenta siempre, una vez.
          await registrarConsumoIA('recorte-decoracion');
        }

        if (!generatedBase64) continue;

        const buffer = Buffer.from(generatedBase64, 'base64');
        if (buffer.length > 4 * 1024 * 1024) continue;

        const img = sharp(buffer);
        const meta = await img.metadata();
        if (meta.format !== 'png' || !meta.hasAlpha) continue;

        const stats = await img.stats();
        if (!stats.channels[3] || stats.channels[3].min >= 255) continue;

        // Se guarda adentro del registro: un documento de la base admite 1 MiB. Se achica a 512 px y
        // se comprime; si igual queda grande, no se guarda.
        const chico = await sharp(buffer).resize({ width: 512, height: 512, fit: 'inside', withoutEnlargement: true }).png({ compressionLevel: 9 }).toBuffer();
        if (chico.length > 600 * 1024) continue;

        const pw = meta.width || 160;
        const ph = meta.height || 160;
        const maxDim = Math.max(pw, ph);
        const width = Math.round(160 * pw / maxDim);
        const height = Math.round(160 * ph / maxDim);
        const dataUri = `data:image/png;base64,${chico.toString('base64')}`;

        const newId = `deco_ai_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
        const saved = await saveCustomDecorationElement({
          id: newId,
          tipo: newId,
          label: unknownName,
          categoria: category,
          emoji: '',
          maxColores: 1,
          isCustom: true,
          imageDataUri: dataUri,
          width,
          height,
          nuevoIA: true,
        });
        customAssets.push(saved);

        elementos.push({
          id: `propuesta_${elementos.length}_${saved.id}`,
          tipo: saved.tipo,
          x: 450,
          y: 275,
          width: saved.width,
          height: saved.height,
          escala: 1,
          colores: ['#ffffff'],
          rotacion: 0,
          zIndex: elementos.length + 1,
          isCustom: true,
          imageDataUri: saved.imageDataUri,
        });
        remainingUnknowns = remainingUnknowns.filter(u => u !== unknownName);
      } catch {
        // En caso de falla, permanece en unknowns
      }
    }

    if (elementos.length >= 2) {
      const templateName = defaultTemplateName(claimed.source.title);
      const clean = validateApprovedDecorationElements(elementos, customAssets);
      await change(next.id, current => current.status === 'analyzing' && current.analysisToken === token
        ? applyApproval({ ...current, unknowns: remainingUnknowns, contentHash }, templateName, clean, true)
        : null);
    } else {
      await change(next.id, current => current.status === 'analyzing' && current.analysisToken === token
        ? { ...current, elementos, unknowns: remainingUnknowns, contentHash, status: 'review', revision: current.revision + 1, updatedAt: new Date().toISOString() }
        : null);
    }

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
  const customAssets = await getCustomDecorationElements();
  const clean = validateApprovedDecorationElements(elementos, customAssets);
  const result = await change(id, current => {
    // A repeat acknowledgement accepts only the same approved edit, not someone else's edit.
    if (current.status === 'approved' && current.approvedName === name && JSON.stringify(current.elementos) === JSON.stringify(clean)) return current;
    if (current.status !== 'review' || current.revision !== revision) throw new Error('La propuesta cambio. Recargar antes de aprobar.');
    return applyApproval(current, name, clean, false);
  });
  if (!result) throw new Error('La propuesta ya no existe.');
}

export async function dismissCatalogDraft(id: string) {
  const result = await change(id, current => {
    if (current.status === 'analyzing') throw new Error('Esperar a que termine el analisis.');
    return { ...current, status: 'dismissed', sacada: true, revision: current.revision + 1, updatedAt: new Date().toISOString() };
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
  return (await drafts()).filter(d => d.status === 'approved' && !d.sacada).map(d => ({
    id: `catalog_deco_${d.id}`, nombre: d.approvedName || d.source.title,
    elementos: d.elementos, fondoColor: '#f8f9fa', creadoEn: d.updatedAt,
    aprobadaSola: d.aprobadaSola,
  }));
}
