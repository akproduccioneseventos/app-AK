/** @jest-environment node */
/**
 * Orden 144 (Codex, ENT93-MOD): cuando el analisis automatico de la imagen se caia (proveedor,
 * clave), el muro tomaba "no revisada" como "contenido adulto" y rechazaba la foto: nunca se creaba
 * el posteo y nadie la veia. Ahora hay TRES estados:
 *   segura      -> se publica segun la regla de aprobacion de la fiesta
 *   riesgosa    -> se rechaza (riesgo real)
 *   sin_revisar -> queda PENDIENTE de aprobacion manual: nunca aprobada, nunca en el muro publico
 *
 * Se prueba con el muro de verdad (createSocialMediaPostFromUrlForStation + el lector publico) y un
 * almacen en memoria que devuelve COPIAS, como la base real.
 *
 * Probado rompiendo: (1) con `imageAiSafe: input.revisionManual === false` de vuelta, "sin revisar"
 * y el video se rechazan y el test de pendiente se pone en rojo; (2) si el lector publico deja de
 * filtrar con `soloAprobados`, la pendiente aparece y el test del lector se pone en rojo; (3) si
 * "sin_revisar" se tratara como segura, la foto saldria aprobada con `requireApproval: false` y el
 * test de "nunca aprobada" se pone en rojo.
 */
let almacen: any[] = [];
let fiesta: any;
let esModerador = false;

jest.mock('@/lib/firebase/modo-local', () => ({
  sinBaseDisponible: () => true,
  hayEmuladorDeBase: () => false,
  hayEmuladorDeArchivos: () => false,
}));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => JSON.parse(JSON.stringify(almacen))),
  writeData: jest.fn(async (_ruta: string, datos: any[]) => { almacen = JSON.parse(JSON.stringify(datos)); }),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => JSON.parse(JSON.stringify(fiesta))),
  saveFiesta: jest.fn(),
}));
jest.mock('@/lib/auth/entertainment-token', () => ({
  verifyEntertainmentAccessToken: jest.fn(() => true),
  createEntertainmentAccessToken: jest.fn(),
  hasEntertainmentGuestAccess: jest.fn(async () => true),
}));
jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: jest.fn(async () => {
    if (!esModerador) throw new Error('No autorizado');
  }),
}));

import { createSocialMediaPostFromUrlForStation, getPublicSocialPosts, getSocialPosts } from '@/app/actions/social-gallery';
import { imageAiSafeDesde, reviewSocialContent } from '@/lib/social-fiesta/content-review';

const ENTRADA = {
  fiestaId: 'f1',
  mediaUrl: 'https://almacen/foto.jpg',
  mediaType: 'image' as const,
  authorName: 'Ana',
  sourceModule: 'espejoMagicoIA',
  postId: 'post_ent_cap1',
};

beforeEach(() => {
  almacen = [];
  esModerador = false;
  fiesta = { id: 'f1', socialGallerySettings: { requireApproval: false }, invitados: [] };
});

it('los tres estados se traducen sin confundir "no revisada" con "riesgosa"', () => {
  expect(imageAiSafeDesde('segura')).toBe(true);
  expect(imageAiSafeDesde('riesgosa')).toBe(false);
  expect(imageAiSafeDesde('sin_revisar')).toBeUndefined();
  expect(reviewSocialContent({ type: 'image', imageAiSafe: undefined, moderationMode: 'automatico' }).status).toBe('pending_review');
  expect(reviewSocialContent({ type: 'image', imageAiSafe: false, moderationMode: 'automatico' }).status).toBe('blocked');
});

it('sin revisar: el posteo se crea PENDIENTE, aunque la fiesta no pida aprobacion', async () => {
  const r = await createSocialMediaPostFromUrlForStation({ ...ENTRADA, revisionImagen: 'sin_revisar' }, 'tok');
  expect(r.success).toBe(true);
  expect(r.post?.moderationStatus).toBe('pending');
  expect(almacen).toHaveLength(1);
  expect(almacen[0].moderationStatus).toBe('pending');
});

it('el aviso viejo (revisionManual: true, o ninguno) tambien queda pendiente: ya no se rechaza', async () => {
  const viejo = await createSocialMediaPostFromUrlForStation({ ...ENTRADA, revisionManual: true }, 'tok');
  expect(viejo.success).toBe(true);
  expect(viejo.post?.moderationStatus).toBe('pending');
  const sinAviso = await createSocialMediaPostFromUrlForStation({ ...ENTRADA, postId: 'post_ent_cap2' }, 'tok');
  expect(sinAviso.success).toBe(true);
  expect(sinAviso.post?.moderationStatus).toBe('pending');
});

it('un video (nunca se revisa solo) queda pendiente, no rechazado', async () => {
  const r = await createSocialMediaPostFromUrlForStation(
    { ...ENTRADA, mediaType: 'video', mediaUrl: 'https://almacen/v.mp4', revisionImagen: 'sin_revisar' }, 'tok');
  expect(r.success).toBe(true);
  expect(r.post?.moderationStatus).toBe('pending');
});

it('riesgo real: se rechaza y no se crea ningun posteo', async () => {
  const r = await createSocialMediaPostFromUrlForStation({ ...ENTRADA, revisionImagen: 'riesgosa' }, 'tok');
  expect(r.success).toBe(false);
  expect(r.bloqueado).toBe(true);
  expect(almacen).toHaveLength(0);
});

it('texto bloqueado se sigue rechazando aunque la imagen sea segura', async () => {
  const r = await createSocialMediaPostFromUrlForStation(
    { ...ENTRADA, revisionImagen: 'segura', caption: 'puta madre' }, 'tok');
  expect(r.success).toBe(false);
  expect(r.bloqueado).toBe(true);
  expect(almacen).toHaveLength(0);
});

it('segura con la fiesta sin aprobacion obligatoria: se publica; con aprobacion obligatoria queda pendiente', async () => {
  const libre = await createSocialMediaPostFromUrlForStation({ ...ENTRADA, revisionImagen: 'segura' }, 'tok');
  expect(libre.post?.moderationStatus).toBe('approved');
  fiesta.socialGallerySettings.requireApproval = true;
  const moderada = await createSocialMediaPostFromUrlForStation({ ...ENTRADA, postId: 'post_ent_cap3', revisionImagen: 'segura' }, 'tok');
  expect(moderada.post?.moderationStatus).toBe('pending');
});

it('reintento de la MISMA captura: un solo posteo, y no pisa lo que el moderador ya decidio', async () => {
  const uno = await createSocialMediaPostFromUrlForStation({ ...ENTRADA, revisionImagen: 'sin_revisar' }, 'tok');
  // El moderador la aprueba entre un intento y el otro.
  almacen = almacen.map((p) => ({ ...p, moderationStatus: 'approved' }));
  const dos = await createSocialMediaPostFromUrlForStation({ ...ENTRADA, revisionImagen: 'sin_revisar' }, 'tok');
  expect(almacen).toHaveLength(1);
  expect(uno.post?.id).toBe(dos.post?.id);
  expect(dos.post?.moderationStatus).toBe('approved');
});

it('el lector publico NO muestra la pendiente; el moderador la ve; al aprobarla se ve un solo posteo', async () => {
  await createSocialMediaPostFromUrlForStation({ ...ENTRADA, revisionImagen: 'sin_revisar' }, 'tok');
  expect(await getPublicSocialPosts('f1')).toHaveLength(0);
  expect(await getSocialPosts('f1')).toHaveLength(0); // sin permiso de moderar, tampoco

  esModerador = true;
  const paraModerar = await getSocialPosts('f1');
  expect(paraModerar).toHaveLength(1);
  expect(paraModerar[0].moderationStatus).toBe('pending');
  // Aun siendo moderador, el lector PUBLICO sigue sin mostrarla.
  expect(await getPublicSocialPosts('f1')).toHaveLength(0);

  almacen = almacen.map((p) => ({ ...p, moderationStatus: 'approved' }));
  await createSocialMediaPostFromUrlForStation({ ...ENTRADA, revisionImagen: 'sin_revisar' }, 'tok'); // recarga/reintento
  esModerador = false;
  expect(await getPublicSocialPosts('f1')).toHaveLength(1);
});

it('la estacion sin credencial valida sigue rechazada (el permiso no se aflojo)', async () => {
  const { verifyEntertainmentAccessToken } = jest.requireMock('@/lib/auth/entertainment-token');
  verifyEntertainmentAccessToken.mockReturnValueOnce(false);
  const r = await createSocialMediaPostFromUrlForStation({ ...ENTRADA, revisionImagen: 'segura' }, 'malo');
  expect(r.success).toBe(false);
  expect(almacen).toHaveLength(0);
});
