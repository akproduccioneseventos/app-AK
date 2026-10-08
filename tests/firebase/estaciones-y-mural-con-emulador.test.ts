/** @jest-environment node */
/**
 * Orden 114, punto 3 (Codex, auditoria 79): con archivos locales, las sesiones de las estaciones
 * y el deposito de fotos estaban apagados, y el entorno de pruebas no podia probar captura ni
 * entrega. Ahora, con el emulador de la base y del deposito, funcionan de verdad.
 *
 * Corre adentro de `npm run test:rules`, que levanta los dos emuladores. Usa las funciones reales
 * de la app; lo de afuera (la fiesta y el permiso del operador) es de mentira.
 */
process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
process.env.FIREBASE_PROJECT_ID = 'demo-ak-producciones';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'demo-ak-producciones.appspot.com';

jest.mock('server-only', () => ({}));
jest.mock('@/lib/auth/entertainment-token', () => ({
  hasEntertainmentControlAccess: jest.fn(async () => true),
  hasEntertainmentGuestAccess: jest.fn(async () => true),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async (id: string) => ({ id })),
}));
jest.mock('@/lib/entertainment/station-config', () => ({
  ...jest.requireActual('@/lib/entertainment/station-config'),
  getEntertainmentStationConfig: jest.fn(() => ({ enabled: true })),
}));

import { getEntertainmentSession, startEntertainmentSession } from '@/app/actions/fiesta/sesion-entretenimiento';
import { uploadToStorage } from '@/lib/firebase/storage';
import { sinBaseDisponible, sinDepositoDisponible } from '@/lib/firebase/modo-local';

const conEmuladores = Boolean(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_STORAGE_EMULATOR_HOST);

describe('con el emulador, las estaciones y el deposito andan en el entorno de pruebas', () => {
  it('los dos emuladores estan prendidos (si no, la prueba no prueba nada)', () => {
    expect(conEmuladores).toBe(true);
    expect(sinBaseDisponible()).toBe(false);
    expect(sinDepositoDisponible()).toBe(false);
  });

  it('el operador inicia una captura y la pantalla la ve', async () => {
    const fiestaId = `e2e-emulador-${Date.now()}`;
    const inicio = await startEntertainmentSession(fiestaId, 'fotocabina', {}, 'permiso');
    expect(inicio).toEqual({ success: true });
    const sesion = await getEntertainmentSession(fiestaId, 'fotocabina', 'permiso');
    expect(sesion?.status).toBe('countdown');
    expect(sesion?.captureId).toBeTruthy();
  });

  it('una foto se guarda en el deposito y se puede bajar por su direccion', async () => {
    const contenido = Buffer.from('foto-de-prueba');
    const url = await uploadToStorage(contenido, `pruebas/${Date.now()}.txt`, 'text/plain', true);
    expect(url.startsWith(`http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST}/`)).toBe(true);
    const respuesta = await fetch(url);
    expect(respuesta.ok).toBe(true);
    expect(Buffer.from(await respuesta.arrayBuffer()).toString()).toBe('foto-de-prueba');
  });

  it('un emulador que no esta en esta maquina no cuenta: nunca se escribe en una base de verdad', () => {
    const antes = process.env.FIRESTORE_EMULATOR_HOST;
    process.env.FIRESTORE_EMULATOR_HOST = 'firestore.googleapis.com:443';
    try {
      expect(sinBaseDisponible()).toBe(true);
    } finally {
      process.env.FIRESTORE_EMULATOR_HOST = antes;
    }
  });
});
