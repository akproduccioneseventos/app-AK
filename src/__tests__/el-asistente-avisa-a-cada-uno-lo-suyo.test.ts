/** @jest-environment node */

import { enviarAvisoProactivoSegunPerfil } from '@/lib/asistente/avisos-proactivos';

const mockSendPushNotificationToAll = jest.fn(async () => ({ success: true }));
jest.mock('@/lib/firebase/server-messaging', () => ({
  sendPushNotificationToAll: (...args: any[]) => mockSendPushNotificationToAll(...args),
}));

let mockAjustes: any = {
  avisosProactivosActivos: true,
};

jest.mock('@/lib/asistente/avisar-al-duenio', () => {
  const actual = jest.requireActual('@/lib/asistente/avisar-al-duenio');
  return {
    ...actual,
    getAsistenteSettings: jest.fn(async () => mockAjustes),
  };
});

let mockStore: Record<string, any> = {};
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (_file: string, fallback: any) => mockStore || fallback),
  writeData: jest.fn(async (_file: string, data: any) => {
    mockStore = data;
  }),
}));

describe('El asistente avisa a cada uno lo suyo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAjustes = { avisosProactivosActivos: true };
    mockStore = {};
  });

  it('el aviso de cobros NO le llega al operador', async () => {
    const res = await enviarAvisoProactivoSegunPerfil({
      destinatario: { role: 'operador' },
      tipo: 'cobros',
      titulo: 'Cobro urgente',
      cuerpo: 'Hay una cuota pendiente',
      fechaActual: new Date('2026-10-20T14:00:00Z'),
    });

    expect(res.enviado).toBe(false);
    expect(res.motivo).toBe('perfil_sin_permiso_de_cobros');
    expect(mockSendPushNotificationToAll).not.toHaveBeenCalled();
  });

  it('el cuarto aviso del día no sale', async () => {
    const hoyStr = new Date('2026-10-20T14:00:00Z').toISOString().split('T')[0];
    mockStore = {
      'dueno-1': { fecha: hoyStr, count: 3 },
    };

    const res = await enviarAvisoProactivoSegunPerfil({
      destinatario: { id: 'dueno-1', role: 'dueno' },
      tipo: 'fiestas',
      titulo: 'Cuarto aviso',
      cuerpo: 'Alerta del día',
      fechaActual: new Date('2026-10-20T14:00:00Z'),
    });

    expect(res.enviado).toBe(false);
    expect(res.motivo).toBe('tope_diario_alcanzado');
    expect(mockSendPushNotificationToAll).not.toHaveBeenCalled();
  });

  it('a las 23:30 de Uruguay no sale nada', async () => {
    // 23:30 en Uruguay (-03:00) es 02:30 UTC del día siguiente
    const nocheUy = new Date('2026-10-20T23:30:00-03:00');

    const res = await enviarAvisoProactivoSegunPerfil({
      destinatario: { id: 'dueno-1', role: 'dueno' },
      tipo: 'fiestas',
      titulo: 'Aviso nocturno',
      cuerpo: 'Alerta de noche',
      fechaActual: nocheUy,
    });

    expect(res.enviado).toBe(false);
    expect(res.motivo).toBe('horario_descanso');
    expect(mockSendPushNotificationToAll).not.toHaveBeenCalled();
  });

  it('con el interruptor apagado tampoco sale nada', async () => {
    mockAjustes.avisosProactivosActivos = false;

    const res = await enviarAvisoProactivoSegunPerfil({
      destinatario: { id: 'dueno-1', role: 'dueno' },
      tipo: 'fiestas',
      titulo: 'Aviso con interruptor apagado',
      cuerpo: 'No debería salir',
      fechaActual: new Date('2026-10-20T14:00:00Z'),
    });

    expect(res.enviado).toBe(false);
    expect(res.motivo).toBe('interruptor_apagado');
    expect(mockSendPushNotificationToAll).not.toHaveBeenCalled();
  });
});
