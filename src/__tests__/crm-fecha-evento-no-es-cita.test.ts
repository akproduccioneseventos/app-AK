/**
 * Codex, auditoria 78 (orden 128 D): un prospecto que solo eligio la fecha de su fiesta en el
 * simulador aparecia en el CRM con "Cita: 23/1, 00:00hs" y en la agenda comercial, aunque nunca
 * reservo una entrevista. El guardado ponia la fecha de la fiesta en `followUpDate`, que es el
 * campo de las citas. Ahora va en `eventDate`, y una cita real que ya existia se conserva.
 *
 * Usa el guardado real del prospecto (`upsertPublicCommercialLead`) con la lista en memoria.
 */
jest.mock('server-only', () => ({}));

let prospectos: any[] = [];
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, vacio: unknown) =>
    archivo.includes('lead') || archivo.includes('prospect') ? JSON.parse(JSON.stringify(prospectos)) : vacio),
  writeData: jest.fn(async (archivo: string, valor: any) => {
    if (archivo.includes('lead') || archivo.includes('prospect')) prospectos = JSON.parse(JSON.stringify(valor));
  }),
}));

import { upsertPublicCommercialLead } from '@/lib/crm/public-lead-persistence';

const desdeElSimulador = (fecha: string, presupuestoId: string) => ({
  name: 'Prospecto Ficticio',
  phone: '099123456',
  partyType: 'Cumpleaños',
  eventDate: fecha,
  guestCount: 100,
  presupuestoId,
  presupuestoEstado: 'Pendiente Verificación' as const,
  acquisition: { source: 'landing' } as any,
});

describe('la fecha de la fiesta no es una cita', () => {
  const anterior = process.env.AK_USE_LOCAL_JSON_ONLY;
  beforeAll(() => { process.env.AK_USE_LOCAL_JSON_ONLY = 'true'; });
  afterAll(() => {
    if (anterior === undefined) delete process.env.AK_USE_LOCAL_JSON_ONLY;
    else process.env.AK_USE_LOCAL_JSON_ONLY = anterior;
  });
  beforeEach(() => { prospectos = []; });

  it('un presupuesto del simulador sin entrevista no crea una cita', async () => {
    const { lead } = await upsertPublicCommercialLead(desdeElSimulador('2027-01-23', 'pres_1'));
    expect(lead.followUpDate).toBeUndefined();
    expect(lead.eventDate).toBe('2027-01-23');
    expect(prospectos[0].followUpDate).toBeUndefined();
  });

  it('una cita real que ya tenia el prospecto se conserva', async () => {
    const { lead } = await upsertPublicCommercialLead(desdeElSimulador('2027-01-23', 'pres_1'));
    prospectos = prospectos.map((p) => (p.id === lead.id ? { ...p, followUpDate: '2026-10-20T15:00:00.000Z' } : p));

    const { lead: despues } = await upsertPublicCommercialLead(desdeElSimulador('2027-03-10', 'pres_2'));
    expect(despues.id).toBe(lead.id);
    expect(despues.followUpDate).toBe('2026-10-20T15:00:00.000Z');
    // Otra propuesta con otra fecha: la ficha muestra la ultima fecha de fiesta pedida.
    expect(despues.eventDate).toBe('2027-03-10');
  });
});
