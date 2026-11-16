/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ScreenPlaylistAdmin } from '@/components/screen/ScreenPlaylistAdmin';
import { buildAkDemoFiesta } from '@/lib/experience-ak/demo-fiesta-factory';

const mockGetScreenPlaylist = jest.fn();
const mockSaveScreenPlaylist = jest.fn();
jest.mock('@/app/actions/fiesta/screen-playlist.actions', () => ({
  getScreenPlaylist: (...args: any[]) => mockGetScreenPlaylist(...args),
  saveScreenPlaylist: (...args: any[]) => mockSaveScreenPlaylist(...args),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

let root: Root, container: HTMLDivElement;

beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  mockGetScreenPlaylist.mockReset();
  mockSaveScreenPlaylist.mockReset();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe('La playlist no se cae con un tipo desconocido (Orden 285 - Bloque 2)', () => {
  it('ScreenPlaylistAdmin con un renglón type "mural" se dibuja sin tirar error', async () => {
    mockGetScreenPlaylist.mockResolvedValue({
      items: [
        { id: '1', type: 'mural' as any, label: 'Mural antiguo', durationSeconds: 20, enabled: true },
      ],
      loop: true,
      orientation: 'landscape',
      isPlaying: false,
      currentIndex: 0,
    });

    await act(async () => {
      root.render(<ScreenPlaylistAdmin fiestaId="fiesta_test" />);
    });
    // Wait for async loadPlaylist state update
    await act(async () => {
      await Promise.resolve();
    });

    expect(container.textContent).toContain('Mural antiguo');
    expect(container.textContent).toContain('Otro');
  });

  it('los tipos de la fiesta demo están soportados sin caer en fallback desconocido', () => {
    const demoFiesta = buildAkDemoFiesta('tecnologia-total');
    const items = demoFiesta.screenPlaylist?.items ?? [];
    expect(items.length).toBeGreaterThan(0);

    const tiposSoportados = ['muro-fotos', 'video-publicitario', 'redes-sociales', 'ruleta', 'votacion'];
    for (const item of items) {
      expect(tiposSoportados).toContain(item.type);
    }
  });
});
