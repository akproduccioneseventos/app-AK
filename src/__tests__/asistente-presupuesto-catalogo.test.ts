let mockServicios: any[] = [];

jest.mock('@/app/actions/servicios-empresa', () => ({
  getServiciosEmpresaPublicos: jest.fn(async () => mockServicios),
}));

jest.mock('@/app/actions/crm', () => ({
  getCrmLeads: jest.fn(async () => []),
  addCrmLead: jest.fn(),
}));

jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestos: jest.fn(async () => []),
  savePresupuesto: jest.fn(async () => ({ id: 'mock-pres-123' })),
}));

import { prepareAssistantBudgetProposal } from '@/lib/multiagent/assistant-crm-actions';
import { calculateBudgetFinancials } from '@/lib/budget/financial-guardrails';
import type { Presupuesto } from '@/types/presupuesto';

describe('Asistente AK — Presupuestos con Precios Estrictos del Catálogo', () => {
  beforeEach(() => {
    mockServicios = [];
  });

  it('calcula precios estrictamente desde los servicios del catálogo oficial', async () => {
    mockServicios = [
      {
        id: 'srv-pista-led',
        nombre: 'Pista LED Interactiva',
        tipoItem: 'Servicio',
        categoria: 'Tecnología',
        precioVenta: 18000,
        valorUnitarioEstimado: 0,
      },
      {
        id: 'srv-fotocabina',
        nombre: 'Fotocabina Espejo Mágico',
        tipoItem: 'Servicio',
        categoria: 'Fotografía',
        precioVenta: 15000,
        valorUnitarioEstimado: 0,
      },
    ];

    const proposal = await prepareAssistantBudgetProposal({
      clientName: 'Martín y Lucía',
      partyType: 'Boda',
      guestCount: 150,
      venueName: 'Club Uruguay',
      requestedServices: ['Pista LED', 'Fotocabina'],
    });

    expect(proposal.presupuesto.clienteNombre).toBe('Martín y Lucía');
    expect(proposal.presupuesto.eventoTipo).toBe('Boda');
    expect(proposal.presupuesto.estado).toBe('Borrador');
    expect(proposal.desglose).toHaveLength(2);
    expect(proposal.desglose[0].precioUnitario).toBe(18000);
    expect(proposal.desglose[1].precioUnitario).toBe(15000);
    expect(proposal.totalCalculado).toBe(33000);
    expect(proposal.serviciosNoEncontrados).toEqual([]);
  });

  it('reporta servicios solicitados que no existen en el catálogo y no inventa precios', async () => {
    mockServicios = [
      {
        id: 'srv-dj',
        nombre: 'DJ y Sonido Profesional',
        tipoItem: 'Servicio',
        categoria: 'Música',
        precioVenta: 20000,
        valorUnitarioEstimado: 0,
      },
    ];

    const proposal = await prepareAssistantBudgetProposal({
      clientName: 'Gonzalo',
      partyType: 'Cumpleaños',
      requestedServices: ['DJ y Sonido', 'Show de Drones Espaciales'],
    });

    expect(proposal.desglose).toHaveLength(1);
    expect(proposal.desglose[0].servicio).toBe('DJ y Sonido Profesional');
    expect(proposal.serviciosNoEncontrados).toContain('Show de Drones Espaciales');
    expect(proposal.totalCalculado).toBe(20000);
  });
});

describe('AI usa el calculo canonico y conserva sus datos al guardar', () => {
  const input = { clientName: 'QA123', partyType: 'Boda', guestCount: 150 };
  beforeEach(() => { mockServicios = []; });
  it.each([
    [{ calculationMethod: 'porPersona', precioBase: 500 }, 75000, 150],
    [{ calculationMethod: 'ratio', precioBase: 500, invitadosPorUnidad: 25 }, 3000, 6],
    [{ calculationMethod: 'tramos', precioBase: 9000, tramosDePrecio: [{ id: 'a', desde: 1, hasta: 100, precio: 8000 }, { id: 'b', desde: 101, hasta: 200, precio: 12000 }] }, 12000, 1],
    [{ calculationMethod: 'fijo', precioBase: 1000, cantidad: 3 }, 3000, 3],
    [{ calculationMethod: 'porPersona', precioPorPersona: 0, precioBase: 500 }, 75000, 150],
    [{ calculationMethod: 'fijo', precioVenta: 0, precioBase: 500 }, 500, 1],
    [{ precioPorPersona: 0, precioBase: 500 }, 500, 1],
    [{ calculationMethod: 'fijo', precioVenta: 0 }, 0, 1],
  ])('metodo %j: propuesta y recalculo coinciden', async (fields, total, qty) => {
    mockServicios = [{ id: 'qa123', nombre: 'Servicio QA123', ...fields }];
    const proposal = await prepareAssistantBudgetProposal({ ...input, requestedServices: ['Servicio QA123'] });
    expect(proposal.totalCalculado).toBe(total);
    expect(proposal.desglose[0].cantidad).toBe(qty);
    expect(calculateBudgetFinancials(proposal.presupuesto as Presupuesto).total).toBe(total);
  });
  it('no cobra otra vez la misma entrada de catalogo aunque el modelo la repita', async () => {
    mockServicios = [{ id: 'dj', nombre: 'DJ QA123', calculationMethod: 'fijo', precioBase: 1000 }];
    const p = await prepareAssistantBudgetProposal({ ...input, requestedServices: ['DJ QA123', 'DJ QA123'] });
    expect(p.totalCalculado).toBe(1000); expect(p.desglose).toHaveLength(1);
  });
  it('no elige el primer menu de una categoria ambigua', async () => {
    mockServicios = [{ id: 'a', nombre: 'Menu A', categoria: 'Catering', precioBase: 1000 }, { id: 'b', nombre: 'Menu B', categoria: 'Catering', precioBase: 2000 }];
    const p = await prepareAssistantBudgetProposal({ ...input, requestedServices: ['Catering'] });
    expect(p.desglose).toEqual([]); expect(p.serviciosNoEncontrados[0]).toMatch(/varias opciones/);
  });
  it.each([
    { calculationMethod: 'ratio', precioBase: 500, invitadosPorUnidad: 0 },
    { calculationMethod: 'tramos', tramosDePrecio: [{ id: 'a', desde: 1, hasta: 100, precio: 8000 }] },
    { calculationMethod: 'porPersona' },
  ])('catalogo incompleto pide corregirlo en vez de inventar importe %j', async fields => {
    mockServicios = [{ id: 'a', nombre: 'Servicio QA123', ...fields }];
    await expect(prepareAssistantBudgetProposal({ ...input, requestedServices: ['Servicio QA123'] })).rejects.toThrow();
  });
  it('requiere cantidad de personas para precios variables', async () => {
    mockServicios = [{ id: 'a', nombre: 'Servicio QA123', calculationMethod: 'porPersona', precioBase: 500 }];
    await expect(prepareAssistantBudgetProposal({ clientName: 'QA', partyType: 'Boda', requestedServices: ['Servicio QA123'] })).rejects.toThrow(/invitados/);
  });
  it('menu infantil usa ninos y adolescentes; no todos los invitados', async () => {
    mockServicios = [{ id: 'a', nombre: 'Menu infantil', calculationMethod: 'porPersona', precioBase: 500 }];
    const p = await prepareAssistantBudgetProposal({ ...input, adultCount: 100, adolescentCount: 20, childCount: 30, requestedServices: ['Menu infantil'] });
    expect(p.totalCalculado).toBe(25000);
    expect(calculateBudgetFinancials(p.presupuesto as Presupuesto).total).toBe(25000);
    await expect(prepareAssistantBudgetProposal({ ...input, requestedServices: ['Menu infantil'] })).rejects.toThrow(/adultos/);
  });
  it('descuentos y regalos del guardado conservan el motor financiero', async () => {
    mockServicios = [{ id: 'a', nombre: 'DJ QA123', calculationMethod: 'fijo', precioBase: 1000 }];
    const p = await prepareAssistantBudgetProposal({ ...input, requestedServices: ['DJ QA123'] });
    const budget = { ...p.presupuesto, descuentoTipo: 'porcentaje', descuentoValor: 15 } as Presupuesto;
    expect(calculateBudgetFinancials(budget).total).toBe(850);
    budget.itemsPresupuestados[0].esRegalo = true;
    expect(calculateBudgetFinancials(budget).total).toBe(0);
  });
});
