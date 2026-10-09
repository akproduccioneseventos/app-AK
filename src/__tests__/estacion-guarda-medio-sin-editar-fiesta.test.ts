/** @jest-environment node */
/**
 * Codex, auditoría 83 (orden 134):
 * - ENT83-GUEST: el invitado con el permiso de la estación sacaba el boomerang y el guardado se lo
 *   rechazaba ("No autorizado para modificar este evento"), porque se guardaba la fiesta entera
 *   por el camino que pide sesión del equipo o del portal. Ahora se agrega SOLO ese recuerdo.
 * - ENT83-360: la 360 mandaba `plataforma-360` (el nombre de la ruta) y el servidor lo rechazaba;
 *   la captura quedaba "esperando subida" para siempre.
 * Probado rompiéndolo: con `saveFiesta` de vuelta o sin el alias, se pone en rojo.
 */
let fiestaGuardada: any;
const transacciones: any[] = [];
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (_id: string, cambiar: (f: any) => any, opciones: any = {}) => {
    // Como la de verdad: sin `publicRsvp` exige permiso de escritura de la fiesta, que el invitado no tiene.
    if (!opciones.publicRsvp) return { success: false, error: 'No autorizado para modificar este evento.' };
    transacciones.push(opciones);
    fiestaGuardada = await cambiar(JSON.parse(JSON.stringify(fiestaGuardada)));
    return { success: true, updatedFiesta: fiestaGuardada };
  }),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => JSON.parse(JSON.stringify(fiestaGuardada))),
  saveFiesta: jest.fn(async () => ({ success: false, error: 'No autorizado para modificar este evento.' })),
}));
jest.mock('@/lib/auth/entertainment-token', () => ({
  createEntertainmentAccessToken: jest.fn(),
  hasEntertainmentGuestAccess: jest.fn(async (_f: string, moduleId: string, token: string) => token === `ok-${moduleId}`),
}));
jest.mock('@/lib/entertainment/station-config', () => ({
  getEntertainmentStationConfig: jest.fn(() => ({ enabled: true })),
  getPublicEntertainmentEvent: jest.fn(),
  isEntertainmentModuleId: (m: string) => ['bogue', 'plataforma360', 'fotocabina'].includes(m),
}));
jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: jest.fn(async (_b: any, p: string) => `https://almacen/${p}`) }));
jest.mock('@/app/actions/social-gallery', () => ({
  createSocialMediaPostFromUrlForStation: jest.fn(async () => ({ success: true, post: { id: 'post_1' } })),
}));
jest.mock('@/lib/social-fiesta/content-safety-ai', () => ({ checkImageSafety: jest.fn(async () => ({ safe: true })) }));
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(async () => { throw new Error('Sesion no autorizada.'); }) }));
jest.mock('@/lib/auth/event-access', () => ({ requireEventPermission: jest.fn(async () => { throw new Error('No autorizado'); }) }));

import { uploadEntretenimientoMedia } from '@/app/actions/fiesta/entretenimiento.actions';

function formulario(moduleId: string, token: string, clientMediaId = 'cap1') {
  const fd = new FormData();
  fd.append('fiestaId', 'f1');
  fd.append('moduleId', moduleId);
  fd.append('accessToken', token);
  fd.append('clientMediaId', clientMediaId);
  fd.append('file', new File([new Uint8Array([1, 2, 3])], 'loop.mp4', { type: 'video/mp4' }));
  return fd;
}

beforeEach(() => {
  transacciones.length = 0;
  fiestaGuardada = { id: 'f1', others: { pagos: { secreto: 1 } }, configuracion: { nombreEvento: 'Fiesta' } };
});

it('el invitado de Bogue guarda su recuerdo sin permiso para editar la fiesta', async () => {
  const r = await uploadEntretenimientoMedia(formulario('bogue', 'ok-bogue'));
  expect(r.success).toBe(true);
  expect(fiestaGuardada.others.entretenimiento.modules.bogue.media).toHaveLength(1);
  // Lo demás de la fiesta queda igual.
  expect(fiestaGuardada.others.pagos).toEqual({ secreto: 1 });
});

it('la 360 que manda el nombre de la ruta guarda en el módulo plataforma360', async () => {
  const r = await uploadEntretenimientoMedia(formulario('plataforma-360', 'ok-plataforma360'));
  expect(r.success).toBe(true);
  expect(fiestaGuardada.others.entretenimiento.modules.plataforma360.media[0].url).toContain('/plataforma360/');
});

it('el permiso de otra estación no sirve, y un módulo inventado sigue rechazado', async () => {
  const otra = await uploadEntretenimientoMedia(formulario('bogue', 'ok-fotocabina'));
  expect(otra.success).toBe(false);
  const inventado = await uploadEntretenimientoMedia(formulario('cualquier-cosa', 'ok-cualquier-cosa'));
  expect(inventado.success).toBe(false);
  expect(transacciones).toHaveLength(0);
});

it('el reintento de la misma captura no la duplica', async () => {
  await uploadEntretenimientoMedia(formulario('bogue', 'ok-bogue'));
  await uploadEntretenimientoMedia(formulario('bogue', 'ok-bogue'));
  expect(fiestaGuardada.others.entretenimiento.modules.bogue.media).toHaveLength(1);
});

it('un rechazo definitivo ("no es válido") no se reintenta para siempre', () => {
  const { classifyOfflineUploadError } = jest.requireActual('@/lib/offline/offline-upload-policy');
  expect(classifyOfflineUploadError('El modulo de entretenimiento no es valido.')).toBe('permanent');
  expect(classifyOfflineUploadError('Failed to fetch')).toBe('retryable');
});
