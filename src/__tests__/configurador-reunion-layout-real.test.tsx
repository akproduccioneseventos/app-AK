/** @jest-environment jsdom */
import fs from 'node:fs';
import path from 'node:path';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { DecoracionData } from '@/types/fiesta';

const mockRenderScene = jest.fn();

jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => (props: Record<string, unknown>) => {
    mockRenderScene(props);
    return React.createElement('div', { 'data-testid': 'salon-renderer' });
  },
}));
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => React.createElement('img', props),
}));
jest.mock('@/app/actions/fiesta/decoracion.actions', () => ({
  generarFotoDelSalonDesdeElPortal: jest.fn(),
}));

import { Salon3DClienteView } from '@/components/salon-3d/Salon3DClienteView';

const buildDecoracion = (mesas: number, primary: string): DecoracionData => ({
  estilo: 'Moderno',
  colorPalette: { primary, secondary: '#ffffff', accent: '#f59e0b' },
  salonElements: [
    { id: 'pista-central', type: 'area', name: 'Pista Central', x: 5, y: 5, width: 4, height: 4 },
    { id: 'escenario-dj', type: 'area', name: 'Escenario DJ', x: 5, y: 1, width: 3, height: 2 },
    { id: 'barra-tragos', type: 'area', name: 'Barra Tragos', x: 1, y: 5, width: 3, height: 1.5 },
    ...Array.from({ length: mesas }, (_, idx) => ({
      id: `mesa-${idx + 1}`,
      type: 'mesa',
      name: `Mesa ${idx + 1}`,
      x: (idx % 4) * 2 + 2,
      y: Math.floor(idx / 4) * 2 + 2,
      width: 1.5,
      height: 1.5,
    })),
  ],
});

describe('layout real del configurador de reunión y vista 3D (Orden 321)', () => {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({})) as any;
    mockRenderScene.mockClear();
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  it('la ruta /empresa/configurador-reunion redirige a templates--reuniones en next.config.js', () => {
    const nextConfig = fs.readFileSync(path.join(process.cwd(), 'next.config.js'), 'utf8');
    expect(nextConfig).toContain("source: '/empresa/configurador-reunion'");
    expect(nextConfig).toContain('/settings?seccion=contratos&sub=templates--reuniones');
    expect(
      fs.existsSync(path.join(process.cwd(), 'src/components/settings/panels/templates--reuniones.tsx'))
    ).toBe(true);
  });

  it('entrega al renderer el layout y los cambios de color/aforo', async () => {
    const host = document.body.appendChild(document.createElement('div'));
    const root = createRoot(host);
    try {
      await act(async () => {
        root.render(<Salon3DClienteView decoracion={buildDecoracion(12, '#d97706')} />);
        await Promise.resolve();
      });

      const decoracionInicial = mockRenderScene.mock.calls.at(-1)?.[0]?.decoracion as any;
      expect(decoracionInicial.salonElements).toHaveLength(15);
      expect(decoracionInicial.salonElements.filter((element: any) => element.name?.startsWith('Mesa '))).toHaveLength(12);
      expect(decoracionInicial.salonElements.map((element: any) => element.id)).toEqual(
        expect.arrayContaining(['pista-central', 'escenario-dj', 'barra-tragos'])
      );
      expect(decoracionInicial.colorPalette.primary).toBe('#d97706');

      await act(async () => {
        root.render(<Salon3DClienteView decoracion={buildDecoracion(12, '#2563eb')} />);
        await Promise.resolve();
      });
      const decoracionAzul = mockRenderScene.mock.calls.at(-1)?.[0]?.decoracion as any;
      expect(decoracionAzul.colorPalette.primary).toBe('#2563eb');
      expect(decoracionAzul.salonElements).toHaveLength(15);

      await act(async () => {
        root.render(<Salon3DClienteView decoracion={buildDecoracion(13, '#2563eb')} />);
        await Promise.resolve();
      });
      const decoracionTrasAforo = mockRenderScene.mock.calls.at(-1)?.[0]?.decoracion as any;
      expect(decoracionTrasAforo.salonElements.filter((element: any) => element.name?.startsWith('Mesa '))).toHaveLength(13);
      expect(decoracionTrasAforo.salonElements).toHaveLength(16);
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  });
});
