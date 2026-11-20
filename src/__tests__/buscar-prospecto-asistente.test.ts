import { getTool } from '@/lib/assistant/tool-registry';

const mockLeads = [
  ...Array.from({ length: 120 }, (_, i) => ({
    id: `lead_${i}`,
    name: `Prospecto Relleno ${i}`,
    phone: `099000${String(i).padStart(3, '0')}`,
    stageId: 'nuevo',
    partyType: 'Cumpleaños',
    eventDate: '2026-12-01',
  })),
  {
    id: 'lead_150_real',
    name: 'Valentina Echeverría',
    phone: '098 765 432',
    stageId: 'cotizado',
    partyType: '15 Años',
    eventDate: '2027-03-15',
  },
];

jest.mock('@/app/actions/crm', () => ({
  getCrmLeadsForDashboard: jest.fn(async () => mockLeads),
}));

describe('Herramienta buscarProspecto del asistente', () => {
  it('está registrada en TOOL_REGISTRY y encuentra un prospecto más allá del puesto 100 por nombre y por teléfono', async () => {
    const tool = getTool('buscarProspecto');
    expect(tool).toBeDefined();

    const porNombre = await tool!.execute({ consulta: 'echeverria' });
    expect(porNombre.success).toBe(true);
    if (porNombre.success) {
      const prospectos = (porNombre.data?.prospectos as any[]) || [];
      expect(prospectos).toHaveLength(1);
      expect(prospectos[0].id).toBe('lead_150_real');
    }

    const porTelefono = await tool!.execute({ consulta: '098765432' });
    expect(porTelefono.success).toBe(true);
    if (porTelefono.success) {
      const prospectos = (porTelefono.data?.prospectos as any[]) || [];
      expect(prospectos).toHaveLength(1);
      expect(prospectos[0].name).toBe('Valentina Echeverría');
    }

    const muchos = await tool!.execute({ consulta: 'Prospecto Relleno' });
    expect(muchos.success).toBe(true);
    if (muchos.success) {
      const prospectos = (muchos.data?.prospectos as any[]) || [];
      expect(prospectos).toHaveLength(10);
    }
  });
});
