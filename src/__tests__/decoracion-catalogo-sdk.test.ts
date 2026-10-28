/** @jest-environment node */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import admin from 'firebase-admin';
import { AK_DECORATION_ELEMENTS } from '@/lib/decoracion/ak-library';

jest.mock('server-only', () => ({}));
jest.mock('@/lib/decoracion/catalog-photo', () => ({ loadDecorationPhoto: jest.fn() }));
jest.mock('@/ai/flows/analyze-decoration-catalog', () => ({ analyzeDecorationCatalog: jest.fn() }));
jest.mock('@/lib/ai/consumo-servidor', () => ({ hayPresupuestoParaIA: jest.fn(), registrarConsumoIA: jest.fn() }));
jest.mock('@/lib/backup/schedule-after-write', () => ({ scheduleAutoBackupAfterWrite: jest.fn() }));
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(), requirePermisoAlguno: jest.fn() }));

const QA_ENABLED = process.env.AK_DECORATION_SDK_QA === 'true';
const PROJECT_ID = 'demo-ak-decoracion-758';
const HOST = '127.0.0.1:8085';
const CATALOG_COLLECTION = 'catalogo_fotos';
const GALLERY_COLLECTION = 'json_documents';
const DRAFT_COLLECTION = 'deco_catalogo_borradores';
const LOCK_COLLECTION = 'deco_catalogo_jobs';
const FILE = 'deco-catalogo-borradores.json';
const sourceA = { id: 'sdk-photo-a', url: '/media/sdk-decoracion-a.jpg', titulo: 'Decoracion SDK A', categoriaServicio: 'Decoración' };
const sourceB = { id: 'sdk-photo-b', url: '/media/sdk-decoracion-b.jpg', titulo: 'Decoracion SDK B', categoriaServicio: 'Decoración' };
const analysis = { matches: [{ assetId: AK_DECORATION_ELEMENTS[0].id, x: 0.5, y: 0.5, width: 0.3, height: 0.5, color: '#aa3344' }], unknowns: ['Flor no identificada'] };

let db: FirebaseFirestore.Firestore;
let tempDir = '';
let originalCwd = process.cwd;
let originals: Record<string, string | undefined> = {};
let service: typeof import('@/lib/decoracion/catalog-service');
let getDecoCanvasTemplates: typeof import('@/app/actions/deco-canvas-templates').getDecoCanvasTemplates;
let analyzeDecorationCatalog: jest.Mock;
let registrarConsumoIA: jest.Mock;

const qa = (name: string, fn: () => Promise<void>) => (QA_ENABLED ? test(name, fn, 30000) : test.skip(name, fn));

beforeAll(async () => {
  if (!QA_ENABLED) return;
  if (process.env.FIRESTORE_EMULATOR_HOST !== HOST) throw new Error(`SDK QA requiere FIRESTORE_EMULATOR_HOST=${HOST}.`);
  if ((process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) !== PROJECT_ID) {
    throw new Error(`SDK QA requiere FIREBASE_PROJECT_ID=${PROJECT_ID}.`);
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error('SDK QA no admite credenciales reales; usar solo el proyecto demo del emulador.');
  }
  if (admin.apps.length) throw new Error('SDK QA requiere un proceso Jest limpio, sin apps Admin preexistentes.');
  admin.initializeApp({ projectId: PROJECT_ID });
  db = admin.firestore();
  process.env.GCLOUD_PROJECT = PROJECT_ID;
  const server = await import('@/lib/firebase/server');
  if (server.dbAdmin !== db || admin.app().options.projectId !== PROJECT_ID || db.projectId !== PROJECT_ID) {
    throw new Error('Firebase Admin no quedó enlazado al proyecto demo esperado.');
  }
  const mocks = await import('@/lib/decoracion/catalog-photo');
  jest.mocked(mocks.loadDecorationPhoto).mockResolvedValue(Buffer.from('offline-demo-decoration-image'));
  const ai = await import('@/ai/flows/analyze-decoration-catalog');
  analyzeDecorationCatalog = jest.mocked(ai.analyzeDecorationCatalog) as jest.Mock;
  analyzeDecorationCatalog.mockResolvedValue(analysis);
  const budget = await import('@/lib/ai/consumo-servidor');
  jest.mocked(budget.hayPresupuestoParaIA).mockResolvedValue(true);
  registrarConsumoIA = jest.mocked(budget.registrarConsumoIA) as jest.Mock;
  registrarConsumoIA.mockResolvedValue(undefined);
  const auth = await import('@/lib/auth/require-session');
  jest.mocked(auth.requireAppSession).mockResolvedValue({} as never);
  jest.mocked(auth.requirePermisoAlguno).mockResolvedValue({} as never);
  originals = {
    AK_USE_LOCAL_JSON_ONLY: process.env.AK_USE_LOCAL_JSON_ONLY,
    AK_ALLOW_LOCAL_JSON_WRITES: process.env.AK_ALLOW_LOCAL_JSON_WRITES,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  };
  delete process.env.AK_USE_LOCAL_JSON_ONLY;
  delete process.env.AK_ALLOW_LOCAL_JSON_WRITES;
  process.env.GEMINI_API_KEY = 'sdk-qa-placeholder-no-network';
  delete process.env.GOOGLE_API_KEY;
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ak-decoracion-sdk-758-'));
  originalCwd = process.cwd;
  jest.spyOn(process, 'cwd').mockReturnValue(tempDir);
  service = await import('@/lib/decoracion/catalog-service');
  ({ getDecoCanvasTemplates } = await import('@/app/actions/deco-canvas-templates'));
}, 30000);

beforeEach(async () => {
  if (!QA_ENABLED) return;
  // The previous case's mirror is not a new test's database. Never touch the repo's data.
  if (!tempDir || path.dirname(tempDir) !== os.tmpdir() || !path.basename(tempDir).startsWith('ak-decoracion-sdk-758-')) throw new Error('QA temp directory not verified.');
  for (const base of ['data', 'src/data']) {
    for (const file of [FILE, 'catalogo-fotos.json', 'galeria-publica.json']) {
      await fs.rm(path.join(tempDir, base, file), { force: true });
    }
  }
  for (const collection of [CATALOG_COLLECTION, GALLERY_COLLECTION, DRAFT_COLLECTION, LOCK_COLLECTION]) {
    const snapshot = await db.collection(collection).get();
    if (snapshot.empty) continue;
    const batch = db.batch(); snapshot.docs.forEach(doc => batch.delete(doc.ref)); await batch.commit();
  }
  await Promise.all([
    db.collection(CATALOG_COLLECTION).doc(sourceA.id).set(sourceA),
    db.collection(CATALOG_COLLECTION).doc(sourceB.id).set(sourceB),
    db.collection(GALLERY_COLLECTION).doc('galeria-publica.json').set({ _data: {
      fotos: [{ id: 'sdk-gallery-photo', url: '/media/sdk-galeria.jpg', titulo: 'Decoracion galeria', categoria: 'Decoración', servicio: 'ambientacion' }],
      videos: [],
    } }),
  ]);
  analyzeDecorationCatalog.mockClear();
  registrarConsumoIA.mockClear();
}, 30000);

afterAll(async () => {
  if (!QA_ENABLED) return;
  try {
    if (!db) return;
    await Promise.all([CATALOG_COLLECTION, GALLERY_COLLECTION, DRAFT_COLLECTION, LOCK_COLLECTION].map(async collection => {
      const snapshot = await db.collection(collection).get();
      if (snapshot.empty) return;
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }));
  } finally {
    jest.restoreAllMocks();
    process.cwd = originalCwd;
    for (const [key, value] of Object.entries(originals)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    if (tempDir && path.dirname(tempDir) === os.tmpdir() && path.basename(tempDir).startsWith('ak-decoracion-sdk-758-')) await fs.rm(tempDir, { recursive: true, force: true });
    if (admin.apps.length) await admin.app().delete();
  }
}, 30000);

qa('several syncs and concurrent processors persist drafts and run the model only once', async () => {
  await Promise.all([service.syncDecorationCatalog(), service.syncDecorationCatalog(), service.syncDecorationCatalog()]);
  const initial = await db.collection(DRAFT_COLLECTION).get();
  expect(initial.size).toBe(3);
  await Promise.all([service.processDecorationDraft(), service.processDecorationDraft()]);
  expect(analyzeDecorationCatalog).toHaveBeenCalledTimes(1);
  expect(registrarConsumoIA).toHaveBeenCalledTimes(1);
  expect((await db.collection(DRAFT_COLLECTION).where('status', '==', 'review').get()).size).toBe(1);
  expect((await db.collection(LOCK_COLLECTION).doc('analisis').get()).data()?.until).toBe(0);
});

qa('approval retry is idempotent and the real canvas consumer returns only approved catalog templates', async () => {
  await service.syncDecorationCatalog();
  await service.processDecorationDraft();
  const draft = (await service.listDecorationDrafts()).drafts.find(row => row.status === 'review')!;
  const elements = draft.elementos.map(element => ({ ...element, x: 137, y: 211, escala: 1.7, tintColor: '#22aa66' }));
  await service.approveCatalogDraft(draft.id, draft.revision, 'SDK aprobada', elements);
  await service.approveCatalogDraft(draft.id, draft.revision, 'SDK aprobada', elements);
  const templates = (await getDecoCanvasTemplates()).filter(template => template.id.startsWith('catalog_deco_'));
  expect(templates).toHaveLength(1);
  expect(templates[0].nombre).toBe('SDK aprobada');
  expect(templates[0].elementos[0]).toMatchObject({ x: 137, y: 211, escala: 1.7, tintColor: '#22aa66' });
  expect((await db.collection(DRAFT_COLLECTION).doc(draft.id).get()).data()?.status).toBe('approved');
  expect(await service.approvedCatalogTemplates()).toHaveLength(1);
});

qa('edits persist after reread, while a new source with identical bytes does not invoke the model again', async () => {
  await service.syncDecorationCatalog();
  await service.processDecorationDraft();
  const review = (await service.listDecorationDrafts()).drafts.find(row => row.status === 'review')!;
  const edited = review.elementos.map(element => ({ ...element, x: 319, tintColor: '#3366cc' }));
  await service.approveCatalogDraft(review.id, review.revision, 'Edicion persistida', edited);
  const reloaded = await service.approvedCatalogTemplates();
  expect(reloaded[0].elementos[0]).toMatchObject({ x: 319, tintColor: '#3366cc' });

  await db.collection(CATALOG_COLLECTION).doc('sdk-photo-copy').set({ ...sourceA, id: 'sdk-photo-copy', url: '/media/sdk-copia.jpg' });
  const photo = await import('@/lib/decoracion/catalog-photo');
  jest.mocked(photo.loadDecorationPhoto).mockResolvedValue(Buffer.from('offline-demo-decoration-image'));
  await service.processDecorationDraft();
  expect(analyzeDecorationCatalog).toHaveBeenCalledTimes(1);
  expect((await db.collection(DRAFT_COLLECTION).where('status', '==', 'dismissed').get()).size).toBe(1);
  expect(await service.approvedCatalogTemplates()).toHaveLength(1);
});
