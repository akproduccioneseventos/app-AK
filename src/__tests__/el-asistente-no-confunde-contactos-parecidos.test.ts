/** @jest-environment node */

/**
 * Pregunta 87 (21/10/2026, barrido tras Codex 178). Al agendar una cita, el asistente buscaba el
 * contacto por nombre parcial y en las dos direcciones: "Ana" le agendaba la reunión a "Mariana Pérez".
 */
const leads = [
  { id: 'l1', name: 'Mariana Pérez' },
  { id: 'l2', name: 'Ana Gómez' },
  { id: 'l3', name: 'Ana Rodríguez' },
];
const scheduleCrmMeeting = jest.fn(async () => ({ success: true }));
const addCrmLead = jest.fn(async () => ({ success: true, lead: { id: 'nuevo', name: 'x' } }));
jest.mock('@/app/actions/crm', () => ({
  getCrmLeads: jest.fn(async () => leads),
  scheduleCrmMeeting: (...a: unknown[]) => (scheduleCrmMeeting as jest.Mock)(...a),
  addCrmLead: (...a: unknown[]) => (addCrmLead as jest.Mock)(...a),
}));
jest.mock('@/lib/notifications/create-notification', () => ({ createNotification: jest.fn(async () => undefined) }));

import { executeAgendarCita } from '@/lib/assistant/tools/executors';

describe('el asistente no confunde contactos parecidos', () => {
  beforeEach(() => { scheduleCrmMeeting.mockClear(); addCrmLead.mockClear(); });

  it('"Ana" con dos Anas pregunta cuál y no agenda nada', async () => {
    const r = await executeAgendarCita({ name: 'Ana' } as never);
    expect(r.success).toBe(false);
    expect(scheduleCrmMeeting).not.toHaveBeenCalled();
  });

  it('el nombre completo agenda con esa persona, no con otra que lo contiene', async () => {
    await executeAgendarCita({ name: 'Ana Gómez' } as never);
    expect(scheduleCrmMeeting).toHaveBeenCalledWith('l2', expect.anything(), expect.any(String));
  });

  it('"Mariana Pérez López" no se confunde con "Mariana Pérez": es otra persona y se crea', async () => {
    await executeAgendarCita({ name: 'Mariana Pérez López' } as never);
    expect(scheduleCrmMeeting).not.toHaveBeenCalledWith('l1', expect.anything(), expect.anything());
  });
});
