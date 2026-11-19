/**
 * Orden 156 (3 a 6 y 7, 8): cuando una accion de red falla, la pantalla lo dice, conserva lo que
 * ya tenia y permite reintentar; nunca dice "todo al dia" ni "todo tranquilo" sin haber leido.
 *
 * En Orden 321 las rutas viejas de `/control-tower/*` pasaron a redirigir en `next.config.js`
 * hacia `/mi-dia` (`src/app/(app)/mi-dia/page.tsx`).
 */
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));
jest.mock('next/navigation', () => ({ redirect: jest.fn((to: string) => { throw new Error(`REDIRECT:${to}`); }) }));

const mockGetFiestas = jest.fn();
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestas: (...a: unknown[]) => mockGetFiestas(...a),
}));
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => ({ success: true, user: { id: 'u1', role: 'admin' } })),
}));
jest.mock('@/lib/auth/perfiles', () => ({
  PERMISOS: { CONTABILIDAD: 'contabilidad', CRM: 'crm', ADMINISTRACION: 'administracion' },
  puede: jest.fn(() => false),
}));
jest.mock('@/app/actions/crm', () => ({ getCrmLeadsForDashboard: jest.fn(async () => []) }));
jest.mock('@/app/actions/agentes-autonomos', () => ({ getHistorialAgentes: jest.fn(async () => []) }));
jest.mock('@/lib/automatico/parte-manana', () => ({
  getParteDeLaManana: jest.fn(async () => null),
  parteParaQuienMira: jest.fn((p: unknown) => p),
}));
jest.mock('@/components/mi-dia/ParteDeLaMananaPlayer', () => ({
  ParteDeLaMananaPlayer: () => <div data-testid="parte-manana" />,
}));
jest.mock('@/components/panels/MiDiaHubWrapper', () => ({
  MiDiaHubWrapper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => {
  jest.restoreAllMocks();
});

describe('Mi Día (reemplazo consolidado de Control Tower en Orden 321)', () => {
  const renderMiDia = async () => {
    const MiDiaPage = require('@/app/(app)/mi-dia/page').default;
    return renderToStaticMarkup(await MiDiaPage());
  };

  test('con lectura de fiestas caída: avisa con role="alert", muestra Reintentar y NO dice "Por hoy está todo al día"', async () => {
    mockGetFiestas.mockRejectedValueOnce(new Error('red'));
    const out = await renderMiDia();
    expect(out).toContain('role="alert"');
    expect(out).toContain('No pudimos cargar las fiestas ahora.');
    expect(out).toContain('Reintentar');
    expect(out).not.toContain('Por hoy está todo al día');
  });

  test('con lectura vacía confirmada sí dice "Por hoy está todo al día" y no muestra alerta de error', async () => {
    mockGetFiestas.mockResolvedValueOnce([]);
    const out = await renderMiDia();
    expect(out).toContain('Por hoy está todo al día');
    expect(out).not.toContain('No pudimos cargar las fiestas ahora.');
  });

  test('las rutas viejas de /control-tower/* redirigen a /mi-dia en next.config.js', () => {
    const nextConfig = fs.readFileSync(path.join(process.cwd(), 'next.config.js'), 'utf8');
    for (const ruta of [
      '/control-tower',
      '/control-tower/automatizaciones',
      '/control-tower/comercial',
      '/control-tower/post-fiesta',
      '/control-tower/preparacion',
    ]) {
      expect(nextConfig).toContain(`source: '${ruta}'`);
    }
  });
});
