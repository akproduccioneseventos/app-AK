/**
 * @jest-environment jsdom
 *
 * Orden 170 - Bloque 1: Panel DJ muestra sugerencias "Si es posible"
 * Ruta: /evento/dj/[fiestaId]
 */

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const mockCopy = (x: any) => JSON.parse(JSON.stringify(x));
let mockFiesta: any;

jest.mock('next/navigation', () => ({
  useParams: () => ({ fiestaId: 'qa132-fiesta-dj' }),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => mockCopy(mockFiesta)),
  saveFiesta: jest.fn(),
}));

jest.mock('@/app/actions/social-interactive', () => ({
  getSongRequests: jest.fn(async () => []),
  voteSongRequest: jest.fn(async () => ({ success: true })),
  markSongPlayed: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/components/fiesta/FiestaThermometer', () => ({ FiestaThermometer: () => null }));
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, exit, transition, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

import DJPage from '@/app/evento/dj/[fiestaId]/page';

describe('Orden 170 - Panel DJ: Lista "Si es posible"', () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    jest.clearAllMocks();
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('muestra "Tema X" bajo la sección "Si es posible" cuando está cargado en el portal', async () => {
    mockFiesta = {
      id: 'qa132-fiesta-dj',
      configuracion: { nombreEvento: 'Fiesta QA132' },
      listaMusicaPortal: {
        imprescindibles: ['Tema Obligatorio 1'],
        siEsPosible: ['Tema X Opcional'],
        noQuiero: ['Tema Prohibido 1'],
      },
    };

    const root = createRoot(host);
    await act(async () => {
      root.render(<DJPage />);
    });
    // Esperar a que getFiestaById resuelva
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const text = host.textContent || '';
    // Debe tener la sección "Si es posible"
    expect(text).toContain('Si es posible');
    expect(text).toContain('Tema X Opcional');
    expect(text).toContain('1 sugeridas');
    expect(text).toContain('Sugerencias del cliente: pasalas si encajan.');

    // Obligatorias y prohibidas siguen intactas
    expect(text).toContain('INFALTABLES DEL CLIENTE');
    expect(text).toContain('Tema Obligatorio 1');
    expect(text).toContain('1 obligatorias');
    expect(text).toContain('PROHIBIDAS — NO REPRODUCIR');
    expect(text).toContain('Tema Prohibido 1');
    expect(text).toContain('1 vetadas');
  });

  it('no muestra la sección "Si es posible" si la lista está vacía', async () => {
    mockFiesta = {
      id: 'qa132-fiesta-dj',
      configuracion: { nombreEvento: 'Fiesta QA132' },
      listaMusicaPortal: {
        imprescindibles: ['Tema Obligatorio 1'],
        siEsPosible: [],
        noQuiero: ['Tema Prohibido 1'],
      },
    };

    const root = createRoot(host);
    await act(async () => {
      root.render(<DJPage />);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const text = host.textContent || '';
    expect(text).not.toContain('Si es posible');
    expect(text).not.toContain('sugeridas');
    // Las demás siguen
    expect(text).toContain('INFALTABLES DEL CLIENTE');
    expect(text).toContain('PROHIBIDAS — NO REPRODUCIR');
  });
});

