/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

const mockReadData = jest.fn();
let mockSessionUser: any = null;
const mockToast = jest.fn();

jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));

jest.mock('@/lib/data-service', () => ({
  readData: (...args: any[]) => mockReadData(...args),
  readDataConDetalle: jest.fn(async (p: string, def: any) => ({ valor: def, huboFalla: false })),
  writeData: jest.fn(async () => {}),
  updateDataPartial: jest.fn(async () => {}),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => ({ user: mockSessionUser || { perfil: 'duenio', email: 'duenio@ak.test' } })),
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () =>
    mockSessionUser ? { success: true, user: mockSessionUser } : { success: false }
  ),
}));

jest.mock('@/lib/security/portal-session', () => ({
  verifyPortalSession: jest.fn(async () => false),
}));

jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: jest.fn(async () => []),
  leerHistorialCrudo: jest.fn(async () => []),
}));

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'qa-test-fiesta', fiestaId: 'qa-test-fiesta' }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'fiestaId' ? 'qa-test-fiesta' : null),
  }),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Import actions after mocks
import { getFiestaById, getFiestaParaPantalla } from '@/app/actions/fiesta/fiesta.actions';
import InvitadosPage from '@/app/(app)/fiestas/nueva/invitados/page';

describe('Orden 227: Una falla de lectura no dice que no existe', () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    mockReadData.mockReset();
    mockSessionUser = null;
    mockToast.mockReset();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  test('con readData que tira, getFiestaParaPantalla devuelve fallo: true', async () => {
    mockReadData.mockRejectedValue(new Error('READ_FAILURE_TEST'));
    const result = await getFiestaParaPantalla('qa-test-fiesta');
    expect(result.fallo).toBe(true);
    expect(result.fiesta).toBeNull();
  });

  test('con archivo ausente devuelve fallo: false y fiesta: null', async () => {
    mockReadData.mockResolvedValue(null);
    const result = await getFiestaParaPantalla('qa-test-fiesta-ausente');
    expect(result.fallo).toBe(false);
    expect(result.fiesta).toBeNull();
  });

  test('con sesion de personal, getFiestaParaPantalla y getFiestaById devuelven la fiesta sin clientPortalSettings', async () => {
    mockSessionUser = { perfil: 'personal', email: 'personal@ak.test' };
    const fiestaCompleta = {
      id: 'qa-test-personal',
      configuracion: { nombreEvento: 'Fiesta Personal', fechaEvento: '2026-12-01' },
      modulosContratados: {},
      clientPortalSettings: { accessKey: 'clave-secreta-portal-123' },
    };
    mockReadData.mockResolvedValue(fiestaCompleta);

    const resPantalla = await getFiestaParaPantalla('qa-test-personal');
    const resById = await getFiestaById('qa-test-personal');

    expect(resPantalla.fallo).toBe(false);
    expect(resPantalla.fiesta).not.toBeNull();
    expect(resPantalla.fiesta?.clientPortalSettings).toBeUndefined();

    expect(resById).not.toBeNull();
    expect(resById?.clientPortalSettings).toBeUndefined();
  });

  test('una pantalla con la carga rechazada muestra No se pudo cargar y no no existe', async () => {
    mockReadData.mockRejectedValue(new Error('READ_FAILURE_UI_TEST'));
    await act(async () => {
      root.render(<InvitadosPage />);
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(container.textContent).toMatch(/no se pudo cargar la fiesta/i);
    expect(container.textContent).not.toMatch(/fiesta solicitada no existe|eliminada/i);
    expect(container.querySelector('.animate-spin')).toBeNull();
  });
});
