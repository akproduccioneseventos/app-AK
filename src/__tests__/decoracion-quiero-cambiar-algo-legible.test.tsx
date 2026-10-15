/**
 * Orden 164, defecto 2: el boton "Quiero cambiar algo" del portal de decoracion salia casi
 * invisible (texto claro sobre el fondo claro del boton outline). Tiene que llevar fondo y texto
 * explicitos y legibles, y ningun outline de la pantalla puede dejar texto claro sin fondo oscuro.
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import fs from 'fs';

jest.mock('next/link', () => ({ __esModule: true, default: ({ children }: any) => <a>{children}</a> }));
jest.mock('next/image', () => ({ __esModule: true, default: () => null }));
jest.mock('next/dynamic', () => ({ __esModule: true, default: () => () => null }));
jest.mock('next/navigation', () => ({ useParams: () => ({ fiestaId: 'f1' }) }));
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: jest.fn() }) }));
jest.mock('@/components/legal/AvisoDeDatos', () => ({ AvisoDeDatos: () => null }));
jest.mock('@/components/salon-3d/Salon3DClienteView', () => ({ Salon3DClienteView: () => null }));
jest.mock('@/app/actions/fiesta/decoracion.actions', () => ({ enviarOpinionDecoracion: jest.fn() }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => ({ id: 'f1', configuracion: { nombreEvento: 'Fiesta' }, decoracion: {} })),
}));

import Page from '@/app/portal/[fiestaId]/decoracion/page';

beforeAll(() => { Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true }); });
afterAll(() => { Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT'); });

test('"Quiero cambiar algo" lleva fondo oscuro y texto claro explicitos', async () => {
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  await act(async () => { root.render(<Page />); });
  const boton = Array.from(host.querySelectorAll('button')).find((b) => b.textContent?.includes('Quiero cambiar algo'))!;
  expect(boton).toBeTruthy();
  const clases = boton.className.split(/\s+/);
  expect(clases).toContain('bg-slate-900');
  expect(clases).toContain('text-slate-100');
  expect(clases).toContain('hover:bg-slate-800');
  expect(clases.some((c) => c.startsWith('focus-visible:ring-'))).toBe(true);
  expect(clases).not.toContain('text-slate-200');
  act(() => root.unmount()); host.remove();
});

test('ningun boton outline de la pantalla deja texto claro sin fondo oscuro propio', () => {
  const src = fs.readFileSync('src/app/portal/[fiestaId]/decoracion/page.tsx', 'utf8');
  for (const m of src.matchAll(/<Button\b[^>]*?variant="outline"[^>]*?>/gs)) {
    const c = /className="([^"]*)"/.exec(m[0])?.[1] ?? '';
    if (/text-(white|slate-(50|100|200|300)|purple-300)/.test(c)) expect(c).toMatch(/\bbg-slate-9\d\d\b/);
  }
});
