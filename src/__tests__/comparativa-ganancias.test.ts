import { compararGanancias } from '@/lib/costos/comparativa';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

/**
 * Con esta comparación el dueño decide qué tipo de fiesta le conviene vender. Si
 * los promedios están mal, decide mal.
 */

function fiesta(
  id: string,
  tipo: string,
  fecha: string,
  ingreso: number,
  costo: number,
): FiestaEnPlanificacion {
  return {
    id,
    configuracion: { nombreEvento: `Fiesta ${id}`, tipoCelebracion: tipo, fechaEvento: fecha },
    gestionCostos: {
      ingresosTotalesEstimados: ingreso,
      costosItems: [{ id: `${id}-c`, nombre: 'Todo', category: 'varios', montoEstimado: costo }],
      others: {},
    },
  } as unknown as FiestaEnPlanificacion;
}

describe('comparar la ganancia entre fiestas', () => {
  it('agrupa por tipo y ordena de la que más deja a la que menos', () => {
    const r = compararGanancias([
      fiesta('a', 'Casamiento', '2026-03-14', 200000, 120000),
      fiesta('b', 'XV años', '2026-04-10', 100000, 80000),
      fiesta('c', 'Casamiento', '2026-05-09', 180000, 100000),
    ]);

    expect(r.porTipo.map((g) => g.clave)).toEqual(['Casamiento', 'XV años']);
    expect(r.porTipo[0].cantidad).toBe(2);
    expect(r.porTipo[0].gananciaReal).toBe(160000);
    expect(r.porTipo[0].gananciaPromedio).toBe(80000);
    expect(r.porTipo[1].gananciaReal).toBe(20000);
  });

  it('el margen del grupo sale de los totales, no del promedio de porcentajes', () => {
    // Una fiesta chica con 50% de margen y una grande con 10%. Promediar los
    // porcentajes daria 30%, que no es lo que paso de verdad.
    const r = compararGanancias([
      fiesta('chica', 'Cumpleaños', '2026-03-14', 10000, 5000),
      fiesta('grande', 'Cumpleaños', '2026-04-14', 200000, 180000),
    ]);

    const grupo = r.porTipo[0];
    expect(grupo.ingreso).toBe(210000);
    expect(grupo.gananciaReal).toBe(25000);
    expect(grupo.margenReal).toBeCloseTo(11.9, 1);
  });

  it('agrupa por mes usando la fecha del evento, en orden', () => {
    const r = compararGanancias([
      fiesta('b', 'XV años', '2026-05-02', 100000, 40000),
      fiesta('a', 'Casamiento', '2026-03-14', 100000, 50000),
    ]);

    expect(r.porMes.map((g) => g.clave)).toEqual(['2026-03', '2026-05']);
  });

  it('la fecha no se corre un mes por el huso horario', () => {
    // El primero del mes es el caso donde un dia de corrimiento cambia el mes.
    const r = compararGanancias([fiesta('a', 'Casamiento', '2026-06-01', 100000, 10000)]);

    expect(r.porMes[0].clave).toBe('2026-06');
  });

  it('ordena las fiestas de la que más dejó a la que menos', () => {
    const r = compararGanancias([
      fiesta('poco', 'XV años', '2026-03-14', 100000, 95000),
      fiesta('mucho', 'Casamiento', '2026-03-15', 200000, 80000),
    ]);

    expect(r.fiestas.map((f) => f.id)).toEqual(['mucho', 'poco']);
  });

  it('muestra las fiestas que dieron pérdida, no las esconde', () => {
    const r = compararGanancias([fiesta('mala', 'Cumpleaños', '2026-03-14', 50000, 70000)]);

    expect(r.fiestas[0].ganancia.gananciaReal).toBe(-20000);
    expect(r.total.gananciaReal).toBe(-20000);
  });

  it('deja afuera las fiestas sin nada cargado, que ensuciarían el promedio', () => {
    const vacia = fiesta('vacia', 'Casamiento', '2026-03-14', 0, 0);

    const r = compararGanancias([fiesta('a', 'Casamiento', '2026-03-14', 100000, 50000), vacia]);

    expect(r.fiestas).toHaveLength(1);
    expect(r.porTipo[0].cantidad).toBe(1);
    expect(r.porTipo[0].gananciaPromedio).toBe(50000);
  });

  it('cuenta cuántas fiestas todavía no tienen gasto real cargado', () => {
    const r = compararGanancias([
      fiesta('a', 'Casamiento', '2026-03-14', 100000, 50000),
      fiesta('b', 'XV años', '2026-04-14', 100000, 50000),
    ]);

    expect(r.sinGastoCargado).toBe(2);
  });

  it('una fiesta sin tipo no se pierde: queda agrupada aparte', () => {
    const sinTipo = fiesta('x', '', '2026-03-14', 100000, 50000);

    const r = compararGanancias([sinTipo]);

    expect(r.porTipo[0].clave).toBe('Sin tipo');
  });

  it('una fiesta sin fecha no aparece en los meses pero sí en el total', () => {
    const sinFecha = fiesta('x', 'Casamiento', '', 100000, 50000);

    const r = compararGanancias([sinFecha]);

    expect(r.porMes).toHaveLength(0);
    expect(r.total.gananciaReal).toBe(50000);
  });

  it('sin fiestas no explota', () => {
    const r = compararGanancias([]);

    expect(r.fiestas).toHaveLength(0);
    expect(r.total.gananciaReal).toBe(0);
    expect(r.total.margenReal).toBe(0);
  });
});
