import { normalizePresupuestoFinancials } from '@/lib/budget/financial-guardrails';
import type { Presupuesto } from '@/types/presupuesto';

/**
 * El ajuste anual corresponde SIEMPRE en un evento contratado que se celebra en
 * un año posterior. Es decisión del dueño.
 *
 * Antes la marca se ponía sólo al facturar, así que un presupuesto aceptado y
 * todavía sin facturar mostraba el precio del año en que se firmó. Con los
 * contratos cargados de eventos anteriores eso son miles de pesos por contrato,
 * y en silencio.
 */

function presupuesto(extra: Partial<Presupuesto> = {}): Presupuesto {
  return {
    id: 'p1',
    numero: 1,
    estado: 'Borrador',
    clienteNombre: 'Familia Pérez',
    eventoFecha: '2027-03-14',
    timestamp: '2026-02-01T10:00:00.000Z',
    itemsPresupuestados: [],
    costoTotalEstimado: 100000,
    invitadosAdultos: 80,
    invitadosNinos: 0,
    invitadosAdolescentes: 0,
    pagosCliente: [],
    ...extra,
  } as unknown as Presupuesto;
}

describe('el ajuste anual se marca solo cuando el evento queda contratado', () => {
  it('un presupuesto aceptado queda con el ajuste activo', () => {
    const resultado = normalizePresupuestoFinancials(presupuesto({ estado: 'Aceptado' }));
    expect(resultado.ajusteAnualActivo).toBe(true);
  });

  it('un presupuesto facturado tambien', () => {
    const resultado = normalizePresupuestoFinancials(presupuesto({ estado: 'Facturado' }));
    expect(resultado.ajusteAnualActivo).toBe(true);
  });

  it('un borrador no se toca: todavia no hay nada contratado', () => {
    const resultado = normalizePresupuestoFinancials(presupuesto({ estado: 'Borrador' }));
    expect(resultado.ajusteAnualActivo).toBeUndefined();
  });

  it('si el dueño lo apago a proposito, se respeta', () => {
    const resultado = normalizePresupuestoFinancials(
      presupuesto({ estado: 'Aceptado', ajusteAnualActivo: false }),
    );
    expect(resultado.ajusteAnualActivo).toBe(false);
  });

  it('si ya estaba activo, sigue activo', () => {
    const resultado = normalizePresupuestoFinancials(
      presupuesto({ estado: 'Aceptado', ajusteAnualActivo: true }),
    );
    expect(resultado.ajusteAnualActivo).toBe(true);
  });
});
