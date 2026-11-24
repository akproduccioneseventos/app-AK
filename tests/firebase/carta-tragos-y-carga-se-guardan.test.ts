/** @jest-environment node */
process.env.AK_SESSION_SECRET = 'prueba-338-tragos-secreto-entropia';
process.env.FIREBASE_PROJECT_ID = 'demo-ak-producciones';
delete process.env.AK_USE_LOCAL_JSON_ONLY;
jest.setTimeout(60000);

jest.mock('server-only', () => ({}));
jest.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined, set: () => undefined, getAll: () => [] }),
  headers: async () => new Headers(),
}));
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: async () => ({ success: true, user: { email: 'dueno@ak.uy', role: 'admin', perfil: 'dueno', userId: 'dueno-338' } }),
}));
jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: async () => undefined,
}));
jest.mock('@/lib/notifications/create-notification', () => ({ createNotification: async () => null }));
jest.mock('@/lib/whatsapp-automation-engine', () => ({ triggerWhatsAppAutomation: async () => ({ scheduled: 0, errors: [] }) }));
jest.mock('@/app/actions/google-workspace', () => ({
  syncFiestaToGoogleWorkspace: async () => ({ success: true }),
  syncAppointmentToGoogleWorkspace: async () => undefined,
}));

import fs from 'node:fs';
import path from 'node:path';
import { writeData } from '@/lib/data-service';
import { updateCartaTragos, getFiestaParaPantalla } from '@/app/actions/fiesta/fiesta.actions';
import { updateCargaOperativaItemState } from '@/app/actions/fiesta/carga-operativa.actions';


const FIESTA_ID = `fiesta-338-${Date.now()}`;
const ARCHIVOS_LOCALES = [
  path.join(process.cwd(), `data/fiestas/${FIESTA_ID}.json`),
  path.join(process.cwd(), `src/data/fiestas/${FIESTA_ID}.json`),
];

describe('Carta de tragos y carga operativa se guardan en emulador Firestore', () => {
  beforeAll(async () => {
    expect(Boolean(process.env.FIRESTORE_EMULATOR_HOST)).toBe(true);
    await writeData(
      `fiestas/${FIESTA_ID}.json`,
      {
        id: FIESTA_ID,
        configuracion: { nombreEvento: 'Fiesta Emulador 338', fechaEvento: '2027-05-15' },
        cartaTragos: { titulo: 'Fiesta Emulador 338', items: [] },
        listaDeCargaOperativa: {
          id: 'lista-1',
          name: 'Lista 338',
          categorias: [
            {
              id: 'cat-1',
              nombre: 'Sonido',
              items: [
                { id: 'item-1', nombre: 'Consola', cantidad: '1', cargado: false, retornado: false },
              ],
            },
          ],
          notasGenerales: '',
        },
      },
      undefined,
      { skipAutoBackup: true }
    );
  });

  afterAll(async () => {
    try {
      const { dbAdmin } = await import('@/lib/firebase/server');
      if (dbAdmin) {
        await dbAdmin.collection('fiestas').doc(FIESTA_ID).delete();
      }
    } catch {}
    for (const filePath of ARCHIVOS_LOCALES) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch {}
    }
  });

  test('Test 1: updateCartaTragos guarda y remueve correctamente', async () => {
    const itemTrago = {
      id: 'custom_emulador_1',
      nombre: 'Fernet Especial Emulador',
      imageUrl: '',
      descripcion: 'Prueba',
      ingredientes: ['Fernet', 'Coca'],
      activo: true,
    };

    const resAdd = await updateCartaTragos(FIESTA_ID, {
      titulo: 'Fiesta Emulador 338',
      items: [itemTrago],
      empresa: {
        linea1: 'AK Producciones',
        linea2: 'Eventos',
        contacto: '099000000',
      },
    });
    expect(resAdd).toEqual(expect.objectContaining({ success: true }));

    const fiestaLeida = await getFiestaParaPantalla(FIESTA_ID);
    const carta = fiestaLeida.fiesta?.cartaTragos as any;
    expect(carta?.items?.some((t: any) => t.id === 'custom_emulador_1' && t.nombre === 'Fernet Especial Emulador')).toBe(true);

    const resClear = await updateCartaTragos(FIESTA_ID, {
      titulo: 'Fiesta Emulador 338',
      items: [],
      empresa: {
        linea1: 'AK Producciones',
        linea2: 'Eventos',
        contacto: '099000000',
      },
    });
    expect(resClear).toEqual(expect.objectContaining({ success: true }));

    const fiestaVacia = await getFiestaParaPantalla(FIESTA_ID);
    const cartaVacia = fiestaVacia.fiesta?.cartaTragos as any;
    expect(cartaVacia?.items?.some((t: any) => t.id === 'custom_emulador_1')).toBe(false);
  });

  test('Test 2: updateCargaOperativaItemState tilda y destilda correctamente', async () => {
    const resTildar = await updateCargaOperativaItemState({
      fiestaId: FIESTA_ID,
      categoryId: 'cat-1',
      itemId: 'item-1',
      patch: { cargado: true },
      operatorName: 'Tester',
    });
    expect(resTildar).toEqual(expect.objectContaining({ success: true }));

    const fiestaLeida = await getFiestaParaPantalla(FIESTA_ID);
    const lista = fiestaLeida.fiesta?.listaDeCargaOperativa as any;
    const cat = lista?.categorias?.find((c: any) => c.id === 'cat-1');
    const item = cat?.items?.find((i: any) => i.id === 'item-1');
    expect(item?.cargado).toBe(true);

    const resDestildar = await updateCargaOperativaItemState({
      fiestaId: FIESTA_ID,
      categoryId: 'cat-1',
      itemId: 'item-1',
      patch: { cargado: false },
      operatorName: 'Tester',
    });
    expect(resDestildar).toEqual(expect.objectContaining({ success: true }));

    const fiestaLeida2 = await getFiestaParaPantalla(FIESTA_ID);
    const lista2 = fiestaLeida2.fiesta?.listaDeCargaOperativa as any;
    const cat2 = lista2?.categorias?.find((c: any) => c.id === 'cat-1');
    const item2 = cat2?.items?.find((i: any) => i.id === 'item-1');
    expect(item2?.cargado).toBe(false);
  });
});
