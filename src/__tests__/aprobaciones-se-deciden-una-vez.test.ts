import { yaFueDecidida } from '@/lib/aprobaciones/decision';
import type { AprobacionRequest } from '@/types/approval';

/**
 * Defecto real: aprobar y rechazar no miraban en que estado estaba la solicitud.
 * Un cambio de presupuesto ya rechazado se podia volver a aprobar, y el campo de
 * quien decidio se pisaba con el ultimo que apretara el boton. Sobre solicitudes
 * que llevan impacto en pesos, eso es plata autorizada sin poder reconstruir por
 * quien.
 */

function solicitud(extra: Partial<AprobacionRequest> = {}): AprobacionRequest {
  return {
    id: 'apr_1',
    fiestaId: 'f_1',
    tipoCambio: 'presupuesto',
    descripcion: 'Suben dos mesas',
    valorAntes: '100000',
    valorDespues: '120000',
    impactoEconomico: 20000,
    impactoOperativo: 'Dos mesas mas',
    solicitadoPor: 'organizacion',
    solicitadoEn: '2026-08-10T10:00:00.000Z',
    estadoAprobacion: 'Pendiente',
    version: 1,
    ...extra,
  };
}

describe('una solicitud de cambio se decide una sola vez', () => {
  it('una solicitud pendiente se puede decidir', () => {
    expect(yaFueDecidida(solicitud())).toBeNull();
  });

  it('una ya aprobada no se vuelve a decidir, y dice quien fue', () => {
    const aviso = yaFueDecidida(
      solicitud({
        estadoAprobacion: 'Aprobado',
        aprobadoPor: 'ana@ak.uy',
        aprobadoEn: '2026-08-11T12:00:00.000Z',
      }),
    );
    expect(aviso).toContain('aprobada');
    expect(aviso).toContain('ana@ak.uy');
    expect(aviso).toContain('solicitud nueva');
  });

  it('una ya rechazada tampoco se puede aprobar despues', () => {
    const aviso = yaFueDecidida(solicitud({ estadoAprobacion: 'Rechazado' }));
    expect(aviso).toContain('rechazada');
  });

  it('sin fecha ni nombre guardados igual avisa, sin texto roto', () => {
    const aviso = yaFueDecidida(solicitud({ estadoAprobacion: 'Aprobado' }));
    expect(aviso).toContain('ya fue aprobada');
    expect(aviso).not.toContain('undefined');
    expect(aviso).not.toContain('Invalid');
  });

  it('una fecha ilegible no rompe el aviso', () => {
    const aviso = yaFueDecidida(
      solicitud({ estadoAprobacion: 'Aprobado', aprobadoEn: 'cualquier cosa' }),
    );
    expect(aviso).toContain('ya fue aprobada');
    expect(aviso).not.toContain('Invalid');
  });
});
