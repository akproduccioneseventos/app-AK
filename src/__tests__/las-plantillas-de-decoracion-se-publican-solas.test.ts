/** @jest-environment node */
import sharp from 'sharp';
import { AK_DECORATION_ELEMENTS } from '@/lib/decoracion/ak-library';
import type { DecorationDraft } from '@/lib/decoracion/catalog-types';

jest.mock('server-only', () => ({}));
jest.mock('@/lib/decoracion/catalog-photo', () => ({ loadDecorationPhoto: jest.fn() }));
jest.mock('@/ai/flows/analyze-decoration-catalog', () => ({ analyzeDecorationCatalog: jest.fn() }));
jest.mock('@/lib/ai/consumo-servidor', () => ({ hayPresupuestoParaIA: jest.fn(), registrarConsumoIA: jest.fn() }));
jest.mock('@/lib/auth/require-session', () => ({ requirePermisoAlguno: jest.fn(), requireAppSession: jest.fn() }));
jest.mock('@/lib/data-service', () => ({
  readDataConDetalle: jest.fn(),
  createDataItem: jest.fn(),
  mutateDataItem: jest.fn(),
  deleteDataItem: jest.fn(),
  readData: jest.fn(),
  writeData: jest.fn(),
}));
jest.mock('@/lib/generic-json-store', () => ({ mutarDocumentoConTransaccion: jest.fn() }));
jest.mock('@/lib/ai/gemini-image', () => ({ generateGeminiImage: jest.fn() }));

import {
  readDataConDetalle,
  createDataItem,
  mutateDataItem,
  deleteDataItem,
  readData,
  writeData,
} from '@/lib/data-service';
import { mutarDocumentoConTransaccion } from '@/lib/generic-json-store';
import { loadDecorationPhoto } from '@/lib/decoracion/catalog-photo';
import { analyzeDecorationCatalog } from '@/ai/flows/analyze-decoration-catalog';
import { hayPresupuestoParaIA, registrarConsumoIA } from '@/lib/ai/consumo-servidor';
import { generateGeminiImage } from '@/lib/ai/gemini-image';
import {
  syncDecorationCatalog,
  processDecorationDraft,
  approvedCatalogTemplates,
  getCustomDecorationElements,
} from '@/lib/decoracion/catalog-service';
import { getDecoCanvasTemplates, deleteDecoCanvasTemplate } from '@/app/actions/deco-canvas-templates';
import { getDecoLibraryElements, deleteDecoLibraryElement } from '@/app/actions/decoracion-catalogo';

const FILE = 'deco-catalogo-borradores.json';
const CUSTOM_FILE = 'deco-elementos-biblioteca.json';
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

let db: Record<string, unknown>;

async function makeTestPngBase64(alpha: number): Promise<string> {
  const buf = await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 4,
      background: { r: 255, g: 128, b: 0, alpha },
    },
  }).png().toBuffer();
  return buf.toString('base64');
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.GEMINI_API_KEY = 'test-gemini-key';
  db = {
    'catalogo-fotos.json': [],
    'galeria-publica.json': { fotos: [], videos: [] },
    [FILE]: [],
    [CUSTOM_FILE]: [],
    'deco-canvas-templates.json': [],
    'deco_catalogo_jobs/analisis.json': { token: '', until: 0, day: '', attempts: 0 },
    'deco_catalogo_jobs/recortes.json': { day: '', count: 0 },
  };

  (readDataConDetalle as jest.Mock).mockImplementation(async (file, empty) => ({
    valor: clone(db[file] ?? empty),
    huboFalla: false,
  }));
  (readData as jest.Mock).mockImplementation(async (file, empty) => clone(db[file] ?? empty));
  (writeData as jest.Mock).mockImplementation(async (file, data) => {
    db[file] = clone(data);
  });
  (createDataItem as jest.Mock).mockImplementation(async (file, _collection, id, item) => {
    const rows = (db[file] || []) as Array<{ id: string }>;
    if (rows.some(row => row.id === id)) {
      throw Object.assign(new Error('exists'), { code: 6 });
    }
    db[file] = [...rows, clone(item)];
  });
  (mutateDataItem as jest.Mock).mockImplementation(async (file, _collection, id, update) => {
    const rows = (db[file] || []) as Array<{ id: string }>;
    const index = rows.findIndex(row => row.id === id);
    if (index < 0) return null;
    const next = update(clone(rows[index]));
    if (next) rows[index] = clone(next);
    return next;
  });
  (deleteDataItem as jest.Mock).mockImplementation(async (file, _collection, id) => {
    const rows = (db[file] || []) as Array<{ id: string }>;
    db[file] = rows.filter(row => row.id !== id);
    return true;
  });
  (mutarDocumentoConTransaccion as jest.Mock).mockImplementation(async (file, empty, update) => {
    const next = update(clone(db[file] ?? empty));
    if (next) db[file] = clone(next);
    return next;
  });

  (loadDecorationPhoto as jest.Mock).mockResolvedValue(Buffer.from('fake-photo-bytes'));
  (hayPresupuestoParaIA as jest.Mock).mockResolvedValue(true);
  (registrarConsumoIA as jest.Mock).mockResolvedValue(undefined);
});

describe('Orden 254 — Las plantillas de decoracion se publican solas', () => {
  test('(a) Una foto con 3 elementos reconocidos termina "approved" y aparece en getDecoCanvasTemplates con aprobadaSola', async () => {
    const photo = { id: 'foto_a', url: '/media/foto_a.jpg', titulo: 'Fiesta XV Valentina', categoriaServicio: 'Decoración' };
    db['catalogo-fotos.json'] = [photo];

    (analyzeDecorationCatalog as jest.Mock).mockResolvedValueOnce({
      matches: [
        { assetId: AK_DECORATION_ELEMENTS[0].id, x: 0.2, y: 0.3, width: 0.2, height: 0.4, color: '#ff0000' },
        { assetId: AK_DECORATION_ELEMENTS[1].id, x: 0.5, y: 0.3, width: 0.2, height: 0.4 },
        { assetId: AK_DECORATION_ELEMENTS[2].id, x: 0.8, y: 0.3, width: 0.2, height: 0.4 },
      ],
      unknowns: [],
    });

    const result = await processDecorationDraft();
    expect(result.processed).toBe(true);

    const drafts = db[FILE] as DecorationDraft[];
    expect(drafts).toHaveLength(1);
    expect(drafts[0].status).toBe('approved');
    expect(drafts[0].aprobadaSola).toBe(true);
    expect(drafts[0].approvedName).toBe('Fiesta XV Valentina');

    const templates = await getDecoCanvasTemplates();
    const approvedTpl = templates.find(t => t.id === `catalog_deco_${drafts[0].id}`);
    expect(approvedTpl).toBeDefined();
    expect(approvedTpl?.aprobadaSola).toBe(true);
    expect(approvedTpl?.nombre).toBe('Fiesta XV Valentina');
    expect(approvedTpl?.elementos).toHaveLength(3);
  });

  test('(b) Una foto con 1 elemento queda "review"', async () => {
    const photo = { id: 'foto_b', url: '/media/foto_b.jpg', titulo: 'Cumpleaños 50', categoriaServicio: 'Decoración' };
    db['catalogo-fotos.json'] = [photo];

    (analyzeDecorationCatalog as jest.Mock).mockResolvedValueOnce({
      matches: [
        { assetId: AK_DECORATION_ELEMENTS[0].id, x: 0.5, y: 0.5, width: 0.3, height: 0.5 },
      ],
      unknowns: [],
    });

    const result = await processDecorationDraft();
    expect(result.processed).toBe(true);

    const drafts = db[FILE] as DecorationDraft[];
    expect(drafts).toHaveLength(1);
    expect(drafts[0].status).toBe('review');
    expect(drafts[0].aprobadaSola).toBeFalsy();

    const templates = await getDecoCanvasTemplates();
    expect(templates.find(t => t.id === `catalog_deco_${drafts[0].id}`)).toBeUndefined();
  });

  test('(c) Un objeto desconocido con un recorte transparente valido aparece como elemento nuevo y en la plantilla; sin transparencia no', async () => {
    const photo = { id: 'foto_c', url: '/media/foto_c.jpg', titulo: 'Mesa Dulce Boda', categoriaServicio: 'Decoración' };
    db['catalogo-fotos.json'] = [photo];

    const transparentBase64 = await makeTestPngBase64(0.5);
    const opaqueBase64 = await makeTestPngBase64(1.0);

    (analyzeDecorationCatalog as jest.Mock).mockResolvedValueOnce({
      matches: [
        { assetId: AK_DECORATION_ELEMENTS[0].id, x: 0.2, y: 0.3, width: 0.2, height: 0.4 },
      ],
      unknowns: ['Arco floral rosa silvestre', 'Cilindro blanco opaco'],
    });

    (generateGeminiImage as jest.Mock).mockImplementation(async ({ prompt }: { prompt: string }) => {
      if (prompt.includes('Arco floral rosa silvestre')) return transparentBase64;
      if (prompt.includes('Cilindro blanco opaco')) return opaqueBase64;
      return null;
    });

    const result = await processDecorationDraft();
    expect(result.processed).toBe(true);

    expect(registrarConsumoIA).toHaveBeenCalledWith('recorte-decoracion');

    const customElements = await getCustomDecorationElements();
    expect(customElements).toHaveLength(1);
    expect(customElements[0].label).toBe('Arco floral rosa silvestre');
    expect(customElements[0].nuevoIA).toBe(true);

    const drafts = db[FILE] as DecorationDraft[];
    expect(drafts).toHaveLength(1);
    expect(drafts[0].status).toBe('approved');
    expect(drafts[0].aprobadaSola).toBe(true);
    expect(drafts[0].elementos).toHaveLength(2);
    expect(drafts[0].unknowns).toContain('Cilindro blanco opaco');
    expect(drafts[0].unknowns).not.toContain('Arco floral rosa silvestre');

    const libraryElements = await getDecoLibraryElements();
    expect(libraryElements.some(el => el.label === 'Arco floral rosa silvestre' && el.nuevoIA)).toBe(true);
  });

  test('(d) Sin presupuesto de IA, no se pide ningun recorte y la plantilla igual se aprueba con lo reconocido', async () => {
    const photo = { id: 'foto_d', url: '/media/foto_d.jpg', titulo: 'Bautismo Jardin', categoriaServicio: 'Decoración' };
    db['catalogo-fotos.json'] = [photo];

    (analyzeDecorationCatalog as jest.Mock).mockResolvedValueOnce({
      matches: [
        { assetId: AK_DECORATION_ELEMENTS[0].id, x: 0.2, y: 0.3, width: 0.2, height: 0.4 },
        { assetId: AK_DECORATION_ELEMENTS[1].id, x: 0.5, y: 0.3, width: 0.2, height: 0.4 },
      ],
      unknowns: ['Follaje sin identificar'],
    });

    (hayPresupuestoParaIA as jest.Mock)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const result = await processDecorationDraft();
    expect(result.processed).toBe(true);

    expect(generateGeminiImage).not.toHaveBeenCalled();

    const drafts = db[FILE] as DecorationDraft[];
    expect(drafts[0].status).toBe('approved');
    expect(drafts[0].aprobadaSola).toBe(true);
    expect(drafts[0].elementos).toHaveLength(2);
    expect(drafts[0].unknowns).toContain('Follaje sin identificar');
  });

  test('(e) El mismo objeto en dos fotos crea un solo elemento', async () => {
    const photo1 = { id: 'foto_e1', url: '/media/foto_e1.jpg', titulo: 'Fiesta 1', categoriaServicio: 'Decoración' };
    const photo2 = { id: 'foto_e2', url: '/media/foto_e2.jpg', titulo: 'Fiesta 2', categoriaServicio: 'Decoración' };
    db['catalogo-fotos.json'] = [photo1, photo2];

    const transparentBase64 = await makeTestPngBase64(0.5);
    (generateGeminiImage as jest.Mock).mockResolvedValue(transparentBase64);

    (loadDecorationPhoto as jest.Mock)
      .mockResolvedValueOnce(Buffer.from('bytes-photo-1'))
      .mockResolvedValueOnce(Buffer.from('bytes-photo-2'));

    (analyzeDecorationCatalog as jest.Mock)
      .mockResolvedValueOnce({
        matches: [{ assetId: AK_DECORATION_ELEMENTS[0].id, x: 0.2, y: 0.3, width: 0.2, height: 0.4 }],
        unknowns: ['Neón Mis 15 Brillante'],
      })
      .mockResolvedValueOnce({
        matches: [{ assetId: AK_DECORATION_ELEMENTS[1].id, x: 0.5, y: 0.3, width: 0.2, height: 0.4 }],
        unknowns: ['Neón Mis 15 Brillante'],
      });

    await processDecorationDraft();
    await processDecorationDraft();

    const customElements = await getCustomDecorationElements();
    expect(customElements).toHaveLength(1);
    expect(customElements[0].label).toBe('Neón Mis 15 Brillante');
    expect(generateGeminiImage).toHaveBeenCalledTimes(1);

    const drafts = db[FILE] as DecorationDraft[];
    expect(drafts[0].status).toBe('approved');
    expect(drafts[1].status).toBe('approved');
    expect(drafts[0].elementos).toHaveLength(2);
    expect(drafts[1].elementos).toHaveLength(2);
  });

  test('(f) Una plantilla sacada con "Sacar" no vuelve al reprocesar', async () => {
    const photo = { id: 'foto_f', url: '/media/foto_f.jpg', titulo: 'Evento Corporativo AK', categoriaServicio: 'Decoración' };
    db['catalogo-fotos.json'] = [photo];

    (analyzeDecorationCatalog as jest.Mock).mockResolvedValueOnce({
      matches: [
        { assetId: AK_DECORATION_ELEMENTS[0].id, x: 0.2, y: 0.3, width: 0.2, height: 0.4 },
        { assetId: AK_DECORATION_ELEMENTS[1].id, x: 0.5, y: 0.3, width: 0.2, height: 0.4 },
      ],
      unknowns: [],
    });

    await processDecorationDraft();

    let drafts = db[FILE] as DecorationDraft[];
    expect(drafts[0].status).toBe('approved');
    expect(drafts[0].aprobadaSola).toBe(true);

    let templates = await getDecoCanvasTemplates();
    expect(templates.some(t => t.id === `catalog_deco_${drafts[0].id}`)).toBe(true);

    const deleteResult = await deleteDecoCanvasTemplate(`catalog_deco_${drafts[0].id}`);
    expect(deleteResult.success).toBe(true);

    drafts = db[FILE] as DecorationDraft[];
    expect(drafts[0].status).toBe('dismissed');
    expect(drafts[0].sacada).toBe(true);

    templates = await getDecoCanvasTemplates();
    expect(templates.some(t => t.id === `catalog_deco_${drafts[0].id}`)).toBe(false);

    await syncDecorationCatalog();
    await processDecorationDraft();

    drafts = db[FILE] as DecorationDraft[];
    expect(drafts[0].status).toBe('dismissed');
    expect(drafts[0].sacada).toBe(true);

    templates = await getDecoCanvasTemplates();
    expect(templates.some(t => t.id === `catalog_deco_${drafts[0].id}`)).toBe(false);
  });

  test('Accion deleteDecoLibraryElement elimina elemento personalizado', async () => {
    db[CUSTOM_FILE] = [
      { id: 'el_1', tipo: 'el_1', label: 'Item 1', categoria: 'Accesorios', emoji: '', maxColores: 1, nuevoIA: true },
      { id: 'el_2', tipo: 'el_2', label: 'Item 2', categoria: 'Accesorios', emoji: '', maxColores: 1, nuevoIA: true },
    ];

    const del = await deleteDecoLibraryElement('el_1');
    expect(del.success).toBe(true);

    const custom = await getCustomDecorationElements();
    expect(custom).toHaveLength(1);
    expect(custom[0].id).toBe('el_2');
  });
});
