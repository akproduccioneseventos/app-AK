/**
 * @jest-environment jsdom
 *
 * Orden 169 - Bloques 1, 2 y 3: Panel DJ, desmarcar y avisar si falla guardar.
 * Ruta: /evento/dj/[fiestaId]
 */

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const mockCopy = (x: any) => JSON.parse(JSON.stringify(x));
let mockSong: any;
let mockRejectWrite = false;
let mockThrowInAction = false;
const mockPermission = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: () => ({ fiestaId: 'qa131-fiesta' }),
}));

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: {
    collection: () => ({
      doc: () => ({
        get: async () => ({ exists: true, data: () => mockCopy(mockSong) }),
        update: async (delta: any) => {
          if (mockRejectWrite) throw new Error('QA131 storage no disponible');
          mockSong = { ...mockSong, ...mockCopy(delta) };
        },
      }),
    }),
  },
}));

jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: (...args: any[]) => mockPermission(...args),
}));
jest.mock('@/lib/auth/require-session', () => ({
  hasAppSession: jest.fn(async () => false),
}));
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({ actualizarFiesta: jest.fn() }));
jest.mock('@/lib/firebase/storage', () => ({}));
jest.mock('@/lib/social-fiesta/content-review', () => ({
  reviewSocialContent: jest.fn(),
  sanitizeSocialText: (s: string) => s,
}));
jest.mock('@/lib/commercial/public-rate-limit', () => ({ enforcePublicRateLimit: jest.fn() }));
jest.mock('@/lib/commercial/social-interaction-rate-limit', () => ({ enforceSocialInteractionRateLimit: jest.fn() }));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => ({
    id: 'qa131-fiesta',
    configuracion: { nombreEvento: 'Fiesta ficticia QA131' },
    invitados: [],
  })),
  saveFiesta: jest.fn(),
}));

jest.mock('@/components/fiesta/FiestaThermometer', () => ({ FiestaThermometer: () => null }));
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, exit, transition, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

jest.mock('@/app/actions/social-interactive', () => {
  const actual = jest.requireActual('@/app/actions/social-interactive');
  return {
    ...actual,
    getSongRequests: jest.fn(async () => [mockCopy(mockSong)]),
    voteSongRequest: jest.fn(async () => ({ success: true })),
    markSongPlayed: jest.fn(async (fiestaId: string, requestId: string, reproducida: boolean) => {
      if (mockThrowInAction) throw new Error('Error de red simulado');
      return actual.markSongPlayed(fiestaId, requestId, reproducida);
    }),
  };
});

import DJPage from '@/app/evento/dj/[fiestaId]/page';
import { markSongPlayed } from '@/app/actions/social-interactive';

beforeAll(() => {
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
});

beforeEach(() => {
  jest.clearAllMocks();
  mockPermission.mockResolvedValue({});
  mockRejectWrite = false;
  mockThrowInAction = false;
  mockSong = {
    id: 'qa131-cancion',
    fiestaId: 'qa131-fiesta',
    song: 'Tema ficticio QA131',
    requestedBy: 'Invitado ficticio',
    votes: 3,
    played: false,
    timestamp: '2026-10-15T15:59:00Z',
  };
});

afterAll(() => {
  Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
});

async function mount() {
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  await act(async () => {
    root.render(<DJPage />);
  });
  await act(async () => {
    await Promise.resolve();
  });
  return {
    host,
    close: () => {
      act(() => root.unmount());
      host.remove();
    },
  };
}

async function click(host: HTMLElement, label: string) {
  const button = host.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement | null;
  if (!button) throw new Error('QA131 boton visible no encontrado: ' + label);
  await act(async () => {
    button.click();
  });
  await act(async () => {
    await Promise.resolve();
  });
}

describe('Panel DJ en ruta /evento/dj/[fiestaId]', () => {
  test('1. Marcar una pendiente: queda played: true y sale de pendientes', async () => {
    const page = await mount();
    try {
      await click(page.host, 'Marcar como reproducida');
      expect(mockSong.played).toBe(true);
      expect(page.host.textContent).toContain('No hay pedidos pendientes');
      expect(mockPermission).toHaveBeenCalled();
    } finally {
      page.close();
    }
  });

  test('2. Desmarcar una reproducida desde el botón de la pantalla: queda played: false y vuelve a pendientes', async () => {
    mockSong.played = true;
    const page = await mount();
    try {
      const btnFiltro = Array.from(page.host.querySelectorAll('button')).find(b => b.textContent?.includes('pendientes') || b.textContent?.includes('reproducidas'));
      if (btnFiltro) {
        await act(async () => {
          btnFiltro.click();
        });
      }
      await click(page.host, 'Marcar como no reproducida');
      expect(mockSong.played).toBe(false);
    } finally {
      page.close();
    }

    const reloaded = await mount();
    try {
      expect(mockSong.played).toBe(false);
      expect(reloaded.host.textContent).toContain('Tema ficticio QA131');
      expect(reloaded.host.querySelector('button[aria-label="Marcar como reproducida"]')).not.toBeNull();
    } finally {
      reloaded.close();
    }
  });

  test('3. Pedir false dos veces: sigue false', async () => {
    mockSong.played = true;
    const res1 = await markSongPlayed('qa131-fiesta', mockSong.id, false);
    expect(res1.success).toBe(true);
    expect(mockSong.played).toBe(false);

    const res2 = await markSongPlayed('qa131-fiesta', mockSong.id, false);
    expect(res2.success).toBe(true);
    expect(mockSong.played).toBe(false);
  });

  test('4. ID de otra fiesta: no escribe y devuelve error', async () => {
    mockSong.fiestaId = 'qa131-otra-fiesta';
    const result = await markSongPlayed('qa131-fiesta', mockSong.id, true);
    expect(result.success).toBe(false);
    expect(mockSong.played).toBe(false);
  });

  test('5. Sin permiso de la noche: no escribe y devuelve error', async () => {
    mockPermission.mockRejectedValueOnce(new Error('Sin permisos para la noche'));
    const result = await markSongPlayed('qa131-fiesta', mockSong.id, true);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/permiso/i);
    expect(mockSong.played).toBe(false);
  });

  test('6. La acción devuelve success: false: muestra aviso con role="alert" y el botón vuelve a estar habilitado', async () => {
    mockRejectWrite = true;
    const page = await mount();
    try {
      await click(page.host, 'Marcar como reproducida');
      expect(mockSong.played).toBe(false);
      const alert = page.host.querySelector('[role="alert"]');
      expect(alert).not.toBeNull();
      expect(alert?.textContent).toContain('No se pudo guardar la marca. Tocá de nuevo.');
      const btn = page.host.querySelector('button[aria-label="Marcar como reproducida"]') as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
    } finally {
      page.close();
    }
  });

  test('7. La llamada tira excepción: muestra aviso con role="alert" y el botón se rehabilita', async () => {
    mockThrowInAction = true;
    const page = await mount();
    try {
      await click(page.host, 'Marcar como reproducida');
      expect(mockSong.played).toBe(false);
      const alert = page.host.querySelector('[role="alert"]');
      expect(alert).not.toBeNull();
      expect(alert?.textContent).toContain('No se pudo guardar la marca. Tocá de nuevo.');
      const btn = page.host.querySelector('button[aria-label="Marcar como reproducida"]') as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
    } finally {
      page.close();
    }
  });
});

