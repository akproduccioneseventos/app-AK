/** @jest-environment node */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { AK_DECORATION_ELEMENTS } from '@/lib/decoracion/ak-library';
import assets from '@/lib/decoracion/ak-assets.json';
import { canonicalDecorationUrl, decorationSources, decorationAnalysisToElements, validateApprovedDecorationElements } from '@/lib/decoracion/catalog-core';
import type { DecorationDraft } from '@/lib/decoracion/catalog-types';

jest.mock('server-only', () => ({}));
jest.mock('@/lib/decoracion/catalog-photo', () => ({ loadDecorationPhoto: jest.fn() }));
jest.mock('@/ai/flows/analyze-decoration-catalog', () => ({ analyzeDecorationCatalog: jest.fn() }));
jest.mock('@/lib/ai/consumo-servidor', () => ({ hayPresupuestoParaIA: jest.fn(), registrarConsumoIA: jest.fn() }));
jest.mock('@/lib/auth/require-session', () => ({ requirePermisoAlguno: jest.fn(), requireAppSession: jest.fn() }));
jest.mock('@/lib/data-service', () => ({ readDataConDetalle: jest.fn(), createDataItem: jest.fn(), mutateDataItem: jest.fn(), readData: jest.fn() }));
jest.mock('@/lib/generic-json-store', () => ({ mutarDocumentoConTransaccion: jest.fn() }));

import { readDataConDetalle, createDataItem, mutateDataItem, readData } from '@/lib/data-service';
import { mutarDocumentoConTransaccion } from '@/lib/generic-json-store';
import { loadDecorationPhoto } from '@/lib/decoracion/catalog-photo';
import { analyzeDecorationCatalog } from '@/ai/flows/analyze-decoration-catalog';
import { hayPresupuestoParaIA, registrarConsumoIA } from '@/lib/ai/consumo-servidor';
import { requirePermisoAlguno } from '@/lib/auth/require-session';
import { syncDecorationCatalog, listDecorationDrafts, processDecorationDraft, approveCatalogDraft, approvedCatalogTemplates, dismissCatalogDraft, retryCatalogDraft } from '@/lib/decoracion/catalog-service';
import { approveDecorationDraft, getDecorationDrafts } from '@/app/actions/decoracion-catalogo';
import { getDecoCanvasTemplates } from '@/app/actions/deco-canvas-templates';

const FILE = 'deco-catalogo-borradores.json';
const source = { id: 'photo1', url: '/media/foto-decoracion.jpg', titulo: 'Fiesta AK', categoriaServicio: 'Decoración' };
const result = { matches: [{ assetId: AK_DECORATION_ELEMENTS[0].id, x: 0.5, y: 0.6, width: 0.3, height: 0.6, color: '#ff0000' }], unknowns: ['Arco no identificado'] };
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
let db: Record<string, unknown>;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.GEMINI_API_KEY = 'test-no-real-provider';
  db = { 'catalogo-fotos.json': [source], 'galeria-publica.json': { fotos: [], videos: [] }, [FILE]: [] };
  (readDataConDetalle as jest.Mock).mockImplementation(async (file, empty) => ({ valor: clone(db[file] ?? empty), huboFalla: false }));
  (readData as jest.Mock).mockImplementation(async (file, empty) => clone(db[file] ?? empty));
  (createDataItem as jest.Mock).mockImplementation(async (file, _collection, id, item) => {
    const rows = (db[file] || []) as DecorationDraft[];
    if (rows.some(row => row.id === id)) throw Object.assign(new Error('exists'), { code: 6 });
    db[file] = [...rows, clone(item)];
  });
  (mutateDataItem as jest.Mock).mockImplementation(async (file, _collection, id, update) => {
    const rows = db[file] as DecorationDraft[]; const index = rows.findIndex(row => row.id === id);
    if (index < 0) return null;
    const next = update(clone(rows[index]));
    if (next) rows[index] = clone(next);
    return next;
  });
  // Synchronous compare-and-set represents the atomic transaction boundary, not Firestore certification.
  (mutarDocumentoConTransaccion as jest.Mock).mockImplementation(async (file, empty, update) => {
    const next = update(clone(db[file] ?? empty));
    if (next) db[file] = clone(next);
    return next;
  });
  (loadDecorationPhoto as jest.Mock).mockResolvedValue(Buffer.from('normalized-fake-photo'));
  (analyzeDecorationCatalog as jest.Mock).mockResolvedValue(result);
  (hayPresupuestoParaIA as jest.Mock).mockResolvedValue(true);
});

test('86 original transparent assets: unique IDs, exact original hashes, paths and ratios', () => {
  expect(AK_DECORATION_ELEMENTS).toHaveLength(86);
  expect(new Set(assets.assets.map(a => a.id)).size).toBe(86);
  expect(new Set(assets.assets.map(a => a.category)).size).toBe(14);
  for (const asset of assets.assets) {
    const bytes = fs.readFileSync(path.join(process.cwd(), 'public', asset.url));
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
    const element = AK_DECORATION_ELEMENTS.find(a => a.id === asset.id)!;
    expect(Math.abs(element.width! / element.height! - asset.pixelWidth / asset.pixelHeight)).toBeLessThan(0.08);
  }
});

test('source classification uses decoration category, not arbitrary titles; copies and signed tokens reconcile', () => {
  expect(decorationSources([source, { ...source, id: 'copy' }, { ...source, categoriaServicio: 'Catering', titulo: 'decoracion' }], [
    { id: 'twin', url: 'https://www.akproducciones.uy/media/foto-decoracion.jpg?token=abc', categoria: 'Decoración' },
  ])).toHaveLength(1);
  expect(canonicalDecorationUrl('https://127.0.0.1/test.jpg')).toBeNull();
  expect(canonicalDecorationUrl('https://storage.googleapis.com.evil.test/x')).toBeNull();
});

test('three synchronizations and a new source do not overwrite reviewed drafts or publish automatically', async () => {
  await syncDecorationCatalog(); await syncDecorationCatalog(); await syncDecorationCatalog();
  expect(db[FILE]).toHaveLength(1); expect(analyzeDecorationCatalog).not.toHaveBeenCalled();
  (db['catalogo-fotos.json'] as typeof source[]).push({ ...source, id: 'new', url: '/media/fiesta-nueva.jpg' });
  await syncDecorationCatalog(); expect(db[FILE]).toHaveLength(2);
  expect(await approvedCatalogTemplates()).toEqual([]);
});

test('concurrent workers call the provider once, preserving independent editable objects', async () => {
  await Promise.all([processDecorationDraft(), processDecorationDraft()]);
  expect(analyzeDecorationCatalog).toHaveBeenCalledTimes(1);
  expect(registrarConsumoIA).toHaveBeenCalledWith('catalogo-decoracion');
  const [draft] = db[FILE] as DecorationDraft[];
  expect(draft.status).toBe('review'); expect(draft.unknowns).toEqual(result.unknowns);
  expect(draft.elementos[0].imageDataUri).toBe(AK_DECORATION_ELEMENTS[0].imageDataUri);
  expect(draft.elementos[0].tintColor).toBe('#ff0000');
});

test('approval, lost acknowledgement and reload expose exactly one reusable template in the real gallery consumer', async () => {
  await processDecorationDraft();
  const [draft] = db[FILE] as DecorationDraft[];
  const edited = draft.elementos.map(el => ({ ...el, x: 123, escala: 1.8, tintColor: '#00ff00' }));
  await approveCatalogDraft(draft.id, draft.revision, 'Nuestra decoracion', edited);
  await approveCatalogDraft(draft.id, draft.revision, 'Nuestra decoracion', edited);
  const templates = (await getDecoCanvasTemplates()).filter(t => t.id.startsWith('catalog_deco_'));
  expect(templates).toHaveLength(1);
  expect(templates[0].elementos[0]).toMatchObject({ x: 123, escala: 1.8, tintColor: '#00ff00' });
  expect(templates[0].fondoImagenUrl).toBeUndefined();
  expect((await listDecorationDrafts()).drafts).toHaveLength(0);
  await expect(approveCatalogDraft(draft.id, draft.revision, 'Otra edicion', edited)).rejects.toThrow('cambio');
  await dismissCatalogDraft(draft.id);
  expect(await approvedCatalogTemplates()).toHaveLength(0);
  await syncDecorationCatalog(); expect(db[FILE]).toHaveLength(1);
});

test('same image bytes under a new URL do not consume another analysis or create another template', async () => {
  await processDecorationDraft();
  (db['catalogo-fotos.json'] as typeof source[]).push({ ...source, id: 'copy', url: '/media/copia.jpg' });
  await processDecorationDraft();
  expect(analyzeDecorationCatalog).toHaveBeenCalledTimes(1);
  expect((db[FILE] as DecorationDraft[]).map(d => d.status).sort()).toEqual(['dismissed', 'review']);
});

test('failed analysis remains visible and never silently pays for another; retry is explicit', async () => {
  (analyzeDecorationCatalog as jest.Mock).mockRejectedValue(new Error('provider down'));
  expect((await processDecorationDraft()).error).toBeTruthy();
  const [draft] = db[FILE] as DecorationDraft[];
  expect(draft.status).toBe('error');
  await processDecorationDraft(); expect(analyzeDecorationCatalog).toHaveBeenCalledTimes(1);
  await retryCatalogDraft(draft.id); expect((db[FILE] as DecorationDraft[])[0].status).toBe('queued');
});

test('deleted photo is not processed; broken database is not treated as empty', async () => {
  await syncDecorationCatalog(); db['catalogo-fotos.json'] = [];
  expect((await processDecorationDraft()).processed).toBe(false);
  (readDataConDetalle as jest.Mock).mockResolvedValue({ valor: [], huboFalla: true });
  await expect(syncDecorationCatalog()).rejects.toThrow('actualizado');
});

test('unknown IDs, arbitrary URLs, bogus scales and empty approvals cannot enter approved templates', () => {
  const known = decorationAnalysisToElements(result).elementos;
  expect(decorationAnalysisToElements({ matches: [{ ...result.matches[0], assetId: 'invented-3D' }], unknowns: [] }).elementos).toEqual([]);
  expect(() => validateApprovedDecorationElements([])).toThrow();
  expect(() => validateApprovedDecorationElements([{ ...known[0], imageDataUri: 'javascript:alert(1)' }])).toThrow();
  expect(() => validateApprovedDecorationElements([{ ...known[0], escala: NaN }])).toThrow();
});

test('unauthorized caller cannot read proposals or approve; spending cap stops before the model', async () => {
  (requirePermisoAlguno as jest.Mock).mockRejectedValueOnce(new Error('denied'));
  await expect(getDecorationDrafts()).rejects.toThrow('denied');
  (requirePermisoAlguno as jest.Mock).mockRejectedValueOnce(new Error('denied'));
  await expect(approveDecorationDraft('x', 1, 'x', [])).rejects.toThrow('denied');
  (hayPresupuestoParaIA as jest.Mock).mockResolvedValue(false);
  expect((await processDecorationDraft()).processed).toBe(false);
  expect(analyzeDecorationCatalog).not.toHaveBeenCalled();
});
