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
