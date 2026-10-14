/**
 * /settings/google-workspace muestra el estado REAL de la cuenta de la empresa y del personal:
 * una cuenta guardada como "needs_reconnect" o "error" no se anuncia "Conectada", no habilita
 * Sincronizar fiestas, y las cuentas con problema siguen visibles (con su aviso) para reconectarlas.
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const getGoogleWorkspaceDashboard = jest.fn();

jest.mock('next/link', () => ({ __esModule: true, default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
jest.mock('@/app/actions/google-workspace', () => ({
  getGoogleWorkspaceDashboard: (...a: unknown[]) => getGoogleWorkspaceDashboard(...a),
  syncAllFiestasToGoogleWorkspace: jest.fn(),
  syncFiestaAndNotifyStaff: jest.fn(),
}));
jest.mock('@/app/actions/google-workspace-extended', () => ({ notifyGuestsWithCalendarLinks: jest.fn() }));

import GoogleWorkspaceSettingsPage from '@/app/(app)/settings/google-workspace/page';

beforeAll(() => { Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true }); });
afterAll(() => { Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT'); });

const cuenta = (id: string, kind: 'company' | 'employee', status: 'connected' | 'needs_reconnect' | 'error', extra = {}) => ({
  id, kind, email: `${id}@ejemplo.com`, connectedAt: '2026-01-01T10:00:00.000Z', status, ...extra,
});

const tablero = (over: Record<string, unknown>) => ({
  companyAccount: null, missingConfig: [], redirectUri: '', connectedEmployees: [], employeesNeedingAttention: [], employeeCount: 2,
  syncedFiestas: 0, pendingFiestas: 0, contactsEnabled: false, ...over,
});

async function montar(data: unknown) {
  getGoogleWorkspaceDashboard.mockResolvedValue(data);
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  await act(async () => { root.render(<GoogleWorkspaceSettingsPage />); });
  return { host, cerrar: () => { act(() => root.unmount()); host.remove(); } };
}

const boton = (host: HTMLElement, texto: string) =>
  Array.from(host.querySelectorAll('button')).find((b) => b.textContent?.includes(texto)) as HTMLButtonElement;

beforeEach(() => getGoogleWorkspaceDashboard.mockReset());

test('cuenta conectada: se anuncia Conectada y deja sincronizar', async () => {
  const { host, cerrar } = await montar(tablero({ companyAccount: cuenta('ak', 'company', 'connected') }));
  expect(host.textContent).toContain('Conectada');
  expect(boton(host, 'Sincronizar fiestas').disabled).toBe(false);
  cerrar();
});

test('cuenta que necesita reconectar: no dice Conectada y bloquea la sincronización', async () => {
  const { host, cerrar } = await montar(tablero({ companyAccount: cuenta('ak', 'company', 'needs_reconnect') }));
  expect(host.textContent).toContain('Hay que volver a conectar');
  expect(host.textContent).not.toMatch(/Conectada/);
  expect(boton(host, 'Sincronizar fiestas').disabled).toBe(true);
  cerrar();
});

test('cuenta con error: muestra el problema de Google y bloquea la sincronización', async () => {
  const { host, cerrar } = await montar(tablero({ companyAccount: cuenta('ak', 'company', 'error', { lastError: 'invalid_grant' }) }));
  expect(host.textContent).toContain('Con error');
  expect(host.textContent).toContain('invalid_grant');
  expect(host.textContent).not.toMatch(/Conectada/);
  expect(boton(host, 'Sincronizar fiestas').disabled).toBe(true);
  cerrar();
});

test('sin cuenta: queda Pendiente y bloqueado', async () => {
  const { host, cerrar } = await montar(tablero({}));
  expect(host.textContent).toContain('Pendiente');
  expect(boton(host, 'Sincronizar fiestas').disabled).toBe(true);
  cerrar();
});

test('el personal con error no suma al contador ni al porcentaje, pero sigue visible para reconectar', async () => {
  const { host, cerrar } = await montar(tablero({
    companyAccount: cuenta('ak', 'company', 'connected'),
    connectedEmployees: [cuenta('ana', 'employee', 'connected')],
    employeesNeedingAttention: [cuenta('beto', 'employee', 'error', { lastError: 'token vencido' })],
  }));
  expect(host.textContent).toContain('1/2');
  expect(host.textContent).toContain('50% del equipo');
  expect(host.textContent).toContain('beto@ejemplo.com');
  expect(host.textContent).toContain('token vencido');
  expect(host.textContent).toContain('Con error');
  cerrar();
});
