/** @jest-environment node */

const almacen: Record<string, any> = {};
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

jest.mock('server-only', () => ({}));
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null, authAdmin: null }));
jest.mock('@/lib/auth/session-token', () => ({ verifySession: jest.fn(async () => ({ success: false })) }));
jest.mock('@/lib/commercial/public-rate-limit', () => ({ enforcePublicRateLimit: jest.fn(async () => undefined) }));
jest.mock('@/lib/data-service', () => {
  const real = jest.requireActual('@/lib/data-service');
  return {
    ...real,
    readData: jest.fn(async (archivo: string, porDefecto: any) => (almacen[archivo] === undefined ? porDefecto : copia(almacen[archivo]))),
    writeData: jest.fn(async (archivo: string, datos: any) => { almacen[archivo] = copia(datos); }),
  };
});

import {
  createBarDrinkOrder,
  cancelBarDrinkOrder,
  changeBarDrinkOrder,
} from '@/app/actions/fiesta/barra-tecnologica.actions';
import { defaultCartaTragosData } from '@/lib/fiesta-defaults';

const FIESTA_ID = 'fiesta-menor-242';

const FIESTA_BASE = {
  id: FIESTA_ID,
  configuracion: { nombreEvento: 'Cumpleaños AK' },
  modulosContratados: { barraTecnologica: true },
  cartaTragos: defaultCartaTragosData,
  others: {
    barraTecnologica: {
      settings: {
        enabled: true,
        requireGuestName: false,
        openingTime: '',
        closingTime: '',
      },
      orders: [],
    },
  },
  invitados: [
    {
      id: 'inv-menor',
      nombre: 'Joaquín (16)',
      categoria: 'Adolescente',
      guestAccessToken: 'tok-menor-16',
      tableNumber: 'Mesa 4',
    },
    {
      id: 'inv-adulto',
      nombre: 'Marcelo (40)',
      categoria: 'Adulto',
      guestAccessToken: 'tok-adulto-40',
      tableNumber: 'Mesa 1',
    },
  ],
};

const INSUMOS_INICIALES = [
  { id: 'ing-vodka', nombre: 'Vodka', cantidadDisponible: 10, unidad: 'Botella' },
  { id: 'ing-naranja', nombre: 'Jugo de Naranja', cantidadDisponible: 10, unidad: 'Litro' },
  { id: 'ing-soda', nombre: 'Soda', cantidadDisponible: 10, unidad: 'Litro' },
  { id: 'ing-cana-uruguaya', nombre: 'Caña uruguaya', cantidadDisponible: 10, unidad: 'Botella' },
];

function getInsumoStock(insumoId: string): number {
  const insumos = (almacen['insumos.json'] || []) as Array<{ id: string; cantidadDisponible: number }>;
  const found = insumos.find((i) => i.id === insumoId);
  return found ? found.cantidadDisponible : 0;
}

beforeEach(() => {
  for (const k of Object.keys(almacen)) delete almacen[k];
  almacen[`fiestas/${FIESTA_ID}.json`] = copia(FIESTA_BASE);
  almacen['insumos.json'] = copia(INSUMOS_INICIALES);
});

describe('Orden 242 — La barra no le da alcohol a un menor', () => {
  it('(a) Invitado categoria: "Adolescente" pide con_alcohol: se rechaza y no se descuenta nada', async () => {
    const res = await createBarDrinkOrder({
      fiestaId: FIESTA_ID,
      drinkId: 'destornillador',
      guestId: 'inv-menor',
      guestAccessToken: 'tok-menor-16',
      version: 'con_alcohol',
      clientRequestId: 'req-a-1',
    });

    expect(res.success).toBe(false);
    expect(res.error).toBe('Este trago con alcohol es sólo para mayores de 18. Elegí la versión sin alcohol.');
    expect(getInsumoStock('ing-vodka')).toBe(10);
    expect(getInsumoStock('ing-naranja')).toBe(10);
  });

  it('(b) El mismo invitado pide sin_alcohol de "Destornillador": se descuenta naranja y no vodka, y el pedido dice "Naranjada"', async () => {
    const res = await createBarDrinkOrder({
      fiestaId: FIESTA_ID,
      drinkId: 'destornillador',
      guestId: 'inv-menor',
      guestAccessToken: 'tok-menor-16',
      version: 'sin_alcohol',
      clientRequestId: 'req-b-1',
    });

    expect(res.success).toBe(true);
    expect(res.order).toBeDefined();
    expect(res.order?.drinkName).toBe('Naranjada');
    expect(res.order?.version).toBe('sin_alcohol');
    // Vodka intacto (NO se descontó)
    expect(getInsumoStock('ing-vodka')).toBe(10);
    // Naranja descontada según receta sin alcohol (0.09 L)
    expect(getInsumoStock('ing-naranja')).toBeCloseTo(10 - 0.09, 4);
  });

  it('(c) Adulto pide con_alcohol: se descuentan 15 ml de vodka', async () => {
    const res = await createBarDrinkOrder({
      fiestaId: FIESTA_ID,
      drinkId: 'destornillador',
      guestId: 'inv-adulto',
      guestAccessToken: 'tok-adulto-40',
      version: 'con_alcohol',
      clientRequestId: 'req-c-1',
    });

    expect(res.success).toBe(true);
    expect(res.order).toBeDefined();
    expect(res.order?.drinkName).toBe('Destornillador');
    expect(res.order?.version).toBe('con_alcohol');
    // Vodka descontado: 15 ml = 0.02 Botella
    expect(getInsumoStock('ing-vodka')).toBeCloseTo(10 - 0.02, 4);
    // Naranja descontada con receta con alcohol (0.185 L)
    expect(getInsumoStock('ing-naranja')).toBeCloseTo(10 - 0.185, 4);
  });

  it('(d) Pedido sin version: se trata como sin alcohol', async () => {
    const res = await createBarDrinkOrder({
      fiestaId: FIESTA_ID,
      drinkId: 'destornillador',
      guestId: 'inv-adulto',
      guestAccessToken: 'tok-adulto-40',
      clientRequestId: 'req-d-1',
    });

    expect(res.success).toBe(true);
    expect(res.order?.version).toBe('sin_alcohol');
    expect(res.order?.drinkName).toBe('Naranjada');
    // Al ser sin alcohol, no descuenta vodka
    expect(getInsumoStock('ing-vodka')).toBe(10);
    expect(getInsumoStock('ing-naranja')).toBeCloseTo(10 - 0.09, 4);
  });

  it('(e) Cancelar un pedido sin_alcohol devuelve la versión sin alcohol, no vodka', async () => {
    const pedido = await createBarDrinkOrder({
      fiestaId: FIESTA_ID,
      drinkId: 'destornillador',
      guestId: 'inv-menor',
      guestAccessToken: 'tok-menor-16',
      version: 'sin_alcohol',
      clientRequestId: 'req-e-1',
    });
    expect(pedido.success).toBe(true);

    const naranjaTrasPedido = getInsumoStock('ing-naranja');
    const vodkaTrasPedido = getInsumoStock('ing-vodka');

    const cancelRes = await cancelBarDrinkOrder(
      FIESTA_ID,
      pedido.order!.id,
      'inv-menor',
      'tok-menor-16',
    );
    expect(cancelRes.success).toBe(true);

    // Se repuso la naranja que se había descontado
    expect(getInsumoStock('ing-naranja')).toBeCloseTo(naranjaTrasPedido + 0.09, 4);
    // El vodka nunca se tocó ni se incrementó
    expect(getInsumoStock('ing-vodka')).toBe(vodkaTrasPedido);
  });

  it('(f) Cambiar un pedido de un menor a con_alcohol se rechaza', async () => {
    const inicial = await createBarDrinkOrder({
      fiestaId: FIESTA_ID,
      drinkId: 'destornillador',
      guestId: 'inv-menor',
      guestAccessToken: 'tok-menor-16',
      version: 'sin_alcohol',
      clientRequestId: 'req-f-1',
    });
    expect(inicial.success).toBe(true);

    const cambio = await changeBarDrinkOrder(
      FIESTA_ID,
      inicial.order!.id,
      'destornillador',
      'inv-menor',
      'tok-menor-16',
      'con_alcohol',
    );
    expect(cambio.success).toBe(false);
    expect(cambio.error).toBe('Este trago con alcohol es sólo para mayores de 18. Elegí la versión sin alcohol.');

    // El stock no se altera
    expect(getInsumoStock('ing-vodka')).toBe(10);
  });

  it('(g) un trago sin receta sin alcohol, pedido sin_alcohol, no descuenta vodka (ninguna bebida alcohólica)', async () => {
    const fiesta = almacen[`fiestas/${FIESTA_ID}.json`];
    fiesta.cartaTragos = {
      ...fiesta.cartaTragos,
      items: [
        ...(fiesta.cartaTragos?.items || []),
        {
          id: 'vodka-puro',
          nombre: 'Vodka Puro',
          soloMayores: true,
          ingredientes: ['Vodka'],
          recetaIngredientes: [{ insumoId: 'ing-vodka', cantidad: 0.05, nombre: 'Vodka' }],
          // Sin recetaIngredientesSinAlcohol
        },
      ],
    };

    const res = await createBarDrinkOrder({
      fiestaId: FIESTA_ID,
      drinkId: 'vodka-puro',
      guestId: 'inv-adulto',
      guestAccessToken: 'tok-adulto-40',
      version: 'sin_alcohol',
      clientRequestId: 'req-g-1',
    });

    expect(res.success).toBe(true);
    expect(getInsumoStock('ing-vodka')).toBe(10);
    expect(res.order?.stockMovements || []).toEqual([]);
  });
});
