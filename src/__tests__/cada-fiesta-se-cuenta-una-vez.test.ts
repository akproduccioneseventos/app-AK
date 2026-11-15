import { dedupeImportedEventCopies } from '@/lib/events/event-ordering';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

function fiestaBase(id: string, fecha = '2026-12-10'): FiestaEnPlanificacion {
  return {
    id,
    configuracion: {
      nombreEvento: `Evento ${id}`,
      fechaEvento: fecha,
      tipoCelebracion: 'Boda',
      invitadosEstimados: 100,
    },
  } as unknown as FiestaEnPlanificacion;
}

describe('Orden 305 Bloque 1: Cada fiesta se cuenta una vez', () => {
  it('oculta la copia fiesta_doc_* sin pagos cuando existe fiesta_verified_* con la misma fecha', () => {
    const doc = fiestaBase('fiesta_doc_ana_perez_2026_12_10', '2026-12-10');
    const verified = fiestaBase('fiesta_verified_ana_perez_2026_12_10', '2026-12-10');

    const res = dedupeImportedEventCopies([doc, verified]);
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe(verified.id);
  });

  it('NO oculta la copia fiesta_doc_* si tiene pagos cargados y la marca para revisar duplicado', () => {
    const docConPagos = {
      ...fiestaBase('fiesta_doc_ana_perez_2026_12_10', '2026-12-10'),
      resumenPagos: { totalPagado: 5000, seniaPagada: 5000 },
    } as unknown as FiestaEnPlanificacion;
    const verified = fiestaBase('fiesta_verified_ana_perez_2026_12_10', '2026-12-10');

    const res = dedupeImportedEventCopies([docConPagos, verified]);
    expect(res).toHaveLength(2);
    expect(res.find((f) => f.id === docConPagos.id)?.revisarDuplicado).toBe(true);
  });

  it('conserva ambas copias marcando revisar duplicado cuando tienen fechas distintas', () => {
    const doc = fiestaBase('fiesta_doc_lorena_ferreira_2026_11_01', '2026-11-01');
    const verified = fiestaBase('fiesta_verified_lorena_ferreira_2026_12_15', '2026-12-15');

    const res = dedupeImportedEventCopies([doc, verified]);
    expect(res).toHaveLength(2);
    expect(res.find((f) => f.id === doc.id)?.revisarDuplicado).toBe(true);
  });
});
