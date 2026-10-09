/** @jest-environment node */
/**
 * Orden 134: las estaciones entregan el recuerdo al invitado DE VERDAD.
 *
 * Las pruebas de navegador de la puerta corren sin emulador (archivos locales), asi que no pueden
 * comprobar que la foto/video queda en el deposito y en la fiesta. Esta si: corre adentro de
 * `npm run test:rules`, con los emuladores de la base y del deposito prendidos.
 *
 * Es real: la fiesta (en el emulador de la base), el permiso de la estacion del invitado (firmado con
 * el mismo secreto que usa la app), `uploadEntretenimientoMedia`, el deposito y la transaccion que
 * agrega el recuerdo. SIN sesion del equipo. De mentira, nada mas: las cookies (no hay navegador, se
 * simula que no trae ninguna) y el analisis automatico de la imagen (necesita Gemini).
 *
 * Nota: NO se activa AK_USE_LOCAL_JSON_ONLY, porque con eso la app guarda en archivos y la fiesta no
 * pasaria por el emulador.
 */
process.env.AK_SESSION_SECRET = 'prueba-134-secreto-con-suficiente-entropia';
process.env.FIREBASE_PROJECT_ID = 'demo-ak-producciones';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'demo-ak-producciones.appspot.com';
process.env.FIREBASE_STORAGE_BUCKET = 'demo-ak-producciones.appspot.com';
delete process.env.AK_USE_LOCAL_JSON_ONLY;

jest.mock('server-only', () => ({}));
// Sin navegador no hay cookies: el invitado de la estacion no tiene sesion del equipo.
jest.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined, set: () => undefined, getAll: () => [] }),
  headers: async () => new Headers(),
}));
// El analisis de contenido llama a Gemini; aca se da por buena la foto.
jest.mock('@/lib/social-fiesta/content-safety-ai', () => ({
  checkImageSafety: jest.fn(async () => ({ safe: true })),
}));

import { uploadEntretenimientoMedia } from '@/app/actions/fiesta/entretenimiento.actions';
import { createEntertainmentAccessToken } from '@/lib/auth/entertainment-token';
import { buildAkDemoFiesta } from '@/lib/experience-ak/demo-fiesta-factory';
import { writeData, readData } from '@/lib/data-service';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

const conEmuladores = Boolean(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_STORAGE_EMULATOR_HOST);
const FIESTA_ID = `prueba-134-${Date.now()}`;
const ESTACIONES = [
  { ruta: 'bogue', modulo: 'bogue' },
  { ruta: 'plataforma-360', modulo: 'plataforma360' },
] as const;

const INVITADO = { id: 'inv_134', guestAccessToken: 'token-invitado-134' };

function formulario(opciones: { moduleId: string; token: string; clientMediaId: string; bytes: Buffer; tipo: string; nombre: string; conInvitado?: boolean }) {
  const form = new FormData();
  form.set('fiestaId', FIESTA_ID);
  form.set('moduleId', opciones.moduleId);
  form.set('accessToken', opciones.token);
  form.set('clientMediaId', opciones.clientMediaId);
  form.set('authorName', 'Invitado sintetico 134');
  // Con el enlace personal del invitado: asi la captura queda a su nombre (lo normal en una fiesta).
  if (opciones.conInvitado !== false) {
    form.set('guestId', INVITADO.id);
    form.set('guestAccessToken', INVITADO.guestAccessToken);
  }
  form.set('file', new File([new Uint8Array(opciones.bytes)], opciones.nombre, { type: opciones.tipo }));
  return form;
}

async function mediosGuardados(modulo: string): Promise<any[]> {
  const fiesta = await readData<any>(`fiestas/${FIESTA_ID}.json`, null);
  return fiesta?.others?.entretenimiento?.modules?.[modulo]?.media || [];
}

describe('estaciones del invitado: la entrega llega a la fiesta y al deposito (emuladores reales)', () => {
  beforeAll(async () => {
    expect(conEmuladores).toBe(true); // si no hay emuladores, la prueba no prueba nada
    const base = buildAkDemoFiesta('tecnologia-total');
    const fiesta = {
      ...base,
      id: FIESTA_ID,
      invitados: [{
        id: INVITADO.id, guestAccessToken: INVITADO.guestAccessToken, nombre: 'Invitado sintetico 134',
        rsvp: 'Confirmado', categoria: 'Adulto', partySize: 1, dietaryRestriction: 'Ninguna',
      }],
    } as unknown as FiestaEnPlanificacion;
    await writeData(`fiestas/${FIESTA_ID}.json`, fiesta, undefined, { skipAutoBackup: true });
    // La fiesta quedo en el emulador de la base (no en un archivo).
    expect((await readData<any>(`fiestas/${FIESTA_ID}.json`, null))?.id).toBe(FIESTA_ID);
  });

  for (const { ruta, modulo } of ESTACIONES) {
    it(`${ruta}: sube sin sesion del equipo; queda en la fiesta y en el deposito con los mismos bytes; el reintento no duplica`, async () => {
      const token = createEntertainmentAccessToken(FIESTA_ID, modulo, 'guest');
      const bytes = Buffer.from(`recuerdo-${modulo}-${Date.now()}-contenido-distinto-por-estacion`);
      const clientMediaId = `cap134${modulo}`;
      const armar = () => formulario({ moduleId: ruta, token, clientMediaId, bytes, tipo: 'image/jpeg', nombre: 'recuerdo.jpg' });

      const respuesta: any = await uploadEntretenimientoMedia(armar());
      expect(respuesta.error).toBeUndefined();
      expect(respuesta.success).toBe(true);
      expect(respuesta.duplicate).toBeUndefined();

      // 1) Quedo en la fiesta del emulador, bajo el modulo real (el alias de ruta se tradujo).
      const medios = await mediosGuardados(modulo);
      expect(medios).toHaveLength(1);
      expect(medios[0].id).toBe(`ent_${clientMediaId}`);
      expect(medios[0].moduleId).toBe(modulo);
      expect(medios[0].type).toBe('image');
      expect(medios[0].guestId).toBe(INVITADO.id);
      expect(medios[0].url).toBe(respuesta.media.url);

      // 2) El archivo existe en el emulador del deposito, con los mismos bytes.
      expect(respuesta.media.url.startsWith(`http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST}/`)).toBe(true);
      const bajada = await fetch(respuesta.media.url);
      expect(bajada.ok).toBe(true);
      expect(Buffer.from(await bajada.arrayBuffer()).equals(bytes)).toBe(true);

      // 3) El mismo envio otra vez (se corto la respuesta) no duplica.
      const reintento: any = await uploadEntretenimientoMedia(armar());
      expect(reintento.success).toBe(true);
      expect(reintento.duplicate).toBe(true);
      expect(await mediosGuardados(modulo)).toHaveLength(1);
    });
  }

  it('el permiso de OTRA estacion se rechaza y no deja nada guardado', async () => {
    // Permiso de la fotocabina usado en la 360 (y en el bogue).
    const tokenAjeno = createEntertainmentAccessToken(FIESTA_ID, 'fotocabina', 'guest');
    for (const { ruta, modulo } of ESTACIONES) {
      const antes = (await mediosGuardados(modulo)).length;
      const r: any = await uploadEntretenimientoMedia(formulario({
        moduleId: ruta, token: tokenAjeno, clientMediaId: `ajeno134${modulo}`,
        bytes: Buffer.from('no-debe-entrar'), tipo: 'image/jpeg', nombre: 'ajeno.jpg',
      }));
      expect(r.success).toBe(false);
      expect((await mediosGuardados(modulo)).length).toBe(antes);
    }
    // Y sin permiso alguno.
    const sin: any = await uploadEntretenimientoMedia(formulario({
      moduleId: 'bogue', token: '', clientMediaId: 'sin134', bytes: Buffer.from('x'), tipo: 'image/jpeg', nombre: 's.jpg',
    }));
    expect(sin.success).toBe(false);
  });

  it('el permiso de la misma estacion pero de OTRA fiesta se rechaza', async () => {
    const tokenOtraFiesta = createEntertainmentAccessToken(`${FIESTA_ID}-otra`, 'bogue', 'guest');
    const r: any = await uploadEntretenimientoMedia(formulario({
      moduleId: 'bogue', token: tokenOtraFiesta, clientMediaId: 'otrafiesta134',
      bytes: Buffer.from('no-debe-entrar'), tipo: 'image/jpeg', nombre: 'o.jpg',
    }));
    expect(r.success).toBe(false);
  });

  /**
   * Defecto encontrado por esta prueba y arreglado: sin `guestId` válido el recuerdo llevaba
   * `guestId: undefined` y Firestore rechazaba el guardado entero. Ahora el guardado de la fiesta
   * saca las claves `undefined` (`sinIndefinidos` en src/lib/generic-json-store.ts).
   */
  it('una captura sin invitado identificado tambien se guarda', async () => {
    const token = createEntertainmentAccessToken(FIESTA_ID, 'bogue', 'guest');
    const r: any = await uploadEntretenimientoMedia(formulario({
      moduleId: 'bogue', token, clientMediaId: 'anonima134', bytes: Buffer.from('anonima'),
      tipo: 'image/jpeg', nombre: 'a.jpg', conInvitado: false,
    }));
    expect(r.success).toBe(true);
  });
});
