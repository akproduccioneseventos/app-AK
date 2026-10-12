/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const mockGetServiciosEmpresa = jest.fn();
const mockGetArmadoRapidoConfig = jest.fn();
const mockRenderScene = jest.fn();

jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => (props: Record<string, unknown>) => {
    mockRenderScene(props);
    return React.createElement('div', { 'data-testid': 'salon-renderer' });
  },
}));
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }) }));
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: jest.fn() }) }));
jest.mock('@/app/actions/servicios-empresa', () => ({ getServiciosEmpresa: (...args: unknown[]) => mockGetServiciosEmpresa(...args) }));
jest.mock('@/app/actions/armado-rapido', () => ({ getArmadoRapidoConfig: (...args: unknown[]) => mockGetArmadoRapidoConfig(...args) }));
jest.mock('@/app/actions/presupuestos', () => ({ savePresupuesto: jest.fn() }));
jest.mock('@/app/actions/fiesta/decoracion.actions', () => ({ generarVisualizacionSalonReunion: jest.fn() }));
jest.mock('@/app/actions/fiesta-actual', () => ({ createDemoFiesta: jest.fn() }));
jest.mock('@/lib/asistente/reproductor-voz', () => ({ reproducirVozReal: jest.fn(), detenerVozReal: jest.fn() }));
jest.mock('@/lib/simulator/pricing', () => ({ calculateSimulatorPricing: jest.fn(() => null) }));

import ConfiguradorReunionPage from '@/app/(app)/empresa/configurador-reunion/page';

describe('layout real del configurador de reunión', () => {
  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    mockGetServiciosEmpresa.mockResolvedValue([{
      id: 'servicio-test',
      nombre: 'Sonido',
      precio: 100,
      precioVenta: 100,
      categoria: 'Audio',
    }]);
    mockGetArmadoRapidoConfig.mockResolvedValue({
      menus: [],
      paquetes: [],
      mostrarPrecios: true,
      clubUruguayConfig: { activo: true, precio: 0, prestaciones: [] },
    });
    mockRenderScene.mockClear();
  });

  it('entrega al renderer el layout y los cambios de color/aforo', async () => {
    const host = document.body.appendChild(document.createElement('div'));
    const root = createRoot(host);
    try {
      await act(async () => {
        root.render(<ConfiguradorReunionPage />);
        await Promise.resolve();
      });
      expect(host.textContent).not.toContain('Cargando el salón interactivo');
      expect(host.textContent).toContain('Salón Interactivo 3D');
      expect(host.textContent).toContain('12 Mesas distribuidas');
      expect(host.textContent).toContain('120 Invitados');

      const decoracionInicial = mockRenderScene.mock.calls.at(-1)?.[0]?.decoracion as any;
      expect(decoracionInicial.salonElements).toHaveLength(15);
      expect(decoracionInicial.salonElements.filter((element: any) => element.name?.startsWith('Mesa '))).toHaveLength(12);
      expect(decoracionInicial.salonElements.map((element: any) => element.id)).toEqual(
        expect.arrayContaining(['pista-central', 'escenario-dj', 'barra-tragos'])
      );
      expect(decoracionInicial.colorPalette.primary).toBe('#d97706');

      await act(async () => {
        host.querySelector<HTMLButtonElement>('button[aria-label="Color Azul"]')!.click();
      });
      const decoracionAzul = mockRenderScene.mock.calls.at(-1)?.[0]?.decoracion as any;
      expect(decoracionAzul.colorPalette.primary).toBe('#2563eb');
      expect(decoracionAzul.salonElements).toHaveLength(15);

      const adultControls = Array.from(host.querySelectorAll('label')).find((node) => node.textContent?.trim() === 'Adultos')?.parentElement;
      const increment = Array.from(adultControls?.querySelectorAll('button') || []).find((button) => button.textContent?.trim() === '+') as HTMLButtonElement;
      await act(async () => { increment.click(); });

      const decoracionTrasAforo = mockRenderScene.mock.calls.at(-1)?.[0]?.decoracion as any;
      expect(Array.from(host.querySelectorAll('span')).some((node) => node.textContent?.trim() === '105')).toBe(true);
      expect(host.textContent).toContain('125 Invitados');
      expect(decoracionTrasAforo.salonElements.filter((element: any) => element.name?.startsWith('Mesa '))).toHaveLength(13);
      expect(decoracionTrasAforo.salonElements).toHaveLength(16);
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  });
});
