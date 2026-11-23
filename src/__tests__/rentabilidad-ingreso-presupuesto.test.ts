/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import fs from 'fs';
import path from 'path';
import { resolverIngresoRentabilidad } from '@/lib/costos/ingreso-rentabilidad';
import { getBudgetPaymentSummary } from '@/lib/budget/financial-guardrails';
import { calcularGananciaDeEvento } from '@/lib/costos/ganancia-evento';
import type { Presupuesto } from '@/types/presupuesto';

const mockGetFiestaById = jest.fn();
const mockUpdateGestionCostosFiestaActual = jest.fn();
const mockAgregarPagoProveedorFiestaActual = jest.fn();
const mockSyncAllEventCosts = jest.fn();
const mockGetPresupuestoById = jest.fn();
const mockGetRoles = jest.fn();
const mockToast = jest.fn();

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('fiestaId=fiesta-1'),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/fiestas/nueva/gestion-costos-rentabilidad',
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

jest.mock('@/app/actions/fiesta-actual', () => ({
  getFiestaById: (...args: unknown[]) => mockGetFiestaById(...args),
  updateGestionCostosFiestaActual: (...args: unknown[]) => mockUpdateGestionCostosFiestaActual(...args),
  agregarPagoProveedorFiestaActual: (...args: unknown[]) => mockAgregarPagoProveedorFiestaActual(...args),
}));

jest.mock('@/app/actions/fiesta/costos.actions', () => ({
  syncAllEventCosts: (...args: unknown[]) => mockSyncAllEventCosts(...args),
}));

jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestoById: (...args: unknown[]) => mockGetPresupuestoById(...args),
}));

jest.mock('@/app/actions/roles', () => ({
  getRoles: (...args: unknown[]) => mockGetRoles(...args),
}));

import { GestionCostosRentabilidadContent } from '@/components/fiestas/panels/gestion-costos-rentabilidad';

function hacerPresupuesto(overrides: Partial<Presupuesto> = {}): Presupuesto {
  return {
    id: 'pres-1',
    clienteNombre: 'Lucía Pérez',
    eventoTipo: 'Boda',
    eventoFecha: '2027-05-15T21:00:00.000Z',
    invitadosCantidad: 100,
    salonFiestas: 'Salón Central',
    itemsPresupuestados: [],
    costoTotalEstimado: 185000,
    totalConDescuento: 185000,
    timestamp: '2026-08-10T12:00:00.000Z',
    estado: 'Aceptado',
    ajusteAnualActivo: false,
    ...overrides,
  };
}

describe('Bloque 3: Rentabilidad toma ingreso desde la misma fuente que el plan de pagos', () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeAll(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterAll(() => {
    Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRoles.mockResolvedValue([]);
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('usa getBudgetPaymentSummary con includeAnnualAdjustment en gestion-costos-rentabilidad.tsx', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'src/components/fiestas/panels/gestion-costos-rentabilidad.tsx'),
      'utf8',
    );
    expect(source).toContain('includeAnnualAdjustment');
    expect(source).toContain('getBudgetPaymentSummary');
  });

  it('sin presupuesto vinculado marca estado sin_presupuesto y no calcula ganancia negativa sobre $0', async () => {
    const resultado = resolverIngresoRentabilidad({
      presupuestoId: undefined,
      presupuesto: null,
      ingresosGuardados: 0,
    });
    expect(resultado.estado).toBe('sin_presupuesto');
    expect(resultado.ingreso).toBeNull();

    mockGetFiestaById.mockResolvedValue({
      id: 'fiesta-1',
      presupuestoId: undefined,
      personalAsignado: [],
      pagosProveedores: [],
      gestionCostos: {
        ingresosTotalesEstimados: 0,
        costosItems: [{ id: 'c1', nombre: 'Flete', category: 'Compra General', montoEstimado: 13100 }],
        others: {},
      },
    });

    await act(async () => {
      root.render(React.createElement(GestionCostosRentabilidadContent));
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const cardIngreso = host.querySelector('[data-testid="card-ingreso-pactado"]')?.textContent ?? '';
    const cardGanancia = host.querySelector('[data-testid="card-ganancia-evento"]')?.textContent ?? '';

    expect(cardIngreso).toContain('Sin presupuesto vinculado');
    expect(cardGanancia).toContain('Sin presupuesto vinculado');
    expect(cardGanancia).not.toContain('13.100');
    expect(mockUpdateGestionCostosFiestaActual).not.toHaveBeenCalled();
  });

  it('con presupuesto vinculado coincide con el plan de pagos (incluyendo ajuste anual) y marca sincronizado', async () => {
    const presupuestoConAjuste = hacerPresupuesto({
      totalConDescuento: 100000,
      ajusteAnualActivo: true,
      ajusteAnualPorcentaje: 10,
      fechaFirmaContrato: '2026-01-10T10:00:00.000Z',
      eventoFecha: '2027-05-15T21:00:00.000Z',
    });

    const totalPlanPagos = getBudgetPaymentSummary(presupuestoConAjuste, {
      includeAnnualAdjustment: true,
    }).total;
    expect(totalPlanPagos).toBe(110000);

    const resultado = resolverIngresoRentabilidad({
      presupuestoId: 'pres-1',
      presupuesto: presupuestoConAjuste,
      ingresosGuardados: 110000,
      fechaFiestaUpdatedAt: '2026-08-15T10:00:00.000Z',
    });
    expect(resultado.estado).toBe('sincronizado');
    expect(resultado.ingreso).toBe(110000);

    mockGetFiestaById.mockResolvedValue({
      id: 'fiesta-1',
      presupuestoId: 'pres-1',
      updatedAt: '2026-08-15T10:00:00.000Z',
      personalAsignado: [],
      pagosProveedores: [],
      gestionCostos: {
        ingresosTotalesEstimados: 110000,
        costosItems: [{ id: 'c1', nombre: 'Insumos', category: 'Compra General', montoEstimado: 10000 }],
        others: {},
      },
    });
    mockGetPresupuestoById.mockResolvedValue(presupuestoConAjuste);

    await act(async () => {
      root.render(React.createElement(GestionCostosRentabilidadContent));
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const cardIngreso = host.querySelector('[data-testid="card-ingreso-pactado"]')?.textContent ?? '';
    const cardGanancia = host.querySelector('[data-testid="card-ganancia-evento"]')?.textContent ?? '';

    expect(cardIngreso).toContain('110.000');
    expect(cardIngreso).toContain('Sincronizado con presupuesto');
    expect(cardGanancia).toContain('100.000');
    expect(mockUpdateGestionCostosFiestaActual).not.toHaveBeenCalled();
  });

  it('si el presupuesto cambió después toma el nuevo ingreso oficial y marca desactualizado sin escribir en la base', async () => {
    const presupuestoActualizado = hacerPresupuesto({
      totalConDescuento: 185000,
      ajusteAnualActivo: false,
    });

    const resultado = resolverIngresoRentabilidad({
      presupuestoId: 'pres-1',
      presupuesto: presupuestoActualizado,
      ingresosGuardados: 0,
    });
    expect(resultado.estado).toBe('desactualizado');
    expect(resultado.ingreso).toBe(185000);

    const gananciaEsperada = calcularGananciaDeEvento(
      {
        ingresosTotalesEstimados: 185000,
        costosItems: [{ id: 'c1', nombre: 'Salón', category: 'Pago de Salón', montoEstimado: 13100 }],
        others: {},
      },
      [],
      [],
      [],
      [],
    ).gananciaReal;
    expect(gananciaEsperada).toBe(171900);

    mockGetFiestaById.mockResolvedValue({
      id: 'fiesta-1',
      presupuestoId: 'pres-1',
      personalAsignado: [],
      pagosProveedores: [],
      gestionCostos: {
        ingresosTotalesEstimados: 0,
        costosItems: [{ id: 'c1', nombre: 'Salón', category: 'Pago de Salón', montoEstimado: 13100 }],
        others: {},
      },
    });
    mockGetPresupuestoById.mockResolvedValue(presupuestoActualizado);

    await act(async () => {
      root.render(React.createElement(GestionCostosRentabilidadContent));
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const cardIngreso = host.querySelector('[data-testid="card-ingreso-pactado"]')?.textContent ?? '';
    const cardGanancia = host.querySelector('[data-testid="card-ganancia-evento"]')?.textContent ?? '';

    expect(cardIngreso).toContain('185.000');
    expect(cardIngreso).toContain('Desactualizado — tocá Sincronizar todo');
    expect(cardGanancia).toContain('171.900');
    expect(cardGanancia).not.toContain('13.100');
    expect(mockUpdateGestionCostosFiestaActual).not.toHaveBeenCalled();
  });
});
