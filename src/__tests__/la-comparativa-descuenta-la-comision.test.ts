/**
 * La comparación de ganancias entre fiestas también descuenta la comisión de Mercado Pago
 * (28/09/2026): la acción junta los cobros de cada presupuesto con su fiesta.
 */
jest.mock('@/lib/auth/require-session', () => ({ requirePermiso: jest.fn(async () => ({ ok: true })) }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestas: jest.fn(async () => [{
    id: 'f1',
    presupuestoId: 'b1',
    configuracion: { nombreEvento: 'Boda', tipoCelebracion: 'Boda', fechaEvento: '2026-10-03' },
    gestionCostos: { ingresosTotalesEstimados: 100000, costosItems: [] },
    pagosProveedores: [],
  }]),
}));
jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestos: jest.fn(async () => [{
    id: 'b1',
    pagosCliente: [{
      id: 'p', fecha: '2026-09-01', monto: 50000, metodoPago: 'MercadoPago', estadoPago: 'confirmado',
      proveedorPago: 'mercadopago', comisionProveedor: 3000, recargoFinanciero: 0,
    }],
  }]),
}));

import { getComparativaDeGanancias } from '@/app/actions/comparativa-ganancias';

it('la ganancia de la fiesta en la comparación ya viene sin la comisión', async () => {
  const res = await getComparativaDeGanancias();
  expect(res.ok).toBe(true);
  expect(res.comparativa?.fiestas[0].ganancia.comisionesMercadoPago).toBe(3000);
  expect(res.comparativa?.fiestas[0].ganancia.gananciaReal).toBe(97000);
});
