import type { CrmLead } from '@/types/crm';
import {
  getCrmLeadSourceBadge,
  isDirectCrmLead,
  isSimulatorCrmLead,
} from './lead-presentation';

const lead = (overrides: Partial<CrmLead>): CrmLead => ({
  id: 'lead-1',
  name: 'Cliente',
  createdAt: '2026-07-30T00:00:00.000Z',
  updatedAt: '2026-07-30T00:00:00.000Z',
  ...overrides,
});

describe('CRM lead presentation', () => {
  it('recognizes simulator leads without treating them as direct inquiries', () => {
    const simulatorLead = lead({ budgetSource: 'simulator_common' });

    expect(isSimulatorCrmLead(simulatorLead)).toBe(true);
    expect(isDirectCrmLead(simulatorLead)).toBe(false);
    expect(getCrmLeadSourceBadge(simulatorLead).text).toBe('Simulador');
  });

  it('keeps manual budgets distinct from WhatsApp inquiries', () => {
    expect(getCrmLeadSourceBadge(lead({ budgetSource: 'manual' })).text)
      .toBe('Presupuesto manual');
    expect(getCrmLeadSourceBadge(lead({
      acquisition: { source: 'whatsapp' },
    })).text).toBe('Consulta WhatsApp');
  });

  it('does not fabricate WhatsApp as the source of landing or guest leads', () => {
    const landingLead = lead({ acquisition: { source: 'landing' } });
    const guestLead = lead({ acquisition: { source: 'guest_portal' } });

    expect(getCrmLeadSourceBadge(landingLead).text).toBe('Consulta');
    expect(getCrmLeadSourceBadge(guestLead).text).toBe('Consulta');
    expect(isDirectCrmLead(landingLead)).toBe(false);
    expect(isDirectCrmLead(guestLead)).toBe(false);
  });

  it('includes WhatsApp, explicit direct and unclassified manual leads in direct inquiries', () => {
    expect(isDirectCrmLead(lead({ acquisition: { source: 'whatsapp' } }))).toBe(true);
    expect(isDirectCrmLead(lead({ acquisition: { source: 'direct' } }))).toBe(true);
    expect(isDirectCrmLead(lead({}))).toBe(true);
  });
});
