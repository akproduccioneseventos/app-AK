/** @jest-environment node */
/**
 * Orden 144 (Codex, ENT93-MOD): la foto del espejo se guardaba, el analisis automatico fallaba, el
 * posteo del muro no se creaba y la respuesta decia `success: true`: la pantalla anunciaba "Foto
 * enviada al muro" sin ningun posteo. Ahora la respuesta distingue:
 *   publicado / pendiente_aprobacion (+ sinRevisar) / error / rechazado
 * y el reintento de la MISMA captura no duplica archivo ni posteo ni vuelve a pagar la revision.
 *
 * Probado rompiendo: (1) si `success` vuelve a ser true cuando el posteo falla, el test del posteo
 * caido se pone en rojo; (2) si el reintento vuelve a subir el archivo o a revisarlo, los de
 * "una sola subida / una sola revision" se ponen en rojo; (3) si el aviso de Vision caido se
 * tratara como riesgo (rechazo), el de "pendiente" se pone en rojo; (4) si una captura con riesgo
 * real se guardara, el de rechazo se pone en rojo.
 */
let fiestaGuardada: any;
const posteos: any[] = [];
let respuestaDelMuro: (entrada: any) => any;

jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (_id: string, cambiar: (f: any) => any) => {
    // Como la base de verdad: lee una COPIA, cambia y escribe.
    fiestaGuardada = await cambiar(JSON.parse(JSON.stringify(fiestaGuardada)));
    return { success: true, updatedFiesta: fiestaGuardada };
  }),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => JSON.parse(JSON.stringify(fiestaGuardada))),
  saveFiesta: jest.fn(),
}));
jest.mock('@/lib/auth/entertainment-token', () => ({
  createEntertainmentAccessToken: jest.fn(),
  hasEntertainmentGuestAccess: jest.fn(async (_f: string, m: string, token: string) => token === `ok-${m}`),
}));
jest.mock('@/lib/entertainment/station-config', () => ({
  getEntertainmentStationConfig: jest.fn(() => ({ enabled: true })),
  getPublicEntertainmentEvent: jest.fn(),
  isEntertainmentModuleId: (m: string) => ['espejoMagicoIA', 'fotocabina', 'bogue'].includes(m),
}));
const subir = jest.fn(async (_b: any, p: string) => `https://almacen/${p}`);
jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: (...a: any[]) => (subir as any)(...a) }));
jest.mock('@/app/actions/social-gallery', () => ({
  createSocialMediaPostFromUrlForStation: jest.fn(async (entrada: any) => {
    posteos.push(entrada);
    return respuestaDelMuro(entrada);
  }),
}));
const revisar = jest.fn();
jest.mock('@/lib/social-fiesta/content-safety-ai', () => ({ checkImageSafety: (...a: any[]) => (revisar as any)(...a) }));
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(async () => { throw new Error('Sesion no autorizada.'); }) }));
jest.mock('@/lib/auth/event-access', () => ({ requireEventPermission: jest.fn(async () => { throw new Error('No autorizado'); }) }));

import { uploadEntretenimientoMedia } from '@/app/actions/fiesta/entretenimiento.actions';

function formulario(captura = 'cap1') {
  const fd = new FormData();
  fd.append('fiestaId', 'f1');
  fd.append('moduleId', 'espejoMagicoIA');
  fd.append('accessToken', 'ok-espejoMagicoIA');
  fd.append('clientMediaId', captura);
  fd.append('file', new File([new Uint8Array([1, 2, 3])], 'espejo.jpg', { type: 'image/jpeg' }));
  return fd;
}
const medios = () => fiestaGuardada.others?.entretenimiento?.modules?.espejoMagicoIA?.media || [];
const postPendiente = (e: any) => ({ success: true, post: { id: e.postId, moderationStatus: 'pending' } });
const postPublicado = (e: any) => ({ success: true, post: { id: e.postId, moderationStatus: 'approved' } });

beforeEach(() => {
  posteos.length = 0;
  subir.mockClear();
  revisar.mockReset();
  revisar.mockResolvedValue({ safe: true, reason: 'clean' });
  respuestaDelMuro = postPendiente;
  fiestaGuardada = { id: 'f1', others: {} };
});

it('Vision caido: la foto se guarda y el posteo se pide como NO revisado (no como riesgo), pendiente', async () => {
  revisar.mockResolvedValue({ safe: true, reason: 'error' });
  const r: any = await uploadEntretenimientoMedia(formulario());
  expect(r.success).toBe(true);
  expect(posteos[0].revisionImagen).toBe('sin_revisar');
  expect(r.muro).toEqual({ estado: 'pendiente_aprobacion', sinRevisar: true });
  expect(r.media.syncStatus).toBe('pendiente_aprobacion');
  expect(r.media.socialPostId).toBe('post_ent_cap1');
  expect(medios()).toHaveLength(1);
});

it('analisis normal y posteo aprobado: publicado, sin aviso de "sin revisar"', async () => {
  respuestaDelMuro = postPublicado;
  const r: any = await uploadEntretenimientoMedia(formulario());
  expect(r.success).toBe(true);
  expect(posteos[0].revisionImagen).toBe('segura');
  expect(r.muro).toEqual({ estado: 'publicado', sinRevisar: false });
  expect(r.media.syncStatus).toBe('publicado');
});

it('riesgo real: se rechaza en el acto, no se sube el archivo ni se guarda nada ni se pide el posteo', async () => {
  revisar.mockResolvedValue({ safe: false, reason: 'inappropriate_content_risk' });
  const r: any = await uploadEntretenimientoMedia(formulario());
  expect(r.success).toBe(false);
  expect(r.error).toMatch(/bloqueada/);
  expect(subir).not.toHaveBeenCalled();
  expect(posteos).toHaveLength(0);
  expect(medios()).toHaveLength(0);
});

it('el muro rechaza el texto: la respuesta NO dice que salio bien y el cartel es de rechazo', async () => {
  respuestaDelMuro = () => ({ success: false, bloqueado: true, error: 'Contenido bloqueado por lenguaje no permitido.' });
  const r: any = await uploadEntretenimientoMedia(formulario());
  expect(r.success).toBe(false);
  expect(r.muro.estado).toBe('rechazado');
  expect(r.error).toMatch(/bloqueado/);
});

it('el posteo falla: success NO es true; la captura queda guardada y el reintento solo repite el posteo', async () => {
  respuestaDelMuro = () => ({ success: false, error: 'No se pudo publicar en el muro social.' });
  const primero: any = await uploadEntretenimientoMedia(formulario());
  expect(primero.success).toBe(false);
  expect(primero.muro.estado).toBe('error');
  expect(medios()).toHaveLength(1);
  expect(medios()[0].syncStatus).toBe('pendiente');
  expect(medios()[0].socialPostId).toBeUndefined();

  respuestaDelMuro = postPendiente;
  const segundo: any = await uploadEntretenimientoMedia(formulario());
  expect(segundo.success).toBe(true);
  expect(segundo.muro.estado).toBe('pendiente_aprobacion');
  // Una sola subida del archivo, una sola revision, una sola media, el mismo posteo.
  expect(subir).toHaveBeenCalledTimes(1);
  expect(revisar).toHaveBeenCalledTimes(1);
  expect(medios()).toHaveLength(1);
  expect(posteos.map((p) => p.postId)).toEqual(['post_ent_cap1', 'post_ent_cap1']);
  expect(medios()[0].socialPostId).toBe('post_ent_cap1');
});

it('el reintento de una captura ya posteada no vuelve a subir, revisar ni pedir el posteo', async () => {
  revisar.mockResolvedValue({ safe: true, reason: 'error' });
  await uploadEntretenimientoMedia(formulario());
  const otra: any = await uploadEntretenimientoMedia(formulario());
  expect(otra.success).toBe(true);
  expect(otra.duplicate).toBe(true);
  expect(otra.muro).toEqual({ estado: 'pendiente_aprobacion', sinRevisar: true });
  expect(subir).toHaveBeenCalledTimes(1);
  expect(revisar).toHaveBeenCalledTimes(1);
  expect(posteos).toHaveLength(1);
  expect(medios()).toHaveLength(1);
});

it('el reintento de una captura que se guardo sin revisar sigue sin revisar (no se vuelve a pagar la revision ni se da por segura)', async () => {
  revisar.mockResolvedValue({ safe: true, reason: 'error' });
  respuestaDelMuro = () => ({ success: false, error: 'caido' });
  await uploadEntretenimientoMedia(formulario());
  respuestaDelMuro = postPendiente;
  revisar.mockResolvedValue({ safe: true, reason: 'clean' });
  await uploadEntretenimientoMedia(formulario());
  expect(posteos[1].revisionImagen).toBe('sin_revisar');
  expect(revisar).toHaveBeenCalledTimes(1);
});

it('dos capturas distintas son dos medios y dos posteos', async () => {
  await uploadEntretenimientoMedia(formulario('capA'));
  await uploadEntretenimientoMedia(formulario('capB'));
  expect(medios()).toHaveLength(2);
  expect(new Set(posteos.map((p) => p.postId)).size).toBe(2);
});

it('un video no se revisa solo: se pide como sin revisar', async () => {
  const fd = formulario();
  fd.set('file', new File([new Uint8Array([1])], 'v.mp4', { type: 'video/mp4' }));
  const r: any = await uploadEntretenimientoMedia(fd);
  expect(r.success).toBe(true);
  expect(revisar).not.toHaveBeenCalled();
  expect(posteos[0].revisionImagen).toBe('sin_revisar');
});

it('el permiso de la estacion se mantiene: sin credencial no se guarda ni se revisa', async () => {
  const fd = formulario();
  fd.set('accessToken', 'malo');
  const r: any = await uploadEntretenimientoMedia(fd);
  expect(r.success).toBe(false);
  expect(revisar).not.toHaveBeenCalled();
  expect(subir).not.toHaveBeenCalled();
  expect(posteos).toHaveLength(0);
});

describe('la pantalla del espejo (lectura del codigo)', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fuente: string = require('fs').readFileSync('src/app/evento/espejo-magico/[fiestaId]/page.tsx', 'utf8');
  const cuerpo = fuente.slice(fuente.indexOf('const handleUpload = async'), fuente.indexOf('const retake = () =>'));

  it('lee lo que paso en el muro y avisa cuando la foto espera al equipo, en pantalla y en voz', () => {
    expect(cuerpo).toContain("res.muro?.estado === 'pendiente_aprobacion'");
    expect(cuerpo).toContain('setAvisoDelMuro(');
    expect(fuente).toContain('data-testid="aviso-foto-pendiente"');
    expect(cuerpo).toContain('espera la aprobación del equipo');
  });

  it('el reintento usa la MISMA identidad de captura: no la regenera en cada intento', () => {
    expect(cuerpo).toContain('if (!idDeLaCapturaRef.current) idDeLaCapturaRef.current = nuevoIdDeCaptura();');
    expect(cuerpo).not.toMatch(/const idDeLaCaptura = nuevoIdDeCaptura\(\)/);
    // Se renueva al sacar otra foto o al repetir.
    const retake = fuente.slice(fuente.indexOf('const retake = () =>'), fuente.indexOf('const retake = () =>') + 800);
    expect(retake).toContain('idDeLaCapturaRef.current = null');
  });
});
