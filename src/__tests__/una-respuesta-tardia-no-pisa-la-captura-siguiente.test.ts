/**
 * MATAFUEGO — Una respuesta tardía de la IA no cierra ni cambia la captura del siguiente
 * (T89-05, Codex, 26 de septiembre de 2026). Y la estación se libera al guardar la captura (T89-06).
 *
 * Se usan las acciones reales de la sesión con una base de mentira que guarda el documento y
 * devuelve COPIAS en cada lectura (error 11: una lista compartida no puede fallar nunca).
 *
 * Se probó rompiéndolo: sacando la comparación de captura, "A tardía después de que el operador
 * empezó a B" se pone en rojo (B quedaba "done" con el medio de A).
 */
let documento: Record<string, any> | null = null;

jest.mock('@/lib/auth/entertainment-token', () => ({
  hasEntertainmentControlAccess: jest.fn(async () => true),
  hasEntertainmentGuestAccess: jest.fn(async () => true),
}));
jest.mock('@/lib/entertainment/station-config', () => ({
  isEntertainmentModuleId: jest.fn(() => true),
  getEntertainmentStationConfig: jest.fn(() => ({ enabled: true })),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => ({ id: 'f1' })),
}));
jest.mock('@/lib/firebase/server', () => {
  const copia = () => (documento ? JSON.parse(JSON.stringify(documento)) : null);
  const guardar = (data: any, opciones?: { merge?: boolean }) => {
    documento = opciones?.merge ? { ...(documento || {}), ...JSON.parse(JSON.stringify(data)) } : JSON.parse(JSON.stringify(data));
  };
  const ref = { set: async (data: any, op?: any) => guardar(data, op), get: async () => ({ exists: !!documento, data: copia }) };
  return {
    dbAdmin: {
      collection: () => ({ doc: () => ref }),
      runTransaction: async (fn: any) => fn({
        get: async () => ({ exists: !!documento, data: copia }),
        set: (_r: any, data: any, op?: any) => guardar(data, op),
      }),
    },
  };
});

import {
  startEntertainmentSession,
  resetEntertainmentSession,
  updateEntertainmentSessionStatus,
} from '@/app/actions/fiesta/sesion-entretenimiento';

const M = 'espejoMagicoIA';

async function empezarCaptura() {
  await startEntertainmentSession('f1', M, {}, 'op');
  const r = await updateEntertainmentSessionStatus('f1', M, 'recording', {}, 'st');
  // La pantalla que graba recibe la captura de la sesión: es la que lleva el trabajo de la IA.
  expect(r.captureId).toBe(documento!.captureId);
  return r.captureId as string;
}

describe('Una respuesta tardía no pisa la captura siguiente', () => {
  beforeEach(() => { documento = null; });

  it('A tardía después de que el operador reinició y empezó a B: B sigue grabando y sin el medio de A', async () => {
    const capturaA = await empezarCaptura();
    await resetEntertainmentSession('f1', M, 'op');
    const capturaB = await empezarCaptura();
    expect(capturaB).not.toBe(capturaA);

    const r = await updateEntertainmentSessionStatus('f1', M, 'done', { mediaUrl: '/media-A.jpg', captureId: capturaA }, 'st');
    expect(r.success).toBe(false);
    expect(documento!.captureId).toBe(capturaB);
    expect(documento!.status).toBe('recording');
    expect(documento!.mediaUrl).toBeUndefined();
  });

  it('A tardía mientras B está procesando, con B empezado desde "lista" por el invitado: no la cierra', async () => {
    const capturaA = await empezarCaptura();
    await updateEntertainmentSessionStatus('f1', M, 'done', { captureId: capturaA }, 'st');
    await updateEntertainmentSessionStatus('f1', M, 'countdown', {}, 'st');
    await updateEntertainmentSessionStatus('f1', M, 'recording', {}, 'st');
    await updateEntertainmentSessionStatus('f1', M, 'processing', {}, 'st');
    const capturaB = documento!.captureId;
    expect(capturaB).not.toBe(capturaA);

    await updateEntertainmentSessionStatus('f1', M, 'done', { mediaUrl: '/media-A.jpg', captureId: capturaA }, 'st');
    expect(documento!.status).toBe('processing');
    expect(documento!.mediaUrl).toBeUndefined();
  });

  it('la respuesta de la captura vigente sí se aplica', async () => {
    const capturaA = await empezarCaptura();
    const r = await updateEntertainmentSessionStatus('f1', M, 'done', { mediaUrl: '/media-A.jpg', captureId: capturaA }, 'st');
    expect(r.success).toBe(true);
    expect(documento!.mediaUrl).toBe('/media-A.jpg');
  });

  it('T89-06: al guardar la captura la estación queda lista y el operador puede empezar a B sin reiniciar', async () => {
    const capturaA = await empezarCaptura();
    // Lo que hace la cabina al dejar la captura como trabajo pendiente (liberarEstacion).
    await updateEntertainmentSessionStatus('f1', M, 'done', { reviewPending: false, captureId: capturaA }, 'st');
    expect(documento!.status).toBe('done');
    // El botón "Iniciar captura" del operador se habilita en idle o done.
    expect(['idle', 'done']).toContain(documento!.status);
    const capturaB = await empezarCaptura();
    expect(documento!.status).toBe('recording');
    // Y cuando vuelve la IA de A, no le toca nada a B.
    await updateEntertainmentSessionStatus('f1', M, 'done', { mediaUrl: '/media-A.jpg', captureId: capturaA }, 'st');
    expect(documento!.captureId).toBe(capturaB);
    expect(documento!.status).toBe('recording');
  });

  it('las demás estaciones, que no mandan captura, siguen como antes', async () => {
    await empezarCaptura();
    const r = await updateEntertainmentSessionStatus('f1', M, 'done', { mediaUrl: '/x.jpg' }, 'st');
    expect(r.success).toBe(true);
    expect(documento!.status).toBe('done');
  });
});
