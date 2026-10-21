/** @jest-environment node */

import { NextRequest } from 'next/server';
import { updateFiestaPartial } from '@/app/actions/fiesta/fiesta.actions';
import { POST as postVozAccion } from '@/app/api/asistente/voz-en-vivo/accion/route';

let mockSessionUser: any = null;
let mockTasks: any[] = [];
let mockScheduledMessages: any[] = [];

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => {
    if (!mockSessionUser) return { success: false, user: null };
    return { success: true, user: mockSessionUser };
  }),
}));

jest.mock('@/lib/auth/equipo-de-la-fiesta', () => ({
  usuarioDelEquipo: jest.fn(async () => {
    if (!mockSessionUser) return null;
    const { PERMISOS, puede } = await import('@/lib/auth/perfiles');
    const tieneAlgunPermiso = Object.values(PERMISOS).some((p) => puede(mockSessionUser, p));
    return tieneAlgunPermiso ? mockSessionUser : null;
  }),
  quienEsElEquipo: jest.fn(async () => {
    return () => true;
  }),
}));

jest.mock('@/lib/generic-json-store', () => ({
  mutateGenericJsonArray: jest.fn(async (file: string, mutator: (arr: any[]) => any[]) => {
    if (file === 'tasks.json') {
      mockTasks = mutator(mockTasks);
      return { success: true, count: mockTasks.length };
    }
    if (file === 'scheduled-messages.json') {
      mockScheduledMessages = mutator(mockScheduledMessages);
      return { success: true, count: mockScheduledMessages.length };
    }
    return { success: true };
  }),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => {
    if (file === 'tasks.json') return mockTasks;
    if (file === 'scheduled-messages.json') return mockScheduledMessages;
    return fallback;
  }),
  writeData: jest.fn(async (file: string, data: any) => {
    if (file === 'tasks.json') mockTasks = data;
    if (file === 'scheduled-messages.json') mockScheduledMessages = data;
  }),
  mutateGenericJsonArray: jest.fn(async (file: string, mutator: (arr: any[]) => any[]) => {
    if (file === 'tasks.json') {
      mockTasks = mutator(mockTasks);
      return { success: true, count: mockTasks.length };
    }
    if (file === 'scheduled-messages.json') {
      mockScheduledMessages = mutator(mockScheduledMessages);
      return { success: true, count: mockScheduledMessages.length };
    }
    return { success: true };
  }),
}));

describe('Devolución 1337 - Permisos de voz y costos', () => {
  beforeEach(() => {
    mockSessionUser = null;
    mockTasks = [];
    mockScheduledMessages = [];
  });

  it('updateFiestaPartial con sesión de secretaria (sin ganancias) no cambia los costos aunque le manden internalSync', async () => {
    mockSessionUser = {
      userId: 'sec1',
      email: 'secretaria@akproducciones.uy',
      role: 'secretaria',
      roles: ['secretaria'],
      permissions: ['organizacion'], // no tiene ganancias
    };

    const res = await updateFiestaPartial('f1', { gestionCostos: { costoTotal: 99999 } as any }, { internalSync: true } as any);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/permiso|ganancias/i);
  });

  it('la voz con sesión de personal sin permisos no puede crear tareas', async () => {
    mockSessionUser = {
      userId: 'pers1',
      email: 'mozo@akproducciones.uy',
      role: 'personal',
      roles: ['personal'],
      permissions: [], // sin permisos
    };

    const req = new Request('http://localhost/api/asistente/voz-en-vivo/accion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'crear_tarea', argumentos: { titulo: 'Llevar hielo' } }),
    });

    const res = await postVozAccion(req);
    expect(res.status).toBe(403);
    expect(mockTasks.length).toBe(0);
  });

  it('una acción inexistente devuelve success: false', async () => {
    mockSessionUser = {
      userId: 'adm1',
      email: 'admin@akproducciones.uy',
      role: 'admin',
      roles: ['admin'],
      permissions: ['administracion', 'organizacion'],
    };

    const req = new Request('http://localhost/api/asistente/voz-en-vivo/accion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'accion_inexistente_xyz', argumentos: {} }),
    });

    const res = await postVozAccion(req);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.mensaje).toMatch(/todavía no lo sé hacer|no existe/i);
  });

  it('el borrador de WhatsApp aparece en la bandeja de salida (scheduled-messages.json)', async () => {
    mockSessionUser = {
      userId: 'adm1',
      email: 'admin@akproducciones.uy',
      role: 'admin',
      roles: ['admin'],
      permissions: ['administracion', 'organizacion'],
    };

    const req = new Request('http://localhost/api/asistente/voz-en-vivo/accion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accion: 'preparar_borrador_whatsapp',
        argumentos: { destinatario: 'Juan Perez', mensaje: 'Hola Juan, tu presupuesto está listo' },
      }),
    });

    const res = await postVozAccion(req);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockScheduledMessages.length).toBe(1);
    expect(mockScheduledMessages[0].destinatario).toBe('Juan Perez');
    expect(mockScheduledMessages[0].mensaje).toBe('Hola Juan, tu presupuesto está listo');
  });
});
