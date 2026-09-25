/**
 * MATAFUEGO — Si la base no anda, el pedido del invitado se guarda igual en la fiesta.
 *
 * Medido el 25 de septiembre de 2026 con la prueba de navegador de la orden 81: el guardado de
 * respaldo de la barra pasaba por `saveFiesta`, que pide permiso del equipo. El invitado no lo
 * tiene: el servidor anotaba "No autorizado para modificar este evento", devolvia las botellas
 * y el pedido se perdia. En la app real pasaba cada vez que la base fallaba al guardar.
 *
 * Y el respaldo guardaba la fiesta leida al principio: lo que el equipo cambio mientras tanto
 * se pisaba. Ahora se relee adentro del turno y sólo se tocan los pedidos.
 *
 * Se probo rompiendolo: volviendo a llamar a `saveFiesta` en el respaldo, la primera se pone
 * en rojo; guardando la fiesta vieja en vez de releerla, se pone en rojo la segunda.
 */
const almacen: Record<string, any> = {};
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));
jest.mock('@/lib/commercial/public-rate-limit', () => ({ enforcePublicRateLimit: jest.fn() }));
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(async () => { throw new Error('Sesion no autorizada.'); }) }));
jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({ preserveFiestaSecrets: jest.fn(async (_id: string, f: any) => f) }));
jest.mock('@/lib/carta-tragos/leer-carta-master', () => ({ leerCartaTragosMaster: jest.fn(async () => []) }));
jest.mock('@/app/actions/carta-tragos-master.actions', () => ({ getCartaTragosMaster: jest.fn() }));
jest.mock('@/app/actions/social-gallery', () => ({ createSocialMediaPostFromUrlForStation: jest.fn() }));
jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: jest.fn() }));
jest.mock('@/lib/generic-json-store', () => ({ mutateGenericJsonArray: jest.fn() }));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => (almacen[archivo] === undefined ? porDefecto : copia(almacen[archivo]))),
  writeData: jest.fn(async (archivo: string, datos: any) => { almacen[archivo] = copia(datos); }),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async (id: string) => (almacen[`fiestas/${id}.json`] ? copia(almacen[`fiestas/${id}.json`]) : null)),
  saveFiesta: jest.fn(async () => { throw new Error('No autorizado para modificar este evento.'); }),
}));

import { createBarDrinkOrder } from '@/app/actions/fiesta/barra-tecnologica.actions';

const FIESTA_ID = 'f_barra_respaldo';

function fiestaDePrueba() {
  return {
    id: FIESTA_ID,
    nombreEvento: 'Prueba',
    invitados: [{ id: 'inv1', nombre: 'Lucia', guestAccessToken: 'tok-lucia' }],
    cartaTragos: { items: [{ id: 'gin', nombre: 'Gin con Pomelo', recetaIngredientes: [], stockDisponible: 5 }] },
    others: { barraTecnologica: { settings: { enabled: true, openingTime: '', closingTime: '' }, orders: [] } },
  };
}

describe('El pedido del invitado se guarda aunque no ande la base', () => {
  const antes = process.env.AK_USE_LOCAL_JSON_ONLY;
  beforeEach(() => {
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
    for (const k of Object.keys(almacen)) delete almacen[k];
    almacen[`fiestas/${FIESTA_ID}.json`] = fiestaDePrueba();
  });
  afterAll(() => {
    if (antes === undefined) delete process.env.AK_USE_LOCAL_JSON_ONLY;
    else process.env.AK_USE_LOCAL_JSON_ONLY = antes;
  });

  it('el invitado, con su enlace y sin sesion del equipo, deja su pedido guardado', async () => {
    const r = await createBarDrinkOrder({
      fiestaId: FIESTA_ID, drinkId: 'gin', guestName: 'Lucia', guestId: 'inv1',
      guestAccessToken: 'tok-lucia', clientRequestId: 'req-1',
    } as any);
    expect(r.success).toBe(true);
    const pedidos = almacen[`fiestas/${FIESTA_ID}.json`].others.barraTecnologica.orders;
    expect(pedidos).toHaveLength(1);
    expect(pedidos[0].guestId).toBe('inv1');
  });

  it('no pisa lo que el equipo cambio en la fiesta mientras tanto', async () => {
    const { getFiestaById } = jest.requireMock('@/app/actions/fiesta/fiesta.actions');
    // La primera lectura (la del principio del pedido) es la vieja; el equipo cambia el
    // nombre del evento antes de que se guarde el pedido.
    (getFiestaById as jest.Mock).mockImplementationOnce(async (id: string) => {
      const vieja = copia(almacen[`fiestas/${id}.json`]);
      almacen[`fiestas/${id}.json`].nombreEvento = 'Cambiado por el equipo';
      return vieja;
    });
    const r = await createBarDrinkOrder({
      fiestaId: FIESTA_ID, drinkId: 'gin', guestName: 'Lucia', guestId: 'inv1',
      guestAccessToken: 'tok-lucia', clientRequestId: 'req-2',
    } as any);
    expect(r.success).toBe(true);
    const guardada = almacen[`fiestas/${FIESTA_ID}.json`];
    expect(guardada.nombreEvento).toBe('Cambiado por el equipo');
    expect(guardada.others.barraTecnologica.orders).toHaveLength(1);
  });

  it('el mismo pedido tocado dos veces queda una sola vez', async () => {
    const pedido = { fiestaId: FIESTA_ID, drinkId: 'gin', guestName: 'Lucia', guestId: 'inv1', guestAccessToken: 'tok-lucia', clientRequestId: 'req-3' } as any;
    await Promise.all([createBarDrinkOrder(pedido), createBarDrinkOrder(pedido)]);
    expect(almacen[`fiestas/${FIESTA_ID}.json`].others.barraTecnologica.orders).toHaveLength(1);
  });
});
