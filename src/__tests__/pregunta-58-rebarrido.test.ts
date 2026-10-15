/**
 * PREGUNTA 58, SEGUNDO BARRIDO (15 de octubre de 2026): la respuesta de un "crear/agregar" se pierde,
 * la persona vuelve a tocar el boton y se guarda dos veces.
 *
 * Aca, las altas de pantallas del equipo y del invitado que NO tocan plata: plantillas (itinerario,
 * plano del salon, decoracion), foto del moodboard, incidente en vivo, trivia, cancion, dedicatoria,
 * comentario y mensaje de chat.
 *
 * Se usan las acciones reales. Las bases de mentira devuelven COPIAS en cada lectura (como la de
 * verdad) y `create` rechaza un id que ya existe.
 *
 * Se probo rompiendolo: sacando la comprobacion "ya esta con ese id" de una accion, su prueba de
 * "misma identidad dos veces" se pone en rojo.
 */
jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => undefined),
  requirePermiso: jest.fn(async () => ({ ok: true })),
  requirePermisoAlguno: jest.fn(async () => ({ ok: true })),
  hasAppSession: jest.fn(async () => true),
}));
jest.mock('@/lib/auth/event-access', () => ({ requireEventPermission: jest.fn(async () => undefined) }));

const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

// ---- Archivos JSON (plantillas) ----
const archivos: Record<string, any[]> = {};
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => (archivos[archivo] === undefined ? copia(porDefecto) : copia(archivos[archivo]))),
  writeData: jest.fn(async (archivo: string, datos: any) => { archivos[archivo] = copia(datos); }),
}));

// ---- Fiesta en memoria (moodboard e incidente en vivo) ----
let fiesta: any = {};
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (_id: string, fn: (f: any) => any) => { fiesta = copia(fn(copia(fiesta))); return { success: true }; }),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => copia(fiesta)),
  saveFiesta: jest.fn(async () => ({ success: true })),
  updateFiestaPartial: jest.fn(async (_id: string, parcial: any) => { fiesta = { ...fiesta, ...copia(parcial) }; return { success: true }; }),
}));
jest.mock('@/app/actions/fiesta/costos.actions', () => ({ updateGestionCostos: jest.fn(async () => ({ success: true })) }));
jest.mock('@/lib/ai/gemini-image', () => ({ generateGeminiImage: jest.fn() }));
jest.mock('@/lib/ai/foto-de-referencia', () => ({ fotoDeReferenciaSegura: jest.fn() }));
jest.mock('@/lib/fiesta/leer-fiestas', () => ({ leerFiestasCrudas: jest.fn(async () => []) }));

// ---- Firestore de mentira (trivia, cancion, dedicatoria, comentario, chat) ----
const colecciones = new Map<string, Map<string, any>>();
const col = (n: string) => { if (!colecciones.has(n)) colecciones.set(n, new Map()); return colecciones.get(n)!; };
const referencia = (nombre: string, id: string) => ({
  id,
  get: async () => { const v = col(nombre).get(id); return { exists: v !== undefined, data: () => (v === undefined ? undefined : copia(v)), id }; },
  set: async (valor: any) => { col(nombre).set(id, copia(valor)); },
  create: async (valor: any) => {
    if (col(nombre).has(id)) { const e: any = new Error('6 ALREADY_EXISTS'); e.code = 6; throw e; }
    col(nombre).set(id, copia(valor));
  },
  update: async (cambios: any) => {
    const actual = col(nombre).get(id) || {};
    const siguiente = { ...actual };
    for (const [k, v] of Object.entries(cambios)) {
      // arrayUnion de mentira: el valor llega marcado con `__union`.
      siguiente[k] = (v as any)?.__union ? [...(actual[k] || []), ...copia((v as any).__union)] : v;
    }
    col(nombre).set(id, copia(siguiente));
  },
});
const db = {
  collection: (nombre: string) => ({
    doc: (id: string) => referencia(nombre, id),
    where: () => ({ get: async () => ({ docs: [...col(nombre).entries()].map(([id, v]) => ({ ref: referencia(nombre, id), data: () => copia(v) })) }) }),
  }),
  batch: () => ({ update: () => undefined, commit: async () => undefined }),
};
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: db }));
jest.mock('firebase-admin', () => ({ __esModule: true, default: { firestore: { FieldValue: { arrayUnion: (...v: any[]) => ({ __union: v }), increment: (n: number) => n } } } }));

jest.mock('@/lib/social-fiesta/content-review', () => ({
  reviewSocialContent: ({ text }: { text: string }) => ({ status: 'approved', sanitizedText: text }),
  sanitizeSocialText: (t: string) => t,
  imageAiSafeDesde: jest.fn(),
}));
jest.mock('@/lib/social-fiesta/content-safety-ai', () => ({ checkImageSafety: jest.fn() }));
jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: jest.fn(), deleteFromStorage: jest.fn(), getSignedUrl: jest.fn() }));
jest.mock('@/lib/commercial/public-rate-limit', () => ({ enforcePublicRateLimit: jest.fn() }));
jest.mock('@/lib/commercial/social-interaction-rate-limit', () => ({ enforceSocialInteractionRateLimit: jest.fn() }));
jest.mock('@/app/actions/fiesta/portal.actions', () => ({ getFiestaByAccessKey: jest.fn() }));
jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({ getFiestaByIdRaw: jest.fn() }));
jest.mock('@/lib/security/portal-session', () => ({ verifyPortalSession: jest.fn() }));
jest.mock('@/lib/games/misiones-fotos', () => ({ sumarMisionDeFoto: jest.fn() }));
jest.mock('@/lib/games/juegos-en-vivo', () => ({ idDeMisionDelTag: jest.fn() }));

import { saveItineraryTemplate } from '@/app/actions/itinerary-templates';
import { saveSalonLayoutTemplate } from '@/app/actions/salon-layout-templates';
import { saveDecoCanvasTemplate } from '@/app/actions/deco-canvas-templates';
import { addMoodboardItem } from '@/app/actions/fiesta/decoracion.actions';
import { addIncidente } from '@/app/actions/fiesta/live.actions';
import { createPoll, addSongRequest, addDedication } from '@/app/actions/social-interactive';
import { addCommentToPost, addChatMessage } from '@/app/actions/social-gallery';

beforeEach(() => {
  for (const k of Object.keys(archivos)) delete archivos[k];
  colecciones.clear();
  fiesta = { id: 'f1', socialGallerySettings: { showDedications: true }, decoracion: {}, invitados: [] };
});

describe('Plantilla de itinerario', () => {
  const guardadas = () => archivos['itinerary-templates.json'] || [];
  it('misma identidad dos veces = una sola plantilla', async () => {
    const a = await saveItineraryTemplate('Boda', [], undefined, { idIntento: 'intento-iti-0001' });
    const b = await saveItineraryTemplate('Boda', [], undefined, { idIntento: 'intento-iti-0001' });
    expect(a.success && b.success).toBe(true);
    expect(guardadas()).toHaveLength(1);
    expect(b.template?.id).toBe(a.template?.id);
  });
  it('identidad distinta = dos plantillas', async () => {
    await saveItineraryTemplate('Boda', [], undefined, { idIntento: 'intento-iti-0001' });
    await saveItineraryTemplate('Boda', [], undefined, { idIntento: 'intento-iti-0002' });
    expect(guardadas()).toHaveLength(2);
  });
});

describe('Plantilla del plano del salon', () => {
  const plano: any = { salonWidth: 10, salonHeight: 10, salonElements: [] };
  const guardadas = () => archivos['salon-layout-templates.json'] || [];
  it('misma identidad dos veces = una sola plantilla', async () => {
    const a = await saveSalonLayoutTemplate('Plano', plano, { idIntento: 'intento-sal-0001' });
    const b = await saveSalonLayoutTemplate('Plano', plano, { idIntento: 'intento-sal-0001' });
    expect(a.success && b.success).toBe(true);
    expect(guardadas()).toHaveLength(1);
    expect(b.template?.id).toBe(a.template?.id);
  });
  it('identidad distinta = dos plantillas', async () => {
    await saveSalonLayoutTemplate('Plano', plano, { idIntento: 'intento-sal-0001' });
    await saveSalonLayoutTemplate('Plano', plano, { idIntento: 'intento-sal-0002' });
    expect(guardadas()).toHaveLength(2);
  });
});

describe('Plantilla del tablero de decoracion', () => {
  const guardadas = () => archivos['deco-canvas-templates.json'] || [];
  it('misma identidad dos veces = una sola plantilla', async () => {
    const a = await saveDecoCanvasTemplate('Deco', [], '#fff', undefined, undefined, { idIntento: 'intento-dec-0001' });
    const b = await saveDecoCanvasTemplate('Deco', [], '#fff', undefined, undefined, { idIntento: 'intento-dec-0001' });
    expect(a.success && b.success).toBe(true);
    expect(guardadas()).toHaveLength(1);
    expect(b.template?.id).toBe(a.template?.id);
  });
  it('identidad distinta = dos plantillas', async () => {
    await saveDecoCanvasTemplate('Deco', [], '#fff', undefined, undefined, { idIntento: 'intento-dec-0001' });
    await saveDecoCanvasTemplate('Deco', [], '#fff', undefined, undefined, { idIntento: 'intento-dec-0002' });
    expect(guardadas()).toHaveLength(2);
  });
});

describe('Foto del moodboard', () => {
  const fotos = () => fiesta.decoracion?.moodboardItems || [];
  it('misma identidad dos veces = una sola foto', async () => {
    const a = await addMoodboardItem('f1', 'https://x/a.jpg', undefined, { idIntento: 'intento-mood-001' });
    const b = await addMoodboardItem('f1', 'https://x/a.jpg', undefined, { idIntento: 'intento-mood-001' });
    expect(a.success && b.success).toBe(true);
    expect(fotos()).toHaveLength(1);
  });
  it('identidad distinta = dos fotos', async () => {
    await addMoodboardItem('f1', 'https://x/a.jpg', undefined, { idIntento: 'intento-mood-001' });
    await addMoodboardItem('f1', 'https://x/a.jpg', undefined, { idIntento: 'intento-mood-002' });
    expect(fotos()).toHaveLength(2);
  });
});

describe('Incidente de la fiesta en vivo', () => {
  const lista = () => fiesta.liveState?.incidentes || [];
  it('misma identidad dos veces = un solo incidente', async () => {
    const a = await addIncidente('f1', 'Se corto la luz', { idIntento: 'intento-live-001' });
    const b = await addIncidente('f1', 'Se corto la luz', { idIntento: 'intento-live-001' });
    expect(a.success && b.success).toBe(true);
    expect(lista()).toHaveLength(1);
  });
  it('identidad distinta = dos incidentes', async () => {
    await addIncidente('f1', 'Se corto la luz', { idIntento: 'intento-live-001' });
    await addIncidente('f1', 'Se corto la luz', { idIntento: 'intento-live-002' });
    expect(lista()).toHaveLength(2);
  });
});

describe('Trivia nueva', () => {
  it('misma identidad dos veces = una sola trivia', async () => {
    const a = await createPoll('f1', 'Cual?', ['A', 'B'], { idIntento: 'intento-poll-001' });
    const b = await createPoll('f1', 'Cual?', ['A', 'B'], { idIntento: 'intento-poll-001' });
    expect(a.success && b.success).toBe(true);
    expect(col('social_polls').size).toBe(1);
    expect(b.poll?.id).toBe(a.poll?.id);
  });
  it('identidad distinta = dos trivias', async () => {
    await createPoll('f1', 'Cual?', ['A', 'B'], { idIntento: 'intento-poll-001' });
    await createPoll('f1', 'Cual?', ['A', 'B'], { idIntento: 'intento-poll-002' });
    expect(col('social_polls').size).toBe(2);
  });
});

describe('Cancion pedida', () => {
  it('misma identidad dos veces = una sola cancion', async () => {
    const a = await addSongRequest('f1', 'Tema A', 'Ana', { idIntento: 'intento-song-001' });
    const b = await addSongRequest('f1', 'Tema A', 'Ana', { idIntento: 'intento-song-001' });
    expect(a.success && b.success).toBe(true);
    expect(col('social_song_requests').size).toBe(1);
    expect(b.request?.id).toBe(a.request?.id);
  });
  it('identidad distinta = dos canciones', async () => {
    await addSongRequest('f1', 'Tema A', 'Ana', { idIntento: 'intento-song-001' });
    await addSongRequest('f1', 'Tema A', 'Ana', { idIntento: 'intento-song-002' });
    expect(col('social_song_requests').size).toBe(2);
  });
});

describe('Dedicatoria', () => {
  it('misma identidad dos veces = una sola dedicatoria', async () => {
    const a = await addDedication('f1', 'Feliz cumple', 'Ana', undefined, { idIntento: 'intento-ded-0001' });
    const b = await addDedication('f1', 'Feliz cumple', 'Ana', undefined, { idIntento: 'intento-ded-0001' });
    expect(a.success && b.success).toBe(true);
    expect(col('social_dedications').size).toBe(1);
    expect(b.dedication?.id).toBe(a.dedication?.id);
  });
  it('identidad distinta = dos dedicatorias', async () => {
    await addDedication('f1', 'Feliz cumple', 'Ana', undefined, { idIntento: 'intento-ded-0001' });
    await addDedication('f1', 'Feliz cumple', 'Ana', undefined, { idIntento: 'intento-ded-0002' });
    expect(col('social_dedications').size).toBe(2);
  });
});

describe('Comentario en una publicacion', () => {
  const total = () => (col('social_gallery_posts').get('p1')?.comments || []).length;
  beforeEach(() => { col('social_gallery_posts').set('p1', { id: 'p1', fiestaId: 'f1', comments: [] }); });
  it('misma identidad dos veces = un solo comentario', async () => {
    const a = await addCommentToPost('p1', 'Linda fiesta', 'Ana', {}, { idIntento: 'intento-com-0001' });
    const b = await addCommentToPost('p1', 'Linda fiesta', 'Ana', {}, { idIntento: 'intento-com-0001' });
    expect(a.success && b.success).toBe(true);
    expect(total()).toBe(1);
    expect(b.comment?.id).toBe(a.comment?.id);
  });
  it('identidad distinta = dos comentarios', async () => {
    await addCommentToPost('p1', 'Linda fiesta', 'Ana', {}, { idIntento: 'intento-com-0001' });
    await addCommentToPost('p1', 'Linda fiesta', 'Ana', {}, { idIntento: 'intento-com-0002' });
    expect(total()).toBe(2);
  });
});

describe('Mensaje del chat', () => {
  const chats = () => col('social_chat').size;
  it('misma identidad dos veces = un solo mensaje', async () => {
    const a = await addChatMessage('f1', 'Hola', 'Ana', {}, { idIntento: 'intento-chat-001' });
    const b = await addChatMessage('f1', 'Hola', 'Ana', {}, { idIntento: 'intento-chat-001' });
    expect(a.success && b.success).toBe(true);
    expect(chats()).toBe(1);
    expect(b.message?.id).toBe(a.message?.id);
  });
  it('identidad distinta = dos mensajes', async () => {
    await addChatMessage('f1', 'Hola', 'Ana', {}, { idIntento: 'intento-chat-001' });
    await addChatMessage('f1', 'Hola', 'Ana', {}, { idIntento: 'intento-chat-002' });
    expect(chats()).toBe(2);
  });
});
