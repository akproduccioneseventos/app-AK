/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

const mockListUsers = jest.fn();
const mockCreateUser = jest.fn();
const mockDeleteUser = jest.fn();
const mockUpdateUserModules = jest.fn();
const mockAdminResetUserPassword = jest.fn();
const mockToast = jest.fn();

jest.mock('@/app/actions/auth', () => ({
  listUsers: (...args: unknown[]) => mockListUsers(...args),
  createUser: (...args: unknown[]) => mockCreateUser(...args),
  deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
  updateUserModules: (...args: unknown[]) => mockUpdateUserModules(...args),
  adminResetUserPassword: (...args: unknown[]) => mockAdminResetUserPassword(...args),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

import AdminUsuariosPage from '@/app/(app)/admin/usuarios/page';

describe('Pantalla /admin/usuarios', () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeAll(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterAll(() => {
    Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
  });

  beforeEach(() => {
    mockListUsers.mockReset();
    mockCreateUser.mockReset();
    mockDeleteUser.mockReset();
    mockUpdateUserModules.mockReset();
    mockAdminResetUserPassword.mockReset();
    mockToast.mockReset();

    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  test('carga y muestra la lista de usuarios correctamente en /admin/usuarios', async () => {
    const mockUser = {
      id: 'usr-1',
      email: 'admin@ak.uy',
      role: 'admin' as const,
      perfil: 'dueno' as const,
      modules: ['all'],
      createdAt: '2026-01-01',
      hasSecurityQuestions: true,
      mustChangePassword: false,
    };

    mockListUsers.mockResolvedValue({
      success: true,
      users: [mockUser],
    });

    await act(async () => {
      root.render(<AdminUsuariosPage />);
    });

    await act(async () => {
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockListUsers).toHaveBeenCalledTimes(1);
    expect(host.textContent).toContain('admin@ak.uy');
    expect(host.textContent).toContain('Administrador');
    expect(host.textContent).toContain('Acceso Total');
  });
});
