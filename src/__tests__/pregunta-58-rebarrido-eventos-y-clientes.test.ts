/** @jest-environment node */
/**
 * PREGUNTA 58, SEGUNDO BARRIDO, parte 3 (15 de octubre de 2026): crear un evento, copiar un evento,
 * crear un cliente y subir una foto al muro. Si la respuesta se pierde y la persona reintenta, no se
 * guarda dos veces (ni se repite la subida del archivo).
 *
 * Se usan las acciones reales. Las bases de mentira devuelven COPIAS en cada lectura.
 * Se probo rompiendolo: sacando la comprobacion "ya esta con ese id" de una accion, su prueba de
 * "misma identidad dos veces" se pone en rojo.
 */
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const archivos: Record<string, any> = {};

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => undefined),
  requirePermiso: jest.fn(async () => ({ ok: true })),
  requirePermisoAlguno: jest.fn(async () => ({ ok: true })),
  hasAppSession: jest.fn(async () => true),
  requirePermisoParaTocarClientes: jest.fn(async () => ({ ok: true })),
}));
jest.mock('@/lib/auth/session-token', () => ({ verifySession: jest.fn(async () => ({ success: true, user: { userId: 'u1', perfil: 'admin' } })) }));
jest.mock('@/lib/auth/event-access', () => ({ requireEventPermission: jest.fn(async () => undefined), requireFiestaWriteAccess: jest.fn(async () => undefined) }));
jest.mock('@/lib/security/portal-session', () => ({ verifyPortalSession: jest.fn(async () => false) }));
jest.mock('@/lib/server-cache', () => ({ cachedFetch: jest.fn(async (_k: string, f: () => Promise<unknown>) => f()), cacheInvalidate: jest.fn() }));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (p: string, porDefecto: any) => (archivos[p] === undefined ? copia(porDefecto) : copia(archivos[p]))),
  writeData: jest.fn(async (p: string, d: any) => { archivos[p] = copia(d); return true; }),
  createDataItem: jest.fn(async (p: string, _c: string, id: string, item: any) => {
    const l = archivos[p] || [];
    if (l.some((x: any) => x.id === id)) throw new Error('ya existe');
    archivos[p] = [...l, copia({ ...item, id })];
  }),
  mutateDataItem: jest.fn(async () => null),
  updateDataItem: jest.fn(async () => true),
  deleteDataItem: jest.fn(async () => true),
}));
jest.mock('@/lib/generic-json-store', () => ({
  mutarDocumentoConTransaccion: jest.fn(),
  mutateGenericJsonArray: jest.fn(),
}));
jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerHistorialCrudo: jest.fn(async () => []),
  leerFiestasCrudas: jest.fn(async () => Object.keys(archivos).filter((k) => k.startsWith('fiestas/')).map((k) => copia(archivos[k]))),
}));
jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({
  getFiestaByIdRaw: jest.fn(async (id: string) => (archivos[`fiestas/${id}.json`] ? copia(archivos[`fiestas/${id}.json`]) : null)),
  preserveFiestaSecrets: jest.fn(async (_id: string, f: any) => f),
}));
jest.mock('@/lib/notifications/create-notification', () => ({ createNotification: jest.fn(async () => ({ success: true })) }));
jest.mock('@/app/actions/whatsapp', () => ({ triggerWhatsAppAutomation: jest.fn(async () => undefined) }));
jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: jest.fn(async () => 'https://x/f.jpg'), deleteFromStorage: jest.fn(), getSignedUrl: jest.fn() }));
jest.mock('@/lib/commercial/public-rate-limit', () => ({ enforcePublicRateLimit: jest.fn() }));

// ---- Firestore de mentira para la galeria ----
const colecciones = new Map<string, Map<string, any>>();
const col = (n: string) => { if (!colecciones.has(n)) colecciones.set(n, new Map()); return colecciones.get(n)!; };
const ref = (n: string, id: string) => ({
  get: async () => ({ exists: col(n).has(id), data: () => copia(col(n).get(id)) }),
  set: async (v: any) => { col(n).set(id, copia(v)); },
  create: async (v: any) => { if (col(n).has(id)) { const e: any = new Error('ALREADY_EXISTS'); e.code = 6; throw e; } col(n).set(id, copia(v)); },
});
const consulta = (n: string): any => ({
  where: () => consulta(n),
  select: () => consulta(n),
  limit: () => consulta(n),
  get: async () => ({ size: col(n).size, empty: col(n).size === 0, docs: [] }),
});
jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: { collection: (n: string) => ({ doc: (id: string) => ref(n, id), ...consulta(n) }) },
  authAdmin: null,
}));
jest.mock('@/lib/social-fiesta/content-review', () => ({
  reviewSocialContent: ({ text }: { text: string }) => ({ status: 'approved', sanitizedText: text }),
  sanitizeSocialText: (t: string) => t,
  imageAiSafeDesde: jest.fn(),
}));
jest.mock('@/lib/social-fiesta/content-safety-ai', () => ({ checkImageSafety: jest.fn(async () => ({ safe: true })) }));
jest.mock('@/lib/games/misiones-fotos', () => ({ sumarMisionDeFoto: jest.fn(async () => undefined) }));
jest.mock('@/lib/games/juegos-en-vivo', () => ({ idDeMisionDelTag: jest.fn(() => null) }));

import { createFiestaVacia, duplicateFiesta } from '@/app/actions/fiesta/fiesta.actions';
import { saveCustomer } from '@/app/actions/customers';
import { uploadSocialPost } from '@/app/actions/social-gallery';
import { uploadToStorage } from '@/lib/firebase/storage';

const fiestasGuardadas = () => Object.keys(archivos).filter((k) => k.startsWith('fiestas/'));

beforeEach(() => {
  for (const k of Object.keys(archivos)) delete archivos[k];
  colecciones.clear();
  (uploadToStorage as jest.Mock).mockClear();
  delete process.env.AK_USE_LOCAL_JSON_ONLY;
});

describe('Evento nuevo', () => {
  it('misma identidad dos veces = un solo evento', async () => {
    const a = await createFiestaVacia('c1', 'Ana', { idIntento: 'intento-evento-01' });
    // Mientras tanto la persona ya empezo a cargar datos en el evento.
    archivos[`fiestas/${a.newFiestaId}.json`].configuracion.nombreEvento = 'Cumple de Ana';
    const b = await createFiestaVacia('c1', 'Ana', { idIntento: 'intento-evento-01' });
    expect(a.success && b.success).toBe(true);
    expect(b.newFiestaId).toBe(a.newFiestaId);
    expect(fiestasGuardadas()).toHaveLength(1);
    // El reintento NO pisa el evento ya trabajado con uno en blanco.
    expect(archivos[`fiestas/${a.newFiestaId}.json`].configuracion.nombreEvento).toBe('Cumple de Ana');
  });
  it('identidad distinta = dos eventos', async () => {
    await createFiestaVacia('c1', 'Ana', { idIntento: 'intento-evento-01' });
    await createFiestaVacia('c1', 'Ana', { idIntento: 'intento-evento-02' });
    expect(fiestasGuardadas()).toHaveLength(2);
  });
});

describe('Copia de un evento', () => {
  it('misma identidad dos veces = una sola copia', async () => {
    const base = await createFiestaVacia('c1', 'Ana', { idIntento: 'intento-evento-01' });
    const a = await duplicateFiesta(base.newFiestaId!, { idIntento: 'intento-copia-001' });
    archivos[`fiestas/${a.newFiestaId}.json`].configuracion.nombreEvento = 'Copia ya trabajada';
    const b = await duplicateFiesta(base.newFiestaId!, { idIntento: 'intento-copia-001' });
    expect(a.success && b.success).toBe(true);
    expect(b.newFiestaId).toBe(a.newFiestaId);
    expect(fiestasGuardadas()).toHaveLength(2);
    expect(archivos[`fiestas/${a.newFiestaId}.json`].configuracion.nombreEvento).toBe('Copia ya trabajada');
  });
  it('identidad distinta = dos copias', async () => {
    const base = await createFiestaVacia('c1', 'Ana', { idIntento: 'intento-evento-01' });
    await duplicateFiesta(base.newFiestaId!, { idIntento: 'intento-copia-001' });
    await duplicateFiesta(base.newFiestaId!, { idIntento: 'intento-copia-002' });
    expect(fiestasGuardadas()).toHaveLength(3);
  });
});

describe('Cliente nuevo', () => {
  const dato = () => ({ name: 'Ana Perez', phone: '099123456' } as any);
  const clientes = () => (archivos['customers.json'] || []) as any[];
  it('misma identidad dos veces = un solo cliente', async () => {
    const a = await saveCustomer(dato(), { idIntento: 'intento-cli-0001', skipFiestaCreation: true });
    const b = await saveCustomer(dato(), { idIntento: 'intento-cli-0001', skipFiestaCreation: true });
    expect(a.success && b.success).toBe(true);
    expect(b.id).toBe(a.id);
    expect(clientes()).toHaveLength(1);
  });
  it('identidad distinta = dos clientes', async () => {
    await saveCustomer(dato(), { idIntento: 'intento-cli-0001', skipFiestaCreation: true });
    await saveCustomer(dato(), { idIntento: 'intento-cli-0002', skipFiestaCreation: true });
    expect(clientes()).toHaveLength(2);
  });
});

describe('Foto subida al muro', () => {
  const formulario = (idIntento: string) => {
    const f = new FormData();
    f.append('fiestaId', 'f1');
    f.append('file', new File([new Uint8Array([1, 2, 3])], 'foto.jpg', { type: 'image/jpeg' }));
    f.append('authorName', 'Ana');
    f.append('idIntento', idIntento);
    return f;
  };
  beforeEach(() => {
    archivos['fiestas/f1.json'] = { id: 'f1', invitados: [], socialGallerySettings: { enabled: true, uploadsActive: true } };
  });
  it('misma identidad dos veces = una sola foto y el archivo se sube UNA vez', async () => {
    const a = await uploadSocialPost(formulario('intento-foto-0001'));
    const b = await uploadSocialPost(formulario('intento-foto-0001'));
    expect(a.success).toBe(true);
    expect(b.success).toBe(true);
    expect(b.post?.id).toBe(a.post?.id);
    expect(col('social_gallery_posts').size).toBe(1);
    expect(uploadToStorage).toHaveBeenCalledTimes(1);
  });
  it('identidad distinta = dos fotos', async () => {
    await uploadSocialPost(formulario('intento-foto-0001'));
    await uploadSocialPost(formulario('intento-foto-0002'));
    expect(col('social_gallery_posts').size).toBe(2);
  });
});
