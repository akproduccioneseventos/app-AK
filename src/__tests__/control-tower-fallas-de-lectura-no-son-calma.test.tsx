/**
 * Orden 156, defectos 3 a 6 (actualizado a Orden 321):
 * Las pantallas /control-tower/* se consolidaron y redirigen a /mi-dia (next.config.js).
 * Si la lectura de fiestas en /mi-dia falla, la pantalla NO puede decir "Por hoy está todo al día":
 * muestra un aviso de error persistente con Reintentar, separado del vacío confirmado.
 */
import fs from 'node:fs';
import path from 'node:path';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const getFiestas = jest.fn();

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => ({ success: true, user: { userId: 'u1', perfil: 'dueno', role: 'admin' } })),
}));
jest.mock('@/lib/auth/perfiles', () => ({
  PERMISOS: { CONTABILIDAD: 'contabilidad', CRM: 'crm', ADMINISTRACION: 'administracion' },
  puede: () => true,
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestas: (...a: unknown[]) => getFiestas(...a),
}));
jest.mock('@/app/actions/crm', () => ({
  getCrmLeadsForDashboard: jest.fn(async () => []),
}));
jest.mock('@/app/actions/agentes-autonomos', () => ({
  getHistorialAgentes: jest.fn(async () => []),
}));
jest.mock('@/lib/automatico/parte-manana', () => ({
  getParteDeLaManana: jest.fn(async () => ({})),
  parteParaQuienMira: (p: any) => p,
}));
jest.mock('@/components/mi-dia/ParteDeLaMananaPlayer', () => ({
  ParteDeLaMananaPlayer: () => null,
}));
jest.mock('@/components/panels/MiDiaHubWrapper', () => ({
  MiDiaHubWrapper: ({ children }: any) => <div>{children}</div>,
}));

import MiDiaPage from '@/app/(app)/mi-dia/page';

beforeAll(() => { Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true }); });
afterAll(() => { Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT'); });
beforeEach(() => { getFiestas.mockReset(); });

async function montarMiDia() {
  const elemento = await MiDiaPage();
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  await act(async () => { root.render(elemento); });
  return { host, cerrar: () => { act(() => root.unmount()); host.remove(); } };
}

describe('control-tower consolidado en /mi-dia: fallas de lectura no son calma', () => {
  test('las rutas /control-tower/* redirigen a /mi-dia en next.config.js', () => {
    const nextConfig = fs.readFileSync(path.join(process.cwd(), 'next.config.js'), 'utf8');
    expect(nextConfig).toContain("source: '/control-tower'");
    expect(nextConfig).toContain("source: '/control-tower/comercial'");
    expect(nextConfig).toContain("source: '/control-tower/post-fiesta'");
    expect(nextConfig).toContain("source: '/control-tower/automatizaciones'");
  });

  test('cuando getFiestas falla muestra aviso de error con Reintentar y NO dice "Por hoy está todo al día"', async () => {
    getFiestas.mockRejectedValueOnce(new Error('Failed to fetch'));
    const { host, cerrar } = await montarMiDia();
    expect(host.textContent).toContain('No pudimos cargar las fiestas ahora.');
    expect(host.textContent).toContain('Reintentar');
    expect(host.textContent).not.toContain('Por hoy está todo al día');
    cerrar();
  });

  test('cuando getFiestas devuelve vacío confirmado muestra "Por hoy está todo al día" sin aviso de error', async () => {
    getFiestas.mockResolvedValueOnce([]);
    const { host, cerrar } = await montarMiDia();
    expect(host.textContent).toContain('Por hoy está todo al día');
    expect(host.textContent).not.toContain('No pudimos cargar las fiestas ahora.');
    cerrar();
  });
});
