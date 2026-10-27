/**
 * @jest-environment node
 */
import { POST } from '@/app/api/asistente/voz-en-vivo/accion/route';
import { PERMISOS } from '@/lib/auth/perfiles';

let usuarioActual: any = {
  email: 'dueno@ak.com',
  userId: 'user-dueno',
  role: 'dueno',
  permissions: Object.values(PERMISOS),
};

const storeGlobal = new Map<string, any[]>();

jest.mock('@/lib/auth/equipo-de-la-fiesta', () => ({
  usuarioDelEquipo: jest.fn(async () => usuarioActual),
}));

jest.mock('@/lib/generic-json-store', () => ({
  mutateGenericJsonArray: jest.fn(async (file: string, mutator: (arr: any[]) => any[]) => {
    const actual = JSON.parse(JSON.stringify(storeGlobal.get(file) || []));
    const res = mutator(actual);
    if (res !== null && res !== undefined) {
      storeGlobal.set(file, JSON.parse(JSON.stringify(res)));
    }
    return res;
  }),
}));

let reunionesAgendadas: any[] = [];
jest.mock('@/app/actions/multiagent', () => ({
  ejecutarAccionSecretario: jest.fn(async (opts: any) => {
    if (opts.accion === 'agendar_reunion') {
      reunionesAgendadas.push(opts.datos);
      return { success: true, mensaje: 'Reunión agendada' };
    }
    if (opts.accion === 'cuanto_me_deben') {
      return { success: true, mensaje: 'Deben $50.000' };
    }
    return { success: true };
  }),
}));

describe('La llamada hace lo que puede y pregunta lo demás', () => {
  beforeEach(() => {
    storeGlobal.clear();
    reunionesAgendadas = [];
    usuarioActual = {
      email: 'dueno@ak.com',
      userId: 'user-dueno',
      role: 'dueno',
      permissions: Object.values(PERMISOS),
    };
  });

  test('sin sesión, 401', async () => {
    usuarioActual = null;
    const req = new Request('http://localhost/api/asistente/voz-en-vivo/accion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'crear_tarea', argumentos: { titulo: 'Probar' } }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  test('crear_tarea crea la tarea', async () => {
    const req = new Request('http://localhost/api/asistente/voz-en-vivo/accion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accion: 'crear_tarea',
        argumentos: { titulo: 'Comprar cotillón', paraQuien: 'Decoración' },
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    const tareas = storeGlobal.get('tasks.json') || [];
    expect(tareas.some((t: any) => t.title === 'Comprar cotillón')).toBe(true);
  });

  test('agendar_reunion sin confirmar no agenda, y confirmada sí', async () => {
    // 1. Sin confirmar
    const req1 = new Request('http://localhost/api/asistente/voz-en-vivo/accion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accion: 'agendar_reunion',
        argumentos: { cliente: 'Sofía', fecha: '2026-11-20' },
        confirmado: false,
      }),
    });
    const res1 = await POST(req1);
    expect(res1.status).toBe(200);
    const data1 = await res1.json();
    expect(data1.esperandoConfirmacion).toBe(true);
    expect(reunionesAgendadas).toHaveLength(0);

    // 2. Confirmada
    const req2 = new Request('http://localhost/api/asistente/voz-en-vivo/accion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accion: 'agendar_reunion',
        argumentos: { cliente: 'Sofía', fecha: '2026-11-20' },
        confirmado: true,
      }),
    });
    const res2 = await POST(req2);
    expect(res2.status).toBe(200);
    const data2 = await res2.json();
    expect(data2.success).toBe(true);
    expect(reunionesAgendadas).toHaveLength(1);
    expect(reunionesAgendadas[0].cliente).toBe('Sofía');
  });

  test('una acción nunca (cobrar) no hace nada', async () => {
    const req = new Request('http://localhost/api/asistente/voz-en-vivo/accion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'cobrar', argumentos: { monto: 5000 } }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/pantalla/i);
  });

  test('cuanto_me_deben con el perfil operador da error de permiso', async () => {
    usuarioActual = {
      email: 'operador@ak.com',
      userId: 'user-op',
      role: 'operador',
      permissions: [PERMISOS.NOCHE, PERMISOS.ORGANIZACION],
    };
    const req = new Request('http://localhost/api/asistente/voz-en-vivo/accion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'cuanto_me_deben' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/CONTABILIDAD/i);
  });

  test('el mismo id dos veces crea una tarea', async () => {
    const callId = 'call_unique_123';
    const body = {
      id: callId,
      accion: 'crear_tarea',
      argumentos: { titulo: 'Revisar luces' },
    };

    const req1 = new Request('http://localhost/api/asistente/voz-en-vivo/accion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const res1 = await POST(req1);
    expect(res1.status).toBe(200);

    const req2 = new Request('http://localhost/api/asistente/voz-en-vivo/accion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const res2 = await POST(req2);
    expect(res2.status).toBe(200);

    const tareas = (storeGlobal.get('tasks.json') || []).filter((t: any) => t.title === 'Revisar luces');
    expect(tareas).toHaveLength(1);
  });
});
