import { calcularGananciaDeEvento } from '@/lib/costos/ganancia-evento';
import { compararGanancias } from '@/lib/costos/comparativa';
import { calcularAvisoMargenHistorico } from '@/lib/costos/aviso-margen-historico';
import type { FiestaEnPlanificacion, GestionCostosData, PagoProveedor } from '@/types/fiesta';
import type { PagoCliente, Presupuesto } from '@/types/presupuesto';

describe('Orden 367 B2 y 370 B6.1 — Ganancia, comisiones MP y sueldos', () => {
  it('no confunde "compra" ni "campaña" con comisión de Mercado Pago', () => {
    const gestionCostos: GestionCostosData = {
      ingresosTotalesEstimados: 100000,
      costosItems: [
        { id: 'c1', nombre: 'Comisión compra insumos', category: 'Otros', montoEstimado: 2000 },
        { id: 'c2', nombre: 'Comisión campaña redes', category: 'Marketing', montoEstimado: 3000 },
      ],
      others: {},
    };
    const pagosCliente: PagoCliente[] = [
      {
        id: 'p1',
        fecha: '2026-10-10',
        monto: 100000,
        metodoPago: 'MercadoPago',
        proveedorPago: 'mercadopago',
        estadoPago: 'confirmado',
        comisionProveedor: 5000,
        recargoFinanciero: 0,
      },
    ];

    const r = calcularGananciaDeEvento(gestionCostos, [], pagosCliente);
    expect(r.comisionesMercadoPago).toBe(5000);
  });

  it('descuenta gastos manuales explícitos de comisión MP ("mp", "mercado pago", "mercadopago")', () => {
    const gestionCostos: GestionCostosData = {
      ingresosTotalesEstimados: 100000,
      costosItems: [
        { id: 'c1', nombre: 'Comisión MP', category: 'Otros', montoEstimado: 1500 },
        { id: 'c2', nombre: 'Comisión Mercado Pago', category: 'Otros', montoEstimado: 1000 },
      ],
      others: {},
    };
    const pagosProveedores: PagoProveedor[] = [
      { id: 'pp1', costoAsociadoId: '', fecha: '2026-10-11', monto: 500, concepto: 'comisión mercadopago' } as any,
    ];
    const pagosCliente: PagoCliente[] = [
      {
        id: 'p1',
        fecha: '2026-10-10',
        monto: 100000,
        metodoPago: 'MercadoPago',
        proveedorPago: 'mercadopago',
        estadoPago: 'confirmado',
        comisionProveedor: 5000,
        recargoFinanciero: 0,
      },
    ];

    const r = calcularGananciaDeEvento(gestionCostos, pagosProveedores, pagosCliente);
    expect(r.comisionesMercadoPago).toBe(2000);
  });

  it('en bloques automáticos con pago parcial usa Math.max(pagado, estimado) y suma la diferencia a sinRendir', () => {
    const gestionCostos: GestionCostosData = {
      ingresosTotalesEstimados: 100000,
      costosItems: [],
      others: { totalCateringCost: 40000 },
    };

    const parcial = calcularGananciaDeEvento(gestionCostos, [
      { id: 'p1', costoAsociadoId: 'cat_catering', fecha: '2026-10-01', monto: 10000 },
    ]);
    expect(parcial.costoReal).toBe(40000);
    expect(parcial.sinRendir).toBe(30000);

    const excedido = calcularGananciaDeEvento(gestionCostos, [
      { id: 'p2', costoAsociadoId: 'cat_catering', fecha: '2026-10-01', monto: 45000 },
    ]);
    expect(excedido.costoReal).toBe(45000);
    expect(excedido.sinRendir).toBe(0);
  });

  it('resuelve el sueldo del rol desde Ajustes cuando la asignación tiene sueldo 0 (Orden 370 B6.1)', () => {
    const r = calcularGananciaDeEvento(
      { costosItems: [], others: {} },
      [],
      [],
      [{ rolId: 'mozo', eventSalary: 0 }],
      [{ id: 'mozo', sueldoPorEvento: 4000, porcentajeAportesPatronales: 25 }],
    );
    expect(r.personalEstimado).toBe(5000);
    expect(r.costoReal).toBe(5000);
  });

  it('comparativa y aviso de margen resuelven ingreso con ajuste anual vía resolverIngresoRentabilidad', () => {
    const presupuesto = {
      id: 'pres_1',
      estado: 'Aceptado',
      totalConDescuento: 100000,
      costoTotalEstimado: 100000,
      eventoFecha: '2027-06-15',
      fechaFirmaContrato: '2026-05-01',
      ajusteAnualPorcentaje: 15,
      pagosCliente: [],
      itemsPresupuestados: [],
    } as unknown as Presupuesto;

    const fiesta = {
      id: 'f1',
      presupuestoId: 'pres_1',
      configuracion: {
        nombreEvento: 'Boda',
        tipoCelebracion: 'Boda',
        fechaEvento: '2027-06-15',
        invitadosEstimados: 100,
      },
      gestionCostos: {
        ingresosTotalesEstimados: 100000,
        costosItems: [{ id: 'c1', nombre: 'Catering', category: 'Gastronomía', montoEstimado: 50000 }],
      },
      pagosProveedores: [{ id: 'pp1', costoAsociadoId: 'c1', fecha: '2027-06-01', monto: 65000 }],
    } as unknown as FiestaEnPlanificacion;

    const presupuestosPorId = new Map([['pres_1', presupuesto]]);
    const comp = compararGanancias([fiesta], undefined, undefined, presupuestosPorId);
    expect(comp.fiestas[0].ganancia.ingreso).toBe(115000);
    expect(comp.fiestas[0].ganancia.gananciaReal).toBe(50000);

    const aviso = calcularAvisoMargenHistorico(
      [fiesta, { ...fiesta, id: 'f2' }],
      { tipoEvento: 'Boda', invitados: 100 },
      presupuestosPorId,
    );
    expect(aviso).not.toBeNull();
    expect(aviso?.desvioPorcentaje).toBe(30);
  });
});
