import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MainNav } from '@/components/main-nav';
import { SidebarProvider } from '@/components/ui/sidebar';
import { getMisPermisos } from '@/app/actions/sesion';
import { PERMISOS } from '@/lib/auth/perfiles';

beforeAll(() => {
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

afterAll(() => {
  Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
});

jest.mock('@/app/actions/sesion', () => ({
  getMisPermisos: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  usePathname: () => '/mi-dia',
}));

jest.mock('@/app/actions/alertas.actions', () => ({
  getAlertasGlobalesConLeidas: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/components/app-logo', () => ({
  __esModule: true,
  default: () => <div data-testid="app-logo">AK Logo</div>,
}));

describe('Orden 180 - El menú muestra sólo lo que se puede usar', () => {
  let host: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    host = document.body.appendChild(document.createElement('div'));
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
  });

  it('con un operador, el menú no tiene opciones de contabilidad ni ganancias y sí eventos activos', async () => {
    jest.mocked(getMisPermisos).mockResolvedValue({
      permisos: [PERMISOS.NOCHE, PERMISOS.ORGANIZACION],
    });

    await act(async () => {
      root.render(
        <SidebarProvider>
          <MainNav />
        </SidebarProvider>
      );
    });

    await act(async () => {
      await Promise.resolve();
    });

    const textContent = host.textContent || '';
    expect(textContent).toContain('Eventos Activos');
    expect(textContent).not.toContain('Pagos Rápidos');
    expect(textContent).not.toContain('Panel Contable');
    expect(textContent).not.toContain('Facturas');
    expect(textContent).not.toContain('Métricas del Negocio');
  });

  it('con el dueño, el menú muestra todas las opciones', async () => {
    jest.mocked(getMisPermisos).mockResolvedValue({
      permisos: Object.values(PERMISOS),
    });

    await act(async () => {
      root.render(
        <SidebarProvider>
          <MainNav />
        </SidebarProvider>
      );
    });

    await act(async () => {
      await Promise.resolve();
    });

    const textContent = host.textContent || '';
    expect(textContent).toContain('Pagos Rápidos');
    expect(textContent).toContain('Panel Contable');
    expect(textContent).toContain('Facturas');
  });
});
