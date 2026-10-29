/** @jest-environment node */
import { PREGUNTAS_FRECUENTES_DEL_CONTRATO } from '@/data/preguntas-frecuentes-contrato';
import { getBudgetCollectibleTotal, getBudgetPaymentSummary } from '@/lib/budget/financial-guardrails';
import type { Presupuesto } from '@/types/presupuesto';

describe('FAQ del ajuste anual coincide con la fórmula real del contrato', () => {
  it('la FAQ tiene el texto exacto del contrato y no dice sobre lo que falte', () => {
    const faq = PREGUNTAS_FRECUENTES_DEL_CONTRATO.find((p) =>
      p.pregunta.includes('el año que viene'),
    );
    expect(faq).toBeDefined();
    expect(faq?.respuesta).not.toContain('sobre lo que falte');
    expect(faq?.respuesta).toContain('Sí. Si el evento es en un año posterior al de la firma');
    expect(faq?.respuesta).toContain('115.000');
    expect(faq?.respuesta).toContain('65.000');
  });

  it('el ejemplo de la FAQ (100.000 base, 50.000 pagado, 1 año después) da saldo 65.000 en la app', () => {
    // Ejemplo de la FAQ: presupuesto base $100.000, firmado en 2026, evento en 2027 (1 año después),
    // pagados $50.000. El total pasa a $115.000 (+15%) y el saldo queda en $65.000.
    const presupuestoEjemplo: Presupuesto = {
      id: 'p-faq-test',
      clienteNombre: 'Cliente FAQ',
      estado: 'Aceptado',
      fechaFirmaContrato: '2026-03-01',
      timestamp: '2026-03-01T10:00:00Z',
      eventoFecha: '2027-04-15',
      totalConDescuento: 100000,
      ajusteAnualActivo: true,
      ajusteAnualPorcentaje: 15,
      pagosCliente: [
        {
          id: 'pago-1',
          fecha: '2026-04-01',
          monto: 50000,
          estadoPago: 'confirmado',
          metodoPago: 'Transferencia',
        },
      ],
    } as unknown as Presupuesto;

    const totalCobrado = getBudgetCollectibleTotal(presupuestoEjemplo);
    expect(totalCobrado).toBe(115000);

    const summary = getBudgetPaymentSummary(presupuestoEjemplo, {
      includeAnnualAdjustment: true,
    });
    expect(summary.total).toBe(115000);
    expect(summary.paid).toBe(50000);
    expect(summary.balance).toBe(65000);
  });
});
