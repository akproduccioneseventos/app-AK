/** @jest-environment node */

import fs from 'fs';
import path from 'path';

// Almacen en memoria para simular los archivos JSON de data-service
const almacen: Record<string, any> = {};

function copia<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => {
    throw new Error('Sesión no autorizada: usuario sin sesión.');
  }),
  hasAppSession: jest.fn(async () => false),
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => ({
    success: false,
    error: 'Sesión no autorizada.',
  })),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn(async () => undefined),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => {
    const guardado = almacen[archivo];
    return guardado === undefined ? copia(porDefecto) : copia(guardado);
  }),
  writeData: jest.fn(async (archivo: string, datos: any) => {
    almacen[archivo] = copia(datos);
  }),
  mutateDataItem: jest.fn(async (archivo: string, _coleccion: string, id: string, cambiar: (x: any) => any) => {
    const lista = almacen[archivo] || [];
    const indice = lista.findIndex((p: any) => p.id === id);
    if (indice === -1) return null;
    const nuevo = cambiar(copia(lista[indice]));
    if (!nuevo) return null;
    lista[indice] = copia(nuevo);
    almacen[archivo] = lista;
    return nuevo;
  }),
}));

describe('Orden 83 — Lo que atiende al invitado no llama a acciones del equipo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const k in almacen) delete almacen[k];
  });

  describe('Simulador de presupuesto -> agenda de reunión en CRM', () => {
    it('un cliente anónimo en el simulador guarda su cita y registra la reunión en el lead sin requerir sesión', async () => {
      // Configuramos el lead en el CRM
      const leadInicial = {
        id: 'lead_test_orden83',
        name: 'Cliente Simulador',
        phone: '099123456',
        timeline: [],
      };
      almacen['crm-leads.json'] = [leadInicial];
      almacen['crm-appointments.json'] = [];

      // Importar las funciones después de configurar los mocks
      const { getSimulatorAvailableSlots, bookAppointmentFromSimulator } = await import('@/app/actions/simulator-agenda');
      const { scheduleCrmMeeting } = await import('@/app/actions/crm');

      // 1. La acción del equipo scheduleCrmMeeting exige sesión y es rechazada si se llama sin sesión
      const intentoEquipo = await scheduleCrmMeeting('lead_test_orden83', '2026-10-15T15:00:00.000Z', 'Reunión Privada');
      expect(intentoEquipo.success).toBe(false);
      expect(intentoEquipo.error).toBe('Sesión no autorizada.');

      // 2. La acción pública bookAppointmentFromSimulator atiende al cliente anónimo y guarda la cita
      const slotsRes = await getSimulatorAvailableSlots();
      expect(slotsRes.success).toBe(true);
      expect(slotsRes.days.length).toBeGreaterThan(0);
      const diaConSlots = slotsRes.days.find((d) => d.slots.length > 0);
      expect(diaConSlots).toBeDefined();
      const fechaIso = diaConSlots!.slots[0].datetimeIso;

      const resultado = await bookAppointmentFromSimulator({
        clienteNombre: 'Cliente Simulador',
        clienteContacto: '099123456',
        clienteEmail: 'cliente@test.com',
        fechaHora: fechaIso,
        tipoReunion: 'Presencial en Oficina',
        leadId: 'lead_test_orden83',
      });

      expect(resultado.success).toBe(true);
      expect(resultado.appointment).toBeDefined();
      expect(resultado.appointment?.clienteNombre).toBe('Cliente Simulador');

      // 3. Verificar que el lead en crm-leads.json se actualizó con la reunión agendada
      const leadsActualizados = almacen['crm-leads.json'];
      const leadActualizado = leadsActualizados.find((l: any) => l.id === 'lead_test_orden83');
      expect(leadActualizado).toBeDefined();
      expect(leadActualizado.followUpDate).toBe(fechaIso);
      expect(leadActualizado.notes).toContain('REUNIÓN AGENDADA:');
      expect(leadActualizado.timeline).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'meeting_scheduled',
            description: expect.stringContaining('Reunión en Oficina AK'),
          }),
        ])
      );
    });

    it('la acción del equipo scheduleCrmMeeting mantiene su guarda de sesión intacta', async () => {
      const { scheduleCrmMeeting } = await import('@/app/actions/crm');
      const resultado = await scheduleCrmMeeting('cualquier_lead', '2026-10-15T15:00:00.000Z');
      expect(resultado.success).toBe(false);
      expect(resultado.error).toBe('Sesión no autorizada.');
    });

    it('con el código anterior (llamando a scheduleCrmMeeting sin sesión), el lead no se actualizaba', async () => {
      const leadInicial = {
        id: 'lead_anterior',
        name: 'Cliente Anterior',
        phone: '099000111',
        timeline: [],
      };
      almacen['crm-leads.json'] = [leadInicial];

      const { scheduleCrmMeeting } = await import('@/app/actions/crm');
      // Si el código intentaba registrar la reunión mediante scheduleCrmMeeting (código antes de la orden 83):
      let meetingResult: any = null;
      try {
        meetingResult = await scheduleCrmMeeting('lead_anterior', '2026-10-15T15:00:00.000Z', 'Reunión');
      } catch {
        // En simulator-agenda.ts se silenciaba en el catch
      }

      // La llamada falla por falta de sesión
      expect(meetingResult?.success).toBeFalsy();

      // Y el lead NUNCA se modificaba
      const lead = almacen['crm-leads.json'].find((l: any) => l.id === 'lead_anterior');
      expect(lead.followUpDate).toBeUndefined();
      expect(lead.notes).toBeUndefined();
      expect(lead.timeline).toEqual([]);
    });
  });

  describe('Plantillas de Invitación Digital (Allegria y Grazia)', () => {
    it('AllegriaTemplate importa getPublicSocialPosts y no getSocialPosts', () => {
      const filePath = path.join(process.cwd(), 'src/components/invitacion/templates/AllegriaTemplate.tsx');
      const content = fs.readFileSync(filePath, 'utf8');

      expect(content).toContain('getPublicSocialPosts');
      expect(content).not.toContain('getSocialPosts(');
      expect(content).not.toContain('{ getSocialPosts }');
    });

    it('GraziaTemplate importa getPublicSocialPosts y no getSocialPosts', () => {
      const filePath = path.join(process.cwd(), 'src/components/invitacion/templates/GraziaTemplate.tsx');
      const content = fs.readFileSync(filePath, 'utf8');

      expect(content).toContain('getPublicSocialPosts');
      expect(content).not.toContain('getSocialPosts(');
      expect(content).not.toContain('{ getSocialPosts }');
    });
  });
});
