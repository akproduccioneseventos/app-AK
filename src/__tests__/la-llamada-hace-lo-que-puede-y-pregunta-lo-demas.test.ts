/** @jest-environment node */

let mockSession: any = {
  success: true,
  user: { email: 'admin@akproducciones.uy', role: 'admin' },
};

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => mockSession),
}));

let mockTasks: any[] = [];
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => {
    if (file === 'tasks.json') return mockTasks;
    return fallback;
  }),
  writeData: jest.fn(async (file: string, data: any) => {
    if (file === 'tasks.json') mockTasks = data;
  }),
}));

const mockEjecutarSecretario = jest.fn(async (params: any) => ({
  success: true,
  mensaje: `Ejecutado: ${params.accion}`,
}));
jest.mock('@/app/actions/multiagent', () => ({
  ejecutarAccionSecretario: (...args: any[]) => mockEjecutarSecretario(...args),
}));

jest.mock('@/lib/asistente/que-puede-hacer-solo', () => {
  const actual = jest.requireActual('@/lib/asistente/que-puede-hacer-solo');
  return {
    ...actual,
    registrarAccionAsistente: jest.fn(async () => {}),
  };
});

import { POST } from '@/app/api/asistente/voz-en-vivo/accion/route';

describe('La llamada hace lo que puede y pregunta lo demás', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTasks = [];
    mockSession = {
      success: true,
      user: { email: 'admin@akproducciones.uy', role: 'admin' },
    };
  });

  it('sin sesión devuelve 401', async () => {
    mockSession = { success: false, user: null };

    const req = new Request('http://localhost/api/asistente/voz-en-vivo/accion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'crear_tarea' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('crear_tarea crea la tarea', async () => {
    const req = new Request('http://localhost/api/asistente/voz-en-vivo/accion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 't-1',
        accion: 'crear_tarea',
        argumentos: { titulo: 'Comprar cotillón' },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockTasks.length).toBe(1);
    expect(mockTasks[0].title).toBe('Comprar cotillón');
  });

  it('agendar_reunion sin confirmar no agenda, y confirmada sí', async () => {
    // 1. Sin confirmar
    const reqSinConf = new Request('http://localhost/api/asistente/voz-en-vivo/accion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'reunion-sin-conf',
        accion: 'agendar_reunion',
        argumentos: { fecha: '2026-11-01', contacto: 'María' },
        confirmado: false,
      }),
    });

    const resSinConf = await POST(reqSinConf);
    expect(resSinConf.status).toBe(200);
    const dataSinConf = await resSinConf.json();
    expect(dataSinConf.esperandoConfirmacion).toBe(true);
    expect(mockEjecutarSecretario).not.toHaveBeenCalled();

    // 2. Confirmada
    const reqConf = new Request('http://localhost/api/asistente/voz-en-vivo/accion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'reunion-confirmada',
        accion: 'agendar_reunion',
        argumentos: { fecha: '2026-11-01', contacto: 'María' },
        confirmado: true,
      }),
    });

    const resConf = await POST(reqConf);
    expect(resConf.status).toBe(200);
    const dataConf = await resConf.json();
    expect(dataConf.success).toBe(true);
    expect(mockEjecutarSecretario).toHaveBeenCalledTimes(1);
  });

  it('una acción "nunca" (cobrar) no hace nada', async () => {
    const req = new Request('http://localhost/api/asistente/voz-en-vivo/accion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'cobro-bloqueado',
        accion: 'cobrar',
        argumentos: { monto: 5000 },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/pantalla/i);
    expect(mockEjecutarSecretario).not.toHaveBeenCalled();
  });

  it('cuanto_me_deben con el perfil operador da error de permiso', async () => {
    mockSession.user = { email: 'operador@akproducciones.uy', role: 'operador' };

    const req = new Request('http://localhost/api/asistente/voz-en-vivo/accion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'deuda-operador',
        accion: 'cuanto_me_deben',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/permiso|contabilidad/i);
  });

  it('el mismo id dos veces crea una sola tarea (idempotencia)', async () => {
    const req1 = new Request('http://localhost/api/asistente/voz-en-vivo/accion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'idemp-task-1',
        accion: 'crear_tarea',
        argumentos: { titulo: 'Probar luces' },
      }),
    });

    const res1 = await POST(req1);
    expect(res1.status).toBe(200);
    expect(mockTasks.length).toBe(1);

    // Segunda llamada con el mismo id
    const req2 = new Request('http://localhost/api/asistente/voz-en-vivo/accion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'idemp-task-1',
        accion: 'crear_tarea',
        argumentos: { titulo: 'Probar luces' },
      }),
    });

    const res2 = await POST(req2);
    expect(res2.status).toBe(200);
    // Sigue habiendo solo 1 tarea creada
    expect(mockTasks.length).toBe(1);
  });
});
