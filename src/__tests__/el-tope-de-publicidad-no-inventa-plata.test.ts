/**
 * MATAFUEGO del tope de gasto de publicidad.
 *
 * Pasó dos veces, en direcciones opuestas y las dos mal:
 *
 * 1. Se dividía el gasto de los últimos treinta días y, si daba cero, se **inventaba
 *    $500** de presupuesto diario. Un número inventado decidiendo cuánta plata queda.
 * 2. La corrección puso todo en cero y sin verificar, y eso dejaba el panel **apagado
 *    para siempre**: nunca había saldo y nunca se podía tocar una campaña.
 *
 * Lo correcto es lo de ahora: con el dato de Meta, se trabaja; sin el dato, se avisa.
 */
import { getEstadoDelTope, puedeComprometer } from '@/lib/marketing/tope-de-gasto-publicidad';
import {
  obtenerEstadoTopePublicidad,
  actualizarTopePublicidad,
  obtenerHistorialAccionesPublicidad,
} from '@/app/actions/marketing-ads';
import { requireAppSession } from '@/lib/auth/require-session';

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => ({ topeMensualUYU: 30000 })),
  writeData: jest.fn(async () => undefined),
}));
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(async () => undefined) }));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/marketing/meta-ads-acciones', () => ({
  getAccionesPublicidadEjecutadas: jest.fn(async () => [
    { campana: 'Quince', antes: 200, despues: 300, motivo: 'ajuste' },
  ]),
}));

const AHORA = new Date('2026-09-10T12:00:00.000Z');

describe('El tope de publicidad no inventa plata ni se apaga solo', () => {
  it('con presupuestos verificados, calcula el saldo y deja trabajar', async () => {
    const estado = await getEstadoDelTope(
      [{ nombre: 'Quince', presupuestoDiarioUYU: 300, activa: true, verificado: true }],
      AHORA,
    );
    expect(estado.compromisoVerificado).toBe(true);
    expect(estado.disponibleUYU).toBeGreaterThan(0);
  });

  it('si Meta no dio el presupuesto, avisa y NO asume saldo libre', async () => {
    const estado = await getEstadoDelTope(
      [{ nombre: 'Quince', presupuestoDiarioUYU: 0, activa: false, verificado: false }],
      AHORA,
    );
    expect(estado.compromisoVerificado).toBe(false);
    expect(estado.disponibleUYU).toBe(0);
    expect(estado.motivoNoVerificado).toBeTruthy();
  });

  it('sin presupuesto verificado no se compromete plata', async () => {
    const r = await puedeComprometer(
      {
        campanas: [{ nombre: 'Quince', presupuestoDiarioUYU: 0, activa: false, verificado: false }],
        presupuestoDiarioActualUYU: 0,
        nuevoPresupuestoDiarioUYU: 200,
        tipo: 'ajustar',
      },
      AHORA,
    );
    expect(r.permitido).toBe(false);
  });

  it('encender o crear una campaña se niega siempre: eso lo decide el dueño', async () => {
    for (const tipo of ['encender', 'crear'] as const) {
      const r = await puedeComprometer(
        {
          campanas: [{ nombre: 'Quince', presupuestoDiarioUYU: 300, activa: true, verificado: true }],
          presupuestoDiarioActualUYU: 300,
          nuevoPresupuestoDiarioUYU: 310,
          tipo,
        },
        AHORA,
      );
      expect(r.permitido).toBe(false);
    }
  });
});

/**
 * LAS TRES PUERTAS QUE USA LA PANTALLA PIDEN SESION, Y NO ES UN DETALLE.
 *
 * En esta app cada funcion exportada de un archivo de acciones queda abierta a
 * internet. Sin sesion, cualquiera con la direccion podia leer cuanto tiene puesto
 * AK de tope de publicidad, cuanto lleva comprometido y **el registro completo de lo
 * que toco el agente**, con nombres de campanas y presupuestos. Eso es el plan de
 * medios servido a un competidor.
 */
describe('El panel de publicidad no atiende sin sesion', () => {
  beforeEach(() => jest.clearAllMocks());

  it('leer el estado del tope pide sesion, y devuelve el estado', async () => {
    const estado = await obtenerEstadoTopePublicidad([
      { nombre: 'Quince', presupuestoDiarioUYU: 300, activa: true, verificado: true },
    ]);
    expect(requireAppSession).toHaveBeenCalled();
    expect(estado.topeMensualUYU).toBe(30000);
  });

  it('cambiar el tope pide sesion y contesta con el numero nuevo', async () => {
    const r = await actualizarTopePublicidad(45000);
    expect(requireAppSession).toHaveBeenCalled();
    expect(r.success).toBe(true);
    expect(r.mensaje).toContain('45.000');
  });

  it('el registro de lo que toco el agente pide sesion', async () => {
    const historial = await obtenerHistorialAccionesPublicidad();
    expect(requireAppSession).toHaveBeenCalled();
    expect(historial).toHaveLength(1);
  });

  it('sin sesion, ninguna de las tres contesta', async () => {
    (requireAppSession as jest.Mock).mockImplementation(async () => {
      throw new Error('Sesion no autorizada.');
    });
    await expect(obtenerEstadoTopePublicidad([])).rejects.toThrow(/Sesion no autorizada/);
    await expect(obtenerHistorialAccionesPublicidad()).rejects.toThrow(/Sesion no autorizada/);
    // Cambiar el tope corta antes de entrar al guardado: no se guarda nada.
    await expect(actualizarTopePublicidad(1000)).rejects.toThrow(/Sesion no autorizada/);
  });
});
