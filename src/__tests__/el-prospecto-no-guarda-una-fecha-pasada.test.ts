/** @jest-environment node */
jest.mock('server-only', () => ({}));

const mockUpsertLead = jest.fn(async (input: any) => ({
  lead: {
    id: 'lead_test_1',
    name: input.name,
    phone: input.phone,
    eventDate: input.eventDate,
  },
}));

jest.mock('@/lib/crm/public-lead-persistence', () => ({
  upsertPublicCommercialLead: (...args: any[]) => mockUpsertLead(...(args as [any])),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn(async () => undefined),
}));

import { captureSimulatorLeadProgress } from '@/app/actions/armado-rapido';
import { hoyEnUruguay, parseUruguayDate } from '@/lib/utils';

describe('Orden 295: el prospecto no guarda una fecha pasada', () => {
  beforeEach(() => {
    mockUpsertLead.mockClear();
  });

  it('con fecha de ayer guarda el teléfono y omite la fecha vencida', async () => {
    const ayer = parseUruguayDate(hoyEnUruguay());
    ayer.setDate(ayer.getDate() - 1);
    const fechaAyer = ayer.toISOString().slice(0, 10);

    const res = await captureSimulatorLeadProgress({
      clienteNombre: 'Lucía Pérez',
      clienteContacto: '099123456',
      eventoTipo: 'Cumpleaños',
      eventoFecha: fechaAyer,
      invitados: 60,
    });

    expect(res.success).toBe(true);
    expect(mockUpsertLead).toHaveBeenCalledTimes(1);
    const enviado = mockUpsertLead.mock.calls[0][0];
    expect(enviado.phone).toBe('099123456');
    expect(enviado.eventDate).toBeUndefined();
  });

  it('con fecha futura sí conserva la fecha del evento', async () => {
    const futuro = parseUruguayDate(hoyEnUruguay());
    futuro.setDate(futuro.getDate() + 30);
    const fechaFutura = futuro.toISOString().slice(0, 10);

    const res = await captureSimulatorLeadProgress({
      clienteNombre: 'Lucía Pérez',
      clienteContacto: '099123456',
      eventoTipo: 'Boda',
      eventoFecha: fechaFutura,
      invitados: 100,
    });

    expect(res.success).toBe(true);
    expect(mockUpsertLead).toHaveBeenCalledTimes(1);
    expect(mockUpsertLead.mock.calls[0][0].eventDate).toBe(fechaFutura);
  });
});
