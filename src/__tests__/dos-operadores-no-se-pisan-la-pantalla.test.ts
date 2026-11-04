/** @jest-environment node */

/**
 * Orden 265 — Dos operadores no se pisan la pantalla (sincronización).
 *
 * Simula dos operadores concurrentes actuando sobre la pantalla gigante al mismo tiempo:
 * - Operador A: manda un anuncio rápido ('¡A la pista!') con updateLedMessage.
 * - Operador B: avanza al siguiente ítem de la playlist con nextScreenItem.
 *
 * Con actualizarFiesta y mutación transaccional sobre copias profundas con demora,
 * ambos cambios persisten sin pisarse. Con el método viejo (lectura previa afuera
 * y saveFiesta pisando el documento), uno de los dos cambios se perdía.
 */

const almacen: Record<string, any> = {};
const copia = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => ({ userId: 'op-1', perfil: 'operador' })),
  requirePermiso: jest.fn(async () => true),
}));

jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: jest.fn(async (fiestaId: string) => {
    await delay(10);
    const item = almacen[`fiestas/${fiestaId}.json`];
    return item ? copia(item) : { id: fiestaId };
  }),
  PERMISOS: { NOCHE: 'noche' },
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  requireFiestaWriteAccess: jest.fn(async () => true),
  getFiestaById: jest.fn(async (id: string) => {
    await delay(20);
    const item = almacen[`fiestas/${id}.json`];
    return item ? copia(item) : null;
  }),
  saveFiesta: jest.fn(async (fiesta: any) => {
    await delay(20);
    almacen[`fiestas/${fiesta.id}.json`] = copia(fiesta);
    return { success: true };
  }),
}));

jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({
  preserveFiestaSecrets: jest.fn(async (_id: string, f: any) => f),
  getFiestaByIdRaw: jest.fn(async (id: string) => {
    await delay(20);
    const item = almacen[`fiestas/${id}.json`];
    return item ? copia(item) : null;
  }),
}));

jest.mock('@/lib/generic-json-store', () => ({
  mutarDocumentoConTransaccion: jest.fn(async (path: string, _vacio: any, cambiar: (a: any) => any) => {
    // Demora intencional al leer la copia profunda
    await delay(20);
    const actual = almacen[path] !== undefined ? copia(almacen[path]) : null;
    const nuevo = await cambiar(actual);
    if (nuevo === null) return null;
    // Demora intencional al persistir la copia profunda
    await delay(20);
    almacen[path] = copia(nuevo);
    return copia(nuevo);
  }),
}));

import { nextScreenItem, updateLedMessage } from '@/app/actions/fiesta/screen-mode.actions';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';

const FIESTA_ID = 'fiesta_concurrente_1';

const FIESTA_INICIAL = {
  id: FIESTA_ID,
  nombre: 'Fiesta de 15 de Martina',
  configuracion: {
    nombreEvento: 'Fiesta de 15 de Martina',
  },
  socialGallerySettings: {
    enabled: true,
    ledMarqueeText: '',
    ledMarqueeEnabled: true,
    screenMode: {
      enabled: true,
      loop: true,
      isPlaying: true,
      currentItemIndex: 0,
      playlist: [
        { id: 'item_1', name: 'Fotos', title: 'Fotos', type: 'mural' },
        { id: 'item_2', name: 'Video', title: 'Video', type: 'video' },
      ],
    },
  },
};

beforeEach(() => {
  for (const k of Object.keys(almacen)) delete almacen[k];
  almacen[`fiestas/${FIESTA_ID}.json`] = copia(FIESTA_INICIAL);
});

describe('Dos operadores no se pisan la pantalla (Orden 265)', () => {
  it('dos operadores modifican la pantalla al mismo tiempo con el método nuevo y ambos cambios persisten', async () => {
    // Operador A: updateLedMessage(fiestaId, '¡A la pista!')
    // Operador B: nextScreenItem(fiestaId)
    // Ejecución concurrente
    const [resLed, resItem] = await Promise.all([
      updateLedMessage(FIESTA_ID, '¡A la pista!'),
      nextScreenItem(FIESTA_ID),
    ]);

    expect(resLed.success).toBe(true);
    expect(resItem.success).toBe(true);

    const fiestaGuardada = almacen[`fiestas/${FIESTA_ID}.json`];
    expect(fiestaGuardada).toBeDefined();

    // 1. El mensaje LED quedó actualizado
    expect(fiestaGuardada.socialGallerySettings.ledMarqueeText).toBe('¡A la pista!');

    // 2. El ítem de pantalla avanzó al siguiente índice (1)
    expect(fiestaGuardada.socialGallerySettings.screenMode.currentItemIndex).toBe(1);

    // 3. Ambos cambios persisten sin pisarse
    expect(fiestaGuardada.socialGallerySettings.screenMode.playlist[1].name).toBe('Video');
  });

  it('el guardado viejo sin actualizarFiesta (leyendo copia previa y guardando con saveFiesta) pisa uno de los cambios', async () => {
    // Restauramos el almacén al estado inicial
    almacen[`fiestas/${FIESTA_ID}.json`] = copia(FIESTA_INICIAL);

    // Método viejo: ambos operadores leían la copia inicial afuera con getFiestaById
    const [copiaOpA, copiaOpB] = await Promise.all([
      getFiestaById(FIESTA_ID),
      getFiestaById(FIESTA_ID),
    ]);

    // Ambos leyeron la misma copia vieja con currentItemIndex: 0 y ledMarqueeText: ''
    expect(copiaOpA.socialGallerySettings.ledMarqueeText).toBe('');
    expect(copiaOpB.socialGallerySettings.screenMode.currentItemIndex).toBe(0);

    // Operador A cambia el LED en su copia
    copiaOpA.socialGallerySettings.ledMarqueeText = '¡A la pista!';

    // Operador B avanza al siguiente ítem en su copia
    copiaOpB.socialGallerySettings.screenMode.currentItemIndex = 1;

    // Ambos guardan concurrentemente con saveFiesta (pisando el documento completo)
    await Promise.all([
      saveFiesta(copiaOpA),
      saveFiesta(copiaOpB),
    ]);

    const fiestaFinalVieja = almacen[`fiestas/${FIESTA_ID}.json`];

    // Con el método viejo, el último en escribir pisa al primero:
    // NUNCA conviven ambos cambios porque cada uno guardó su foto vieja sin el cambio del otro
    const ambosPersistieron =
      fiestaFinalVieja.socialGallerySettings.ledMarqueeText === '¡A la pista!' &&
      fiestaFinalVieja.socialGallerySettings.screenMode.currentItemIndex === 1;

    expect(ambosPersistieron).toBe(false);
  });
});
