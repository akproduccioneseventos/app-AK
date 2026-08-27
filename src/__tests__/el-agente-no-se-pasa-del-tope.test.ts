import {
  calcularComprometido,
  diasQueQuedanDelMes,
  type CampanaConPresupuesto,
} from '@/lib/marketing/tope-de-gasto-publicidad';

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(),
  writeData: jest.fn(),
}));

import { readData } from '@/lib/data-service';
import { getEstadoDelTope, puedeComprometer } from '@/lib/marketing/tope-de-gasto-publicidad';

const conTope = (topeMensualUYU: number | null) => {
  (readData as jest.Mock).mockResolvedValue(
    topeMensualUYU === null ? null : { topeMensualUYU }
  );
};

// 15 de junio: quedan 16 dias del mes contando hoy.
const QUINCE_DE_JUNIO = new Date(2026, 5, 15);

const campana = (
  nombre: string,
  presupuestoDiarioUYU: number,
  activa = true
): CampanaConPresupuesto => ({ nombre, presupuestoDiarioUYU, activa });

/**
 * El freno de mano del agente de publicidad.
 *
 * El dueno decidio que el agente maneje la publicidad **solo**. Se le planteo el riesgo y
 * eligio igual: es su plata. Lo que queda entonces no es discutir si puede gastar, sino
 * **que sea imposible pasarse del tope**.
 *
 * Un agente que "trata de no pasarse" se pasa el dia que se equivoca en una cuenta. Estas
 * pruebas congelan que este niegue, no que aconseje.
 */
describe('El agente de publicidad no se pasa del tope', () => {
  beforeEach(() => jest.clearAllMocks());

  it('cuenta lo COMPROMETIDO hasta fin de mes, no lo ya gastado', () => {
    // Esta es la decision que evita el desastre del dia 28: un presupuesto diario
    // puesto hoy todavia no gasto nada, pero ya compromete todos los dias que quedan.
    expect(diasQueQuedanDelMes(QUINCE_DE_JUNIO)).toBe(16);
    expect(calcularComprometido([campana('A', 500)], QUINCE_DE_JUNIO)).toBe(8000);
  });

  it('no cuenta las campanas pausadas, porque no gastan', () => {
    const campanas = [campana('activa', 500), campana('pausada', 9000, false)];
    expect(calcularComprometido(campanas, QUINCE_DE_JUNIO)).toBe(8000);
  });

  it('NIEGA el cambio que se pasaria del tope', async () => {
    conTope(10000);
    const veredicto = await puedeComprometer(
      {
        campanas: [campana('A', 500)], // ya compromete 8000 de 10000
        presupuestoDiarioActualUYU: 500,
        nuevoPresupuestoDiarioUYU: 1000, // +500/dia x 16 dias = +8000, no entra
      },
      QUINCE_DE_JUNIO
    );
    expect(veredicto.permitido).toBe(false);
    if (!veredicto.permitido) {
      expect(veredicto.motivo).toMatch(/No se ejecuta/);
    }
  });

  it('permite el cambio que entra justo en lo que queda', async () => {
    conTope(10000);
    const veredicto = await puedeComprometer(
      {
        campanas: [campana('A', 500)], // comprometido 8000, disponible 2000
        presupuestoDiarioActualUYU: 500,
        nuevoPresupuestoDiarioUYU: 625, // +125/dia x 16 = +2000 exacto
      },
      QUINCE_DE_JUNIO
    );
    expect(veredicto.permitido).toBe(true);
  });

  it('SIEMPRE deja pausar o bajar, aunque no quede nada de tope', async () => {
    // Frenar el gasto por falta de presupuesto seria justo al reves de lo que
    // este modulo protege.
    conTope(1);
    const veredicto = await puedeComprometer(
      {
        campanas: [campana('A', 5000)],
        presupuestoDiarioActualUYU: 5000,
        nuevoPresupuestoDiarioUYU: 0,
      },
      QUINCE_DE_JUNIO
    );
    expect(veredicto.permitido).toBe(true);
  });

  it('sin tope cargado, el agente no puede comprometer NADA', async () => {
    conTope(null);
    const veredicto = await puedeComprometer(
      {
        campanas: [],
        presupuestoDiarioActualUYU: 0,
        nuevoPresupuestoDiarioUYU: 100,
      },
      QUINCE_DE_JUNIO
    );
    expect(veredicto.permitido).toBe(false);
  });

  it('si no se puede leer el tope, se asume cero: ante la duda no se gasta', async () => {
    (readData as jest.Mock).mockRejectedValue(new Error('base caida'));
    const estado = await getEstadoDelTope([], QUINCE_DE_JUNIO);
    expect(estado.topeMensualUYU).toBe(0);
    expect(estado.disponibleUYU).toBe(0);
  });

  it('nunca informa disponible negativo', async () => {
    conTope(1000);
    const estado = await getEstadoDelTope([campana('A', 500)], QUINCE_DE_JUNIO);
    expect(estado.comprometidoUYU).toBe(8000);
    expect(estado.disponibleUYU).toBe(0);
  });
});
