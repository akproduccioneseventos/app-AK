/** @jest-environment node */

jest.mock('server-only', () => ({}));

import { marcarLecturaFallida } from '@/lib/marca-de-lectura';

const mockReadData = jest.fn();
const mockWriteData = jest.fn();
const mockMarcarCorrida = jest.fn(async () => undefined);

jest.mock('@/lib/data-service', () => ({
  readData: (...args: any[]) => mockReadData(...args),
  writeData: (...args: any[]) => mockWriteData(...args),
}));

jest.mock('@/lib/automatico/tareas-automaticas', () => ({
  marcarCorrida: (...args: any[]) => (mockMarcarCorrida as any)(...args),
}));

jest.mock('@/lib/automatico/puerta-de-las-tareas', () => ({
  abrirPuertaDeLaTarea: jest.fn(async () => ({ permitido: true, conClave: true })),
  respuestaDeLaTarea: (_puerta: any, cuerpo: any) => cuerpo,
}));

import { correrTareaRecordarInvitacionNoAbierta } from '@/lib/invitaciones/recordatorio-no-abiertas';
import { GET } from '@/app/api/cron/recordar-invitacion-no-abierta/route';

describe('Orden 371 B5.1 — El recordatorio de invitaciones no abiertas no corre a ciegas si falló la lectura', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('si fiestas.json viene con esLecturaFallida, devuelve corrio: false y el cron no marca corrida', async () => {
    mockReadData.mockImplementation(async (file: string, def: any) => {
      if (file === 'ajustes-recordatorio-invitacion.json') return { activo: true };
      if (file === 'fiestas.json') return marcarLecturaFallida([], 'Firestore timeout');
      return def;
    });

    const resultado = await correrTareaRecordarInvitacionNoAbierta(new Date('2026-11-26T15:00:00.000Z'));
    expect(resultado.corrio).toBe(false);
    expect(resultado.lecturaFallida).toBe(true);
    expect(resultado.motivo).toMatch(/no se pudieron leer las fiestas/i);

    const res = await GET(new Request('http://localhost/api/cron/recordar-invitacion-no-abierta'));
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.ok).toBe(false);
    expect(body.corrio).toBe(false);
    expect(mockMarcarCorrida).not.toHaveBeenCalled();
  });
});
