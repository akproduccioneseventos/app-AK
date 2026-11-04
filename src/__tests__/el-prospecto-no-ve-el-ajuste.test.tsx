import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import BudgetDocument from '@/components/budget/BudgetDocument';
import type { Presupuesto } from '@/types/presupuesto';
import type { AnnualAdjustmentProjection } from '@/lib/budget/formal-budget';

beforeAll(() => {
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
});

afterAll(() => {
  Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
});

describe('Orden 267: El prospecto no ve el ajuste anual', () => {
  const annualProjection2030: AnnualAdjustmentProjection = {
    applies: true,
    currentYear: 2026,
    eventYear: 2030,
    adjustmentPct: 15,
    baseTotal: 100000,
    adjustedTotal: 160000,
    adjustmentAmount: 60000,
    rows: [
      { year: 2026, total: 100000, adjustmentAmount: 0 },
      { year: 2027, total: 115000, adjustmentAmount: 15000 },
      { year: 2028, total: 130000, adjustmentAmount: 30000 },
      { year: 2029, total: 145000, adjustmentAmount: 45000 },
      { year: 2030, total: 160000, adjustmentAmount: 60000 },
    ],
  };

  const createPresupuesto = (estado: Presupuesto['estado']): Presupuesto => ({
    id: 'pres_test_2030',
    numero: 203001,
    clienteNombre: 'Prospecto Futuro',
    clienteContacto: '099123456',
    eventoTipo: 'Cumpleaños',
    eventoFecha: '2030-11-20T18:00:00.000Z',
    duracionHoras: 5,
    invitadosCantidad: 80,
    invitadosAdultos: 80,
    invitadosNinos: 0,
    invitadosAdolescentes: 0,
    salonFiestas: 'Salón Propio',
    itemsPresupuestados: [
      {
        idServicioCatalogo: 'serv_dj_base',
        nombreServicio: 'DJ y Luces',
        cantidad: 1,
        precioUnitario: 50000,
        precioUnitarioPresupuesto: 50000,
        costoTotalItem: 50000,
      },
    ],
    costoTotalEstimado: 50000,
    totalConDescuento: 50000,
    timestamp: '2026-03-01T12:00:00.000Z',
    estado,
    ajusteAnualActivo: true,
    ajusteAnualPorcentaje: 15,
  });

  it('BudgetDocument con presupuesto no contratado (Borrador) para 2030 no muestra "Proyección" ni "15%"', () => {
    const host = document.body.appendChild(document.createElement('div'));
    const root = createRoot(host);

    const presupuesto = createPresupuesto('Borrador');

    act(() => {
      root.render(
        <BudgetDocument
          presupuesto={presupuesto}
          annualProjection={annualProjection2030}
          adjustmentPct={15}
        />
      );
    });

    const text = host.textContent || '';
    expect(text).not.toContain('Proyección de Precios por Año');
    expect(text).not.toContain('Proyeccion de Precios por Año');
    expect(text).not.toContain('15%');

    act(() => root.unmount());
    host.remove();
  });

  it('BudgetDocument con presupuesto no contratado (Enviado) para 2030 no muestra "Proyección" ni "15%"', () => {
    const host = document.body.appendChild(document.createElement('div'));
    const root = createRoot(host);

    const presupuesto = createPresupuesto('Enviado');

    act(() => {
      root.render(
        <BudgetDocument
          presupuesto={presupuesto}
          annualProjection={annualProjection2030}
          adjustmentPct={15}
        />
      );
    });

    const text = host.textContent || '';
    expect(text).not.toContain('Proyección de Precios por Año');
    expect(text).not.toContain('Proyeccion de Precios por Año');
    expect(text).not.toContain('15%');

    act(() => root.unmount());
    host.remove();
  });

  it('BudgetDocument con presupuesto contratado (Aceptado) para 2030 sí muestra la proyección y el 15%', () => {
    const host = document.body.appendChild(document.createElement('div'));
    const root = createRoot(host);

    const presupuesto = createPresupuesto('Aceptado');

    act(() => {
      root.render(
        <BudgetDocument
          presupuesto={presupuesto}
          annualProjection={annualProjection2030}
          adjustmentPct={15}
        />
      );
    });

    const text = host.textContent || '';
    expect(text).toContain('Proyección de Precios por Año');
    expect(text).toContain('15%');

    act(() => root.unmount());
    host.remove();
  });

  it('BudgetDocument con presupuesto contratado (Facturado) para 2030 sí muestra la proyección y el 15%', () => {
    const host = document.body.appendChild(document.createElement('div'));
    const root = createRoot(host);

    const presupuesto = createPresupuesto('Facturado');

    act(() => {
      root.render(
        <BudgetDocument
          presupuesto={presupuesto}
          annualProjection={annualProjection2030}
          adjustmentPct={15}
        />
      );
    });

    const text = host.textContent || '';
    expect(text).toContain('Proyección de Precios por Año');
    expect(text).toContain('15%');

    act(() => root.unmount());
    host.remove();
  });
});
