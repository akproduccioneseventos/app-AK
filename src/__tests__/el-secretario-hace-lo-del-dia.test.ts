import { ejecutarAccionSecretario } from '@/app/actions/multiagent';
import { upsertGoogleCalendarEvent } from '@/lib/google-workspace';
import { saveScheduledMessage } from '@/app/actions/scheduled-messages';
import { readData, writeData } from '@/lib/data-service';

jest.mock('@/lib/google-workspace', () => ({
  upsertGoogleCalendarEvent: jest.fn().mockResolvedValue({ id: 'event_cal_123' }),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue(undefined),
  hasAppSession: jest.fn().mockResolvedValue(true),
  requirePermiso: jest.fn().mockResolvedValue({ ok: true, user: {} }),
}));

jest.mock('@/app/actions/scheduled-messages', () => ({
  saveScheduledMessage: jest.fn().mockResolvedValue({
    success: true,
    message: { id: 'msg_sched_1', sendingMode: 'manual_click' },
  }),
}));

const mockStore: Record<string, any> = {
  'presupuestos.json': [
    // Con la forma real de un presupuesto (revisión de plata, 6/10/2026). Antes la prueba usaba
    // campos que no existen (totalFinal, totalCobrado) y daba verde con la cuenta rota.
    { id: 'p1', clienteNombre: 'Martín Pérez', estado: 'Aceptado', totalConDescuento: 100000, timestamp: '2026-01-01', fechaFirmaContrato: '2026-01-01', eventoFecha: '2026-12-01', eventoTipo: 'Boda', pagosCliente: [{ id: 'a', monto: 40000, fecha: '2026-02-01', estadoPago: 'confirmado' }] },
    { id: 'p2', clienteNombre: 'Sofía Rodríguez', estado: 'Aceptado', totalConDescuento: 50000, timestamp: '2026-01-01', fechaFirmaContrato: '2026-01-01', eventoFecha: '2026-12-01', eventoTipo: 'Cumpleaños', pagosCliente: [{ id: 'b', monto: 50000, fecha: '2026-02-01', estadoPago: 'confirmado' }] },
    { id: 'p3', clienteNombre: 'Sólo consultó', estado: 'Enviado', totalConDescuento: 80000, timestamp: '2026-01-01', eventoFecha: '2026-12-01', pagosCliente: [] },
  ],
  'fiestas.json': [
    {
      id: 'f1',
      estado: 'confirmada',
      configuracion: {
        nombreEvento: '15 de Camila',
        fechaEvento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      tareas: [{ id: 't1', texto: 'Comprobar micrófonos', completada: false }],
    },
  ],
  'asistente-web-busquedas.json': { fecha: new Date().toISOString().slice(0, 10), count: 0 },
};

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => {
    return mockStore[file] !== undefined ? JSON.parse(JSON.stringify(mockStore[file])) : fallback;
  }),
  writeData: jest.fn(async (file: string, data: any) => {
    mockStore[file] = JSON.parse(JSON.stringify(data));
  }),
}));

describe('Orden 101 - Bloque 4: El secretario hace lo del día a día', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('agendar_reunion', () => {
    it('sin confirmación no escribe en Google Calendar y pide confirmación', async () => {
      const res = await ejecutarAccionSecretario({
        accion: 'agendar_reunion',
        datos: { titulo: 'Reunión con Yessica', startIso: '2026-10-05T19:00:00Z' },
        confirmado: false,
      });

      expect(res.success).toBe(true);
      expect(res.esperandoConfirmacion).toBe(true);
      expect(res.mensaje).toContain('¿Confirmo?');
      expect(upsertGoogleCalendarEvent).not.toHaveBeenCalled();
    });

    it('con confirmación ("sí") agenda en Google Calendar', async () => {
      const res = await ejecutarAccionSecretario({
        accion: 'agendar_reunion',
        datos: { titulo: 'Reunión con Yessica', startIso: '2026-10-05T19:00:00Z' },
        confirmado: true,
      });

      expect(res.success).toBe(true);
      expect(upsertGoogleCalendarEvent).toHaveBeenCalledTimes(1);
      expect(res.mensaje).toContain('¡Reunión agendada en Google Calendar!');
    });
  });

  describe('preparar_mail', () => {
    it('sin confirmación no guarda mensaje en cola y pide confirmación', async () => {
      const res = await ejecutarAccionSecretario({
        accion: 'preparar_mail',
        datos: { targetEmail: 'cliente@test.com', subject: 'Detalle de servicios', body: 'Adjunto...' },
        confirmado: false,
      });

      expect(res.success).toBe(true);
      expect(res.esperandoConfirmacion).toBe(true);
      expect(res.mensaje).toContain('¿Confirmo?');
      expect(saveScheduledMessage).not.toHaveBeenCalled();
    });

    it('con confirmación guarda en bandeja con sendingMode: "manual_click"', async () => {
      const res = await ejecutarAccionSecretario({
        accion: 'preparar_mail',
        datos: { targetEmail: 'cliente@test.com', targetPhone: '098355530', subject: 'Detalle de servicios', body: 'Adjunto...' },
        confirmado: true,
      });

      expect(res.success).toBe(true);
      expect(saveScheduledMessage).toHaveBeenCalledTimes(1);
      const callArg = (saveScheduledMessage as jest.Mock).mock.calls[0][0];
      expect(callArg.sendingMode).toBe('manual_click');
    });
  });

  describe('cuanto_me_deben', () => {
    it('calcula la deuda de presupuestos y NUNCA escribe en la base de datos', async () => {
      const res = await ejecutarAccionSecretario({
        accion: 'cuanto_me_deben',
      });

      expect(res.success).toBe(true);
      expect(writeData).not.toHaveBeenCalled();
      expect(res.resultado.totalDeuda).toBe(60000);
      expect(res.resultado.deudores.length).toBe(1);
      expect(res.resultado.deudores[0].cliente).toBe('Martín Pérez');
      expect(res.mensaje).toContain('Martín Pérez');
      expect(res.mensaje).toContain('$60.000');
    });
  });

  describe('ver_mi_semana', () => {
    it('resume eventos y tareas de los próximos 7 días sin escribir', async () => {
      const res = await ejecutarAccionSecretario({
        accion: 'ver_mi_semana',
      });

      expect(res.success).toBe(true);
      expect(writeData).not.toHaveBeenCalled();
      expect(res.resultado.fiestas.length).toBe(1);
      expect(res.mensaje).toContain('15 de Camila');
      expect(res.mensaje).toContain('Comprobar micrófonos');
    });
  });
});
