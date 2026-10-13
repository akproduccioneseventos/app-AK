/** @jest-environment node */
/**
 * La foto de una misión (`momentTag` = `mision:<id>`) subida desde el celular del invitado en
 * `/evento/social/[fiestaId]` suma los puntos de la misión en el servidor, una vez por invitado y
 * misión. Se prueba con la acción real `uploadSocialPost` y una base que devuelve copias.
 */
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
let fiesta: any;
let turno: Promise<unknown> = Promise.resolve();
const subidas: any[] = [];

jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn((_id: string, cambiar: (f: any) => any) => {
    const r = turno.then(async () => {
      try { fiesta = copia(await cambiar(copia(fiesta))); return { success: true }; }
      catch (e: any) { return { success: false, error: e.message }; }
    });
    turno = r.catch(() => undefined);
    return r;
  }),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({ getFiestaById: jest.fn(async () => copia(fiesta)), saveFiesta: jest.fn() }));
jest.mock('@/app/actions/fiesta/portal.actions', () => ({ getFiestaByAccessKey: jest.fn() }));
jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({ getFiestaByIdRaw: jest.fn() }));
jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: jest.fn(async () => 'https://fotos.test/foto.jpg'), deleteFromStorage: jest.fn() }));
jest.mock('@/lib/social-fiesta/content-safety-ai', () => ({ checkImageSafety: jest.fn(async () => ({ safe: true, reason: 'clean' })) }));
jest.mock('@/lib/auth/require-session', () => ({ hasAppSession: jest.fn(async () => false), requirePermiso: jest.fn() }));
jest.mock('@/lib/auth/event-access', () => ({ requireEventPermission: jest.fn() }));
jest.mock('@/lib/commercial/public-rate-limit', () => ({ enforcePublicRateLimit: jest.fn(async () => undefined) }));
jest.mock('@/lib/security/portal-session', () => ({ verifyPortalSession: jest.fn() }));
jest.mock('@/lib/firebase/server', () => {
  const consulta: any = { where: () => consulta, select: () => consulta, limit: () => consulta, get: async () => ({ size: 0, empty: true, docs: [] }) };
  return {
    dbAdmin: {
      collection: () => ({ ...consulta, doc: (id: string) => ({ set: async (d: any) => { subidas.push({ id, ...d }); } }) }),
    },
  };
});

import { uploadSocialPost } from '@/app/actions/social-gallery';

function formulario(extra: Record<string, string>) {
  const f = new FormData();
  f.append('fiestaId', 'f1');
  f.append('file', new File([new Uint8Array([1, 2, 3])], 'foto.jpg', { type: 'image/jpeg' }));
  for (const [k, v] of Object.entries({ guestId: 'g1', guestAccessToken: 'tok1', ...extra })) f.append(k, v);
  return f;
}

beforeEach(() => {
  turno = Promise.resolve();
  subidas.length = 0;
  fiesta = {
    id: 'f1',
    socialGallerySettings: { enabled: true, uploadsActive: true, requireApproval: true },
    invitados: [{ id: 'g1', nombre: 'Sofía Pérez', guestAccessToken: 'tok1', tableNumber: '4' }],
  };
});

it('subir la foto de una misión suma sus puntos, aunque la foto quede esperando aprobación', async () => {
  const r = await uploadSocialPost(formulario({ momentTag: 'mision:m1' }));
  expect(r.success).toBe(true);
  expect(subidas[0].moderationStatus).toBe('pending');
  expect(subidas[0].momentTag).toBe('mision:m1');
  expect(fiesta.misionesFotos.g1).toEqual({ nombre: 'Sofía Pérez', misiones: ['m1'], puntos: 100 });
});

it('repetir la misma misión (otra foto) no suma otra vez', async () => {
  await uploadSocialPost(formulario({ momentTag: 'mision:m1', imageHash: 'a' }));
  await uploadSocialPost(formulario({ momentTag: 'mision:m1', imageHash: 'b' }));
  expect(subidas).toHaveLength(2);
  expect(fiesta.misionesFotos.g1.puntos).toBe(100);
});

it('una misión inexistente, o una foto común, no suman', async () => {
  await uploadSocialPost(formulario({ momentTag: 'mision:inventada' }));
  await uploadSocialPost(formulario({ momentTag: 'brindis', imageHash: 'c' }));
  await uploadSocialPost(formulario({ imageHash: 'd' }));
  expect(subidas).toHaveLength(3);
  expect(fiesta.misionesFotos).toBeUndefined();
});

it('si la foto se rechaza (credencial falsa) no suma nada', async () => {
  const r = await uploadSocialPost(formulario({ momentTag: 'mision:m1', guestAccessToken: 'falsa' }));
  expect(r.success).toBe(false);
  expect(fiesta.misionesFotos).toBeUndefined();
});
