/**
 * Orden 153: la pantalla de Google no puede decir "Conectada" por el solo hecho de que
 * exista una cuenta guardada. Se mira el estado real (`status`), tanto en la acción
 * (qué empleados cuentan como conectados) como en la pantalla (etiqueta y botones).
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const mockReadData = jest.fn();
jest.mock('@/lib/data-service', () => ({ readData: (...a: unknown[]) => mockReadData(...a), writeData: jest.fn() }));
jest.mock('@/app/actions/empleados', () => ({
  getEmpleados: jest.fn(async () => [{ id: 'e1' }, { id: 'e2' }, { id: 'e3' }]),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({ getFiestas: jest.fn(async () => []), getHistorialFiestas: jest.fn(async () => []) }));
jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => ({ ok: true })),
  requirePermiso: jest.fn(async () => ({ ok: true })),
}));
jest.mock('@/app/actions/roles', () => ({ getRoles: jest.fn(async () => []) }));
jest.mock('@/lib/auth/session-token', () => ({ verifySession: jest.fn() }));
jest.mock('@/lib/auth/event-access', () => ({ requireEventPermission: jest.fn() }));
jest.mock('@/lib/google-workspace', () => ({
  getMissingGoogleConfig: () => [],
  getGoogleRedirectUri: () => 'https://x/cb',
  hasGoogleContactsScope: () => true,
  hasServiceAccountKey: () => false,
  getServiceAccountAccessToken: jest.fn(),
  getEmployeeEmail: () => 'a@b.c',
  GOOGLE_WORKSPACE_SCOPES: [],
}));

import { getGoogleWorkspaceDashboard } from '@/app/actions/google-workspace';
import type { GoogleWorkspaceAccount, GoogleWorkspaceDashboard } from '@/types/google-workspace';

const base = { connectedAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z', accessToken: 'x' };
const cuenta = (o: Partial<GoogleWorkspaceAccount>): GoogleWorkspaceAccount =>
  ({ id: 'a', kind: 'employee', status: 'connected', email: 'x@x.com', ...base, ...o }) as GoogleWorkspaceAccount;

async function dashboardCon(accounts: GoogleWorkspaceAccount[]) {
  mockReadData.mockImplementation(async (file: string, def: unknown) => (file.includes('accounts') ? accounts : def));
  return getGoogleWorkspaceDashboard();
}

describe('la acción cuenta sólo empleados realmente conectados', () => {
  test('un empleado con error o a reconectar no suma, pero sigue en la lista de atención', async () => {
    const d = await dashboardCon([
      cuenta({ id: 'ok', employeeId: 'e1' }),
      cuenta({ id: 'err', employeeId: 'e2', status: 'error', lastError: 'invalid_grant' }),
      cuenta({ id: 'rec', employeeId: 'e3', status: 'needs_reconnect' }),
    ]);
    expect(d.connectedEmployees.map((a) => a.id)).toEqual(['ok']);
    expect(d.employeesNeedingAttention.map((a) => a.id).sort()).toEqual(['err', 'rec']);
  });
});

describe('la pantalla muestra el estado real', () => {
  const mockDashboard = jest.fn();
  jest.mock('@/app/actions/google-workspace', () => ({
    ...jest.requireActual('@/app/actions/google-workspace'),
    getGoogleWorkspaceDashboard: (...a: unknown[]) => mockDashboard(...a),
    syncAllFiestasToGoogleWorkspace: jest.fn(),
    syncFiestaAndNotifyStaff: jest.fn(),
  }));
  jest.mock('@/app/actions/google-workspace-extended', () => ({ notifyGuestsWithCalendarLinks: jest.fn() }));
  jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));

  const dash = (o: Partial<GoogleWorkspaceDashboard>): GoogleWorkspaceDashboard => ({
    configured: true, missingConfig: [], redirectUri: '', connectedEmployees: [], employeesNeedingAttention: [],
    employeeCount: 4, employeesWithEmail: 4, syncedFiestas: 0, pendingFiestas: 0, contactsEnabled: true, ...o,
  });
  const pub = (o: any) => ({ id: 'c', kind: 'company', email: 'ak@ak.com', ...base, status: 'connected', ...o });

  async function pintar(d: GoogleWorkspaceDashboard) {
    mockDashboard.mockResolvedValue(d);
    const Page = require('@/app/(app)/settings/google-workspace/page').default;
    const host = document.body.appendChild(document.createElement('div'));
    const root = createRoot(host);
    await act(async () => { root.render(<Page />); });
    await act(async () => { await Promise.resolve(); });
    const sync = Array.from(host.querySelectorAll('button')).find((b) => b.textContent?.includes('Sincronizar fiestas')) as HTMLButtonElement;
    return { host, sync, texto: host.textContent || '', limpiar: () => { act(() => root.unmount()); host.remove(); } };
  }

  test('empresa a reconectar: no dice Conectada y Sincronizar queda deshabilitado', async () => {
    const r = await pintar(dash({ companyAccount: pub({ status: 'needs_reconnect' }) }));
    expect(r.texto).toContain('Hay que volver a conectar');
    expect(r.texto).not.toContain('Conectada');
    expect(r.sync.disabled).toBe(true);
    expect(r.host.querySelector('a[href*="oauth/start"]')).not.toBeNull();
    r.limpiar();
  });

  test('empresa con error: dice Con error y muestra el motivo', async () => {
    const r = await pintar(dash({ companyAccount: pub({ status: 'error', lastError: 'invalid_grant' }) }));
    expect(r.texto).toContain('Con error');
    expect(r.texto).toContain('invalid_grant');
    expect(r.texto).not.toContain('Conectada');
    expect(r.sync.disabled).toBe(true);
    r.limpiar();
  });

  test('empresa conectada: como antes', async () => {
    const r = await pintar(dash({ companyAccount: pub({}) }));
    expect(r.texto).toContain('Conectada');
    expect(r.sync.disabled).toBe(false);
    r.limpiar();
  });

  test('sin cuenta: aviso de configuración y sincronizar bloqueado', async () => {
    const r = await pintar(dash({ configured: false, missingConfig: ['GOOGLE_CLIENT_ID'] }));
    expect(r.texto).toContain('Falta configurar Google');
    expect(r.texto).toContain('Pendiente');
    expect(r.sync.disabled).toBe(true);
    r.limpiar();
  });

  test('empleado con error: contador 0/4 y sigue visible con su aviso', async () => {
    const r = await pintar(dash({
      companyAccount: pub({}),
      employeesNeedingAttention: [pub({ id: 'e', kind: 'employee', email: 'emp@x.com', status: 'error', lastError: 'token vencido' })],
    }));
    expect(r.texto).toContain('0/4');
    expect(r.texto).toContain('0% del equipo');
    expect(r.texto).toContain('emp@x.com');
    expect(r.texto).toContain('token vencido');
    r.limpiar();
  });
});
