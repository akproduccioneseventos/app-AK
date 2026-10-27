import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MainNav } from '@/components/main-nav';
import { PERMISOS, PERMISOS_POR_PERFIL } from '@/lib/auth/perfiles';

const getMisPermisosMock = jest.fn();
jest.mock('@/app/actions/sesion', () => ({
  getMisPermisos: (...args: any[]) => getMisPermisosMock(...args),
}));

jest.mock('@/components/app-logo', () => function MockAppLogo() {
  return <div data-testid="app-logo">AK Logo</div>;
});

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

jest.mock('@/app/actions/alertas.actions', () => ({
  getAlertasGlobalesConLeidas: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/components/ui/sidebar', () => ({
  Sidebar: ({ children }: any) => <aside data-testid="sidebar">{children}</aside>,
  SidebarHeader: ({ children }: any) => <header>{children}</header>,
  SidebarContent: ({ children }: any) => <nav>{children}</nav>,
  SidebarFooter: ({ children }: any) => <footer>{children}</footer>,
  SidebarMenu: ({ children }: any) => <ul>{children}</ul>,
  SidebarMenuItem: ({ children }: any) => <li>{children}</li>,
  SidebarMenuButton: ({ children, asChild }: any) => <div>{children}</div>,
  SidebarGroup: ({ children }: any) => <section>{children}</section>,
  SidebarGroupLabel: ({ children }: any) => <h3>{children}</h3>,
  SidebarGroupContent: ({ children }: any) => <div>{children}</div>,
}));

beforeAll(() => {
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
});

afterAll(() => {
  Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
});

async function montar() {
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  await act(async () => {
    root.render(<MainNav />);
  });
  return {
    host,
    cerrar: () => {
      act(() => root.unmount());
      host.remove();
    },
  };
}

describe('El menú muestra sólo lo que se puede usar según perfil (Orden 180)', () => {
  beforeEach(() => {
    getMisPermisosMock.mockReset();
  });

  it('secretaria: ve Plata y Clientes, pero no ve Empleados ni Ajustes Generales', async () => {
    getMisPermisosMock.mockResolvedValue({
      permisos: PERMISOS_POR_PERFIL.secretaria,
    });

    const { host, cerrar } = await montar();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    const text = host.textContent || '';
    expect(text).toContain('Eventos Activos');
    expect(text).toContain('Panel Contable');
    expect(text).toContain('Facturas');
    expect(text).not.toContain('Empleados');
    expect(text).not.toContain('Ajustes Generales');
    expect(text).not.toContain('Métricas del Negocio');

    cerrar();
  });

  it('operador: ve Eventos Activos y Calendario, pero nada de plata', async () => {
    getMisPermisosMock.mockResolvedValue({
      permisos: PERMISOS_POR_PERFIL.operador,
    });

    const { host, cerrar } = await montar();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    const text = host.textContent || '';
    expect(text).toContain('Eventos Activos');
    expect(text).toContain('Calendario');
    expect(text).toContain('Muro Social');

    expect(text).not.toContain('Panel Contable');
    expect(text).not.toContain('Facturas');
    expect(text).not.toContain('Prospectos');
    expect(text).not.toContain('Presupuestos');
    expect(text).not.toContain('Pagos Rápidos');

    cerrar();
  });

  it('dueño: ve todos los módulos habilitados', async () => {
    getMisPermisosMock.mockResolvedValue({
      permisos: PERMISOS_POR_PERFIL.dueno,
    });

    const { host, cerrar } = await montar();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    const text = host.textContent || '';
    expect(text).toContain('Eventos Activos');
    expect(text).toContain('Panel Contable');
    expect(text).toContain('Facturas');
    expect(text).toContain('Ajustes Generales');
    expect(text).toContain('Marketing y Redes');
    expect(text).toContain('Empleados');

    cerrar();
  });
});
