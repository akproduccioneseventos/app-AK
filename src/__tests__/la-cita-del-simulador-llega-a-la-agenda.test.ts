/**
 * Codex, auditoria 80: la reunion agendada desde el simulador no llegaba a la agenda del CRM,
 * porque el navegador nunca mandaba el prospecto. Ahora el prospecto sale del presupuesto
 * guardado en el servidor, y un leadId que mande el navegador se ignora.
 */
jest.mock('@/lib/commercial/public-rate-limit', () => ({ enforcePublicRateLimit: jest.fn(async () => undefined) }));

const archivos: Record<string, any> = {};
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (f: string, def: any) => (f in archivos ? JSON.parse(JSON.stringify(archivos[f])) : def)),
  writeData: jest.fn(async (f: string, d: any) => { archivos[f] = JSON.parse(JSON.stringify(d)); }),
  mutateDataItem: jest.fn(),
}));

import { bookAppointmentFromSimulator, getSimulatorAvailableSlots } from '@/app/actions/simulator-agenda';

describe('la cita del simulador llega a la agenda del CRM', () => {
  beforeEach(() => {
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
    for (const k of Object.keys(archivos)) delete archivos[k];

    archivos['crm-leads.json'] = [
      { id: 'lead_x', name: 'Ana', presupuestoId: 'pres_x', timeline: [] },
      { id: 'lead_OTRO', name: 'Otro', timeline: [] },
    ];
  });

  const datos = async (extra: Record<string, unknown>) => {
    const { days } = await getSimulatorAvailableSlots();
    const slot = days.flatMap((d) => d.slots)[0];
    expect(slot).toBeTruthy();
    return { clienteNombre: 'Ana Perez', clienteContacto: '099123456', fechaHora: slot.datetimeIso, ...extra };
  };

  it('usa el prospecto del presupuesto y no el que manda el navegador', async () => {
    const r = await bookAppointmentFromSimulator((await datos({ presupuestoId: 'pres_x', leadId: 'lead_OTRO' })) as any);
    expect(r.success).toBe(true);
    const leads = archivos['crm-leads.json'];
    expect(leads.find((l: any) => l.id === 'lead_x').followUpDate).toBe(new Date(r.appointment!.fechaHora).toISOString());
    expect(leads.find((l: any) => l.id === 'lead_OTRO').followUpDate).toBeUndefined();
    expect(archivos['crm-appointments.json'][0].leadId).toBe('lead_x');
  });

  it('sin prospecto en el presupuesto, la cita se guarda igual y no toca a nadie', async () => {
    const r = await bookAppointmentFromSimulator((await datos({ presupuestoId: 'pres_sin', leadId: 'lead_OTRO' })) as any);
    expect(r.success).toBe(true);
    expect(archivos['crm-appointments.json'][0].leadId).toBeUndefined();
    expect(archivos['crm-leads.json'].every((l: any) => l.followUpDate === undefined)).toBe(true);
  });
});
