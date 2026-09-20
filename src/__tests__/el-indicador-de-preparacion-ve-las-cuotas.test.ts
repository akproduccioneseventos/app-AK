/**
 * MATAFUEGO — El indicador de preparacion de la fiesta no puede decir 100%
 * con el cliente debiendo una cuota.
 *
 * Lo encontro Codex el 20 de septiembre de 2026: el calculo leia
 * `fiesta.planPago` (sin "s") con un `as any`. Ese campo no existe en ninguna parte
 * de la app, asi que la cuenta de cuotas pendientes daba SIEMPRE cero y el indicador
 * marcaba la fiesta como lista aunque la pantalla de cobros mostrara cuotas sin pagar.
 * El plan de pagos vive en `planDePagos`, que es el que leen cobros y el panel contable.
 *
 * Se probo rompiendola a proposito: volviendo a leer `planPago`, esta prueba se pone
 * en rojo.
 */
import { calculateReadinessScore } from '@/lib/readiness-score';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

function fiestaCon(cuotas: Array<{ estado: string }>): FiestaEnPlanificacion {
  return {
    id: 'fiesta_cuotas',
    configuracion: { nombreEvento: 'Fiesta', fechaEvento: '2026-12-31' },
    tareas: [],
    planDePagos: {
      id: 'plan_1',
      fiestaId: 'fiesta_cuotas',
      cuotas: cuotas.map((c, i) => ({
        id: `cuota_${i}`,
        descripcion: `Cuota ${i + 1}`,
        monto: 10000,
        fechaVencimiento: '2026-11-01',
        estado: c.estado,
      })),
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  } as unknown as FiestaEnPlanificacion;
}

describe('El indicador de preparacion ve las cuotas', () => {
  it('con una cuota pendiente no puede dar 100%', () => {
    const informe = calculateReadinessScore(fiestaCon([{ estado: 'pagado' }, { estado: 'pendiente' }]));
    expect(informe.porcentajeReadiness).toBeLessThan(100);
    expect(informe.riesgos.some((r) => r.descripcion.includes('cuota(s) de pago'))).toBe(true);
  });

  it('una cuota vencida y una a medias tambien cuentan', () => {
    const informe = calculateReadinessScore(fiestaCon([{ estado: 'vencido' }, { estado: 'parcial' }]));
    expect(informe.detalles?.pagosPendientes ?? 0).toBe(2);
  });

  it('con todas las cuotas pagas, la plata no descuenta nada', () => {
    const informe = calculateReadinessScore(fiestaCon([{ estado: 'pagado' }, { estado: 'pagado' }]));
    expect(informe.detalles?.pagosPendientes ?? 0).toBe(0);
    expect(informe.riesgos.some((r) => r.descripcion.includes('cuota(s) de pago'))).toBe(false);
  });
});
