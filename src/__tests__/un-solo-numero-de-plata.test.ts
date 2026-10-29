/** @jest-environment node */

import { calcularGananciaDeEvento } from '@/lib/costos/ganancia-evento';
import { compararGanancias } from '@/lib/costos/comparativa';
import { calculateFinancialLedger } from '@/lib/commercial-flow/ledger-service';
import { calcularDeudas } from '@/lib/multiagent/contexto-negocio';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { PagoCliente, Presupuesto } from '@/types/presupuesto';
import type { Invoice } from '@/types/invoice';

let mockPresupuestos: Presupuesto[] = [];
let mockInvoices: Invoice[] = [];
let mockFiestas: FiestaEnPlanificacion[] = [];

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => undefined),
  requirePermisoAlguno: jest.fn(async () => undefined),
  requirePermiso: jest.fn(async () => ({ ok: true })),
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => ({ success: true, user: { perfil: 'dueno' } })),
}));

jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestos: jest.fn(async () => mockPresupuestos),
}));

jest.mock('@/app/actions/invoices', () => ({
  getInvoices: jest.fn(async () => mockInvoices),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getAllFiestas: jest.fn(async () => mockFiestas),
  getFiestas: jest.fn(async () => mockFiestas),
}));

jest.mock('@/lib/roles/leer-roles-interno', () => ({
  leerRolesInterno: jest.fn(async () => []),
}));

jest.mock('@/app/actions/empleados', () => ({
  getEmpleados: jest.fn(async () => []),
}));

jest.mock('@/app/actions/gastos', () => ({
  getGastosGenerales: jest.fn(async () => []),
}));

import { getProfitAndLossData } from '@/app/actions/reportes';
import { getAnalyticsData } from '@/app/actions/analytics';

describe('Orden 251 — Un solo número de plata en toda la app', () => {
  beforeEach(() => {
    mockPresupuestos = [];
    mockInvoices = [];
    mockFiestas = [];
    jest.clearAllMocks();
  });

  describe('1. Comisión de Mercado Pago', () => {
    it('Reportes, Analíticas, Finanzas y Comparativa dan 97.000 con 3.000 de comisión y 100.000 con comisión 0', async () => {
      const armarEscenario = (comision: number) => {
        const pagos: PagoCliente[] = [
          {
            id: 'pago-mp-1',
            fecha: '2026-10-15',
            monto: 100000,
            metodoPago: 'MercadoPago',
            proveedorPago: 'mercadopago',
            estadoPago: 'confirmado',
            comisionProveedor: comision,
            recargoFinanciero: 0,
          },
        ];

        const presupuesto: Presupuesto = {
          id: 'pres-1',
          clienteNombre: 'Cliente MP',
          estado: 'Aceptado',
          totalConDescuento: 100000,
          eventoFecha: '2026-10-15',
          fechaFirmaContrato: '2026-10-01',
          timestamp: '2026-10-01T10:00:00Z',
          pagosCliente: pagos,
        } as unknown as Presupuesto;

        const fiesta: FiestaEnPlanificacion = {
          id: 'fiesta-1',
          presupuestoId: 'pres-1',
          estado: 'En Planificación',
          configuracion: {
            nombreEvento: 'Boda MP',
            tipoCelebracion: 'Boda',
            fechaEvento: '2026-10-15',
          },
          gestionCostos: {
            ingresosTotalesEstimados: 100000,
            costosItems: [],
          },
          pagosProveedores: [],
        } as unknown as FiestaEnPlanificacion;

        return { pagos, presupuesto, fiesta };
      };

      // --- Caso con 3.000 de comisión -> dan 97.000 ---
      const escCon = armarEscenario(3000);
      mockPresupuestos = [escCon.presupuesto];
      mockFiestas = [escCon.fiesta];

      // A) Reportes
      const repCon = await getProfitAndLossData({
        from: new Date('2026-10-01'),
        to: new Date('2026-10-31'),
      });
      expect(repCon.success).toBe(true);
      expect(repCon.data!.ingresos.total).toBe(97000);

      // B) Analíticas
      const anaCon = await getAnalyticsData();
      expect(anaCon.success).toBe(true);
      const mesOctubreCon = anaCon.data!.monthlyProfitability.find(
        (m) => m.ingresos === 100000,
      );
      expect(mesOctubreCon).toBeDefined();
      expect(mesOctubreCon!.ingresos - mesOctubreCon!.costos).toBe(97000);

      // C) Finanzas (cuenta oficial ganancia-evento)
      const finCon = calcularGananciaDeEvento(
        escCon.fiesta.gestionCostos,
        escCon.fiesta.pagosProveedores,
        escCon.pagos,
      );
      expect(finCon.gananciaReal).toBe(97000);
      expect(finCon.costoReal).toBe(3000);

      // D) Comparativa
      const cobrosMapCon = new Map([[escCon.presupuesto.id, escCon.pagos]]);
      const compCon = compararGanancias([escCon.fiesta], cobrosMapCon);
      expect(compCon.fiestas[0].ganancia.gananciaReal).toBe(97000);

      // --- Caso con comisión 0 -> dan 100.000 ---
      const escSin = armarEscenario(0);
      mockPresupuestos = [escSin.presupuesto];
      mockFiestas = [escSin.fiesta];

      // A) Reportes
      const repSin = await getProfitAndLossData({
        from: new Date('2026-10-01'),
        to: new Date('2026-10-31'),
      });
      expect(repSin.success).toBe(true);
      expect(repSin.data!.ingresos.total).toBe(100000);

      // B) Analíticas
      const anaSin = await getAnalyticsData();
      expect(anaSin.success).toBe(true);
      const mesOctubreSin = anaSin.data!.monthlyProfitability.find(
        (m) => m.ingresos === 100000,
      );
      expect(mesOctubreSin).toBeDefined();
      expect(mesOctubreSin!.ingresos - mesOctubreSin!.costos).toBe(100000);

      // C) Finanzas
      const finSin = calcularGananciaDeEvento(
        escSin.fiesta.gestionCostos,
        escSin.fiesta.pagosProveedores,
        escSin.pagos,
      );
      expect(finSin.gananciaReal).toBe(100000);
      expect(finSin.costoReal).toBe(0);

      // D) Comparativa
      const cobrosMapSin = new Map([[escSin.presupuesto.id, escSin.pagos]]);
      const compSin = compararGanancias([escSin.fiesta], cobrosMapSin);
      expect(compSin.fiestas[0].ganancia.gananciaReal).toBe(100000);
    });
  });

  describe('2. Pago al proveedor por período', () => {
    it('un pago del 21/10 de una fiesta del 20/09 aparece en el reporte de octubre y no en el de septiembre', async () => {
      const fiesta: FiestaEnPlanificacion = {
        id: 'fiesta-sep',
        configuracion: {
          nombreEvento: 'Quince de Setiembre',
          tipoCelebracion: 'Quince',
          fechaEvento: '2026-09-20',
        },
        gestionCostos: {
          ingresosTotalesEstimados: 50000,
          costosItems: [{ id: 'costo-dj', nombre: 'DJ', montoEstimado: 10000 }],
        },
        pagosProveedores: [
          {
            id: 'pago-prov-oct',
            costoAsociadoId: 'costo-dj',
            fecha: '2026-10-21',
            monto: 10000,
          },
        ],
      } as unknown as FiestaEnPlanificacion;

      mockFiestas = [fiesta];

      // Reporte de octubre
      const repOctubre = await getProfitAndLossData({
        from: new Date('2026-10-01'),
        to: new Date('2026-10-31'),
      });
      expect(repOctubre.success).toBe(true);
      expect(repOctubre.data!.costos.total).toBe(10000);
      expect(repOctubre.data!.costos.detalle).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'pago-pago-prov-oct',
            fecha: '2026-10-21',
            monto: 10000,
          }),
        ]),
      );

      // Reporte de septiembre
      const repSeptiembre = await getProfitAndLossData({
        from: new Date('2026-09-01'),
        to: new Date('2026-09-30'),
      });
      expect(repSeptiembre.success).toBe(true);
      const pagoEnSep = repSeptiembre.data!.costos.detalle.find(
        (c) => c.id === 'pago-pago-prov-oct',
      );
      expect(pagoEnSep).toBeUndefined();
    });
  });

  describe('3. Seña sin presupuesto asociado', () => {
    it('una seña de 1.000 sin presupuesto aparece una vez como "Seña cobrada"', async () => {
      mockInvoices = [
        {
          id: 'inv-sena-1',
          invoiceNumber: 'SEÑA-2026-001',
          documentKind: 'deposit_receipt',
          status: 'Paid',
          totalAmount: 1000,
          issueDate: '2026-10-05',
          dueDate: '2026-10-05',
          payments: [
            {
              id: 'pay-sena-1',
              paymentDate: '2026-10-05',
              amount: 1000,
              method: 'Transferencia',
            },
          ],
        } as unknown as Invoice,
      ];
      mockPresupuestos = [];

      const rep = await getProfitAndLossData({
        from: new Date('2026-10-01'),
        to: new Date('2026-10-31'),
      });

      expect(rep.success).toBe(true);
      const senas = rep.data!.ingresos.detalle.filter((i) => i.concepto === 'Seña cobrada');
      expect(senas.length).toBe(1);
      expect(senas[0].monto).toBe(1000);
      expect(rep.data!.ingresos.total).toBe(1000);
    });
  });

  describe('4. Saldo pendiente acumulado sin solapar deudas', () => {
    it('el cliente A debe 10.000 y el B pagó 2.000 de más -> deuda informada es 10.000 en panel, alerta y asistentes', () => {
      const presA: Presupuesto = {
        id: 'p-a',
        clienteNombre: 'Cliente A',
        estado: 'Aceptado',
        totalConDescuento: 10000,
        pagosCliente: [],
      } as unknown as Presupuesto;

      const presB: Presupuesto = {
        id: 'p-b',
        clienteNombre: 'Cliente B',
        estado: 'Aceptado',
        totalConDescuento: 5000,
        pagosCliente: [
          {
            id: 'pay-b',
            monto: 7000,
            estadoPago: 'confirmado',
            fecha: '2026-10-10',
          },
        ],
      } as unknown as Presupuesto;

      // 1. Libro mayor / panel
      const ledger = calculateFinancialLedger([presA, presB], []);
      expect(ledger.saldoPendiente).toBe(10000);

      // 2. Alerta / asistente (calcularDeudas)
      const deudas = calcularDeudas([presA, presB]);
      expect(deudas.total).toBe(10000);
      expect(deudas.deudores.length).toBe(1);
      expect(deudas.deudores[0].cliente).toBe('Cliente A');
      expect(deudas.deudores[0].deuda).toBe(10000);
    });
  });

  describe('5. Zona horaria de Uruguay en fecha de cobro', () => {
    it('un cobro a las 23:30 del 31/10 en Uruguay cae en octubre en el libro y en el reporte', async () => {
      // 23:30 en Uruguay (-3) = 02:30 del 01/11 en UTC
      const fechaUtc = '2026-11-01T02:30:00Z';

      const pres: Presupuesto = {
        id: 'p-horario',
        clienteNombre: 'Cliente Horario',
        estado: 'Aceptado',
        totalConDescuento: 50000,
        eventoFecha: '2026-10-31',
        pagosCliente: [
          {
            id: 'pay-noches',
            monto: 50000,
            estadoPago: 'confirmado',
            fecha: fechaUtc,
          },
        ],
      } as unknown as Presupuesto;

      // Libro mayor
      const ledger = calculateFinancialLedger([pres], []);
      const mesOctubre = ledger.porMes.find((m) => m.mes === '2026-10');
      expect(mesOctubre).toBeDefined();
      expect(mesOctubre!.cobros).toBe(50000);

      const mesNoviembre = ledger.porMes.find((m) => m.mes === '2026-11');
      expect(mesNoviembre?.cobros ?? 0).toBe(0);

      // Reportes
      mockPresupuestos = [pres];
      const rep = await getProfitAndLossData({
        from: new Date('2026-10-01'),
        to: new Date('2026-10-31'),
      });
      expect(rep.success).toBe(true);
      expect(rep.data!.ingresos.total).toBe(50000);
    });
  });

  describe('6. Renglón con pago parcial', () => {
    it('un renglón con estimado 5.000 y pagado 2.000 cuesta 5.000', () => {
      const gestionCostos = {
        ingresosTotalesEstimados: 50000,
        costosItems: [
          { id: 'c-parcial', nombre: 'Fotógrafo', montoEstimado: 5000 },
        ],
      };
      const pagos = [
        { id: 'p-1', costoAsociadoId: 'c-parcial', fecha: '2026-10-10', monto: 2000 },
      ];

      const resultado = calcularGananciaDeEvento(gestionCostos as any, pagos as any);
      expect(resultado.costoReal).toBe(5000);
      expect(resultado.sinRendir).toBe(3000);
    });

    it('si el renglón se marca como cerrado, cuesta sólo lo pagado', () => {
      const gestionCostos = {
        ingresosTotalesEstimados: 50000,
        costosItems: [
          { id: 'c-parcial', nombre: 'Fotógrafo', montoEstimado: 5000, cerrado: true },
        ],
      };
      const pagos = [
        { id: 'p-1', costoAsociadoId: 'c-parcial', fecha: '2026-10-10', monto: 2000 },
      ];

      const resultado = calcularGananciaDeEvento(gestionCostos as any, pagos as any);
      expect(resultado.costoReal).toBe(2000);
      expect(resultado.sinRendir).toBe(0);
    });
  });
});
