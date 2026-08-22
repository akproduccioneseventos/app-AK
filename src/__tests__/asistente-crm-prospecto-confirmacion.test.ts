let mockLeads: any[] = [];
const mockAddCrmLead = jest.fn();

jest.mock('@/app/actions/crm', () => ({
  getCrmLeads: jest.fn(async () => mockLeads),
  addCrmLead: jest.fn(async (data: any) => mockAddCrmLead(data)),
}));

jest.mock('@/app/actions/servicios-empresa', () => ({
  getServiciosEmpresaPublicos: jest.fn(async () => []),
}));

jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestos: jest.fn(async () => []),
  savePresupuesto: jest.fn(async () => ({ id: 'mock-id' })),
}));

import {
  prepareAssistantLeadProposal,
  confirmAndSaveAssistantLead,
} from '@/lib/multiagent/assistant-crm-actions';

describe('Asistente AK — Extracción y Confirmación de Prospectos', () => {
  beforeEach(() => {
    mockLeads = [];
    mockAddCrmLead.mockReset();
  });

  it('extrae y normaliza los datos del prospecto sin guardar a ciegas', async () => {
    const proposal = await prepareAssistantLeadProposal({
      name: 'Ana García',
      phone: '099123456',
      partyType: 'XV años',
      eventDate: '2027-03-14',
      guestCount: 120,
      acquisitionSource: 'Instagram',
      notes: 'Consultó por fecha de marzo',
    });

    // Verificamos que se estructuró correctamente
    expect(proposal.data.name).toBe('Ana García');
    expect(proposal.data.partyType).toBe('XV años');
    expect(proposal.data.guestCount).toBe(120);
    expect(proposal.data.followUpDate).toBe('2027-03-14');
    expect(proposal.duplicates).toEqual([]);
    expect(proposal.summary).toContain('Ana García');

    // NUNCA debe haber guardado en base de datos sin confirmación
    expect(mockAddCrmLead).not.toHaveBeenCalled();
  });

  it('detecta prospectos duplicados por teléfono coincidente', async () => {
    mockLeads = [
      {
        id: 'lead-existente-1',
        name: 'Ana G.',
        phone: '099 123 456',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];

    const proposal = await prepareAssistantLeadProposal({
      name: 'Ana García',
      phone: '099123456',
      partyType: 'XV años',
    });

    expect(proposal.duplicates.length).toBeGreaterThanOrEqual(1);
    expect(proposal.duplicates[0].matchReason).toContain('Teléfono');
  });

  it('guarda el prospecto únicamente cuando se ejecuta la confirmación explícita', async () => {
    const mockLead = {
      id: 'lead-creado-123',
      name: 'Carlos Mendez',
      createdAt: '2026-08-22',
      updatedAt: '2026-08-22',
    };
    mockAddCrmLead.mockResolvedValue({ success: true, lead: mockLead });

    const result = await confirmAndSaveAssistantLead({
      name: 'Carlos Mendez',
      phone: '098765432',
      partyType: 'Boda',
    });

    expect(result.success).toBe(true);
    expect(result.lead?.id).toBe('lead-creado-123');
    expect(mockAddCrmLead).toHaveBeenCalled();
  });
});
