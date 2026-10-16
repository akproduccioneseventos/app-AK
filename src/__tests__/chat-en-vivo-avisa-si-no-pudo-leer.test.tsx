/**
 * @jest-environment jsdom
 *
 * Orden 170 - Bloque 4: Barrido de la pregunta 50: el chat en vivo del invitado
 * Ruta: /evento/en-vivo/[fiestaId]
 */

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const mockParams = { fiestaId: 'qa132-en-vivo-fiesta' };
const mockSearchParams = new Map<string, string>();
const mockGetFiestaById = jest.fn();
const mockGetChatMessages = jest.fn();
const mockAddChatMessage = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: () => mockParams,
  useSearchParams: () => ({
    get: (key: string) => mockSearchParams.get(key) || null,
  }),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock('@/hooks/use-pantalla-prendida', () => ({
  usePantallaPrendida: jest.fn(),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: (...args: any[]) => mockGetFiestaById(...args),
}));

jest.mock('@/app/actions/social-gallery', () => ({
  getChatMessages: (...args: any[]) => mockGetChatMessages(...args),
  addChatMessage: (...args: any[]) => mockAddChatMessage(...args),
}));

jest.mock('@/lib/intento-de-guardado', () => ({
  obtenerIntento: jest.fn(async () => 'mock-intento'),
  terminarIntento: jest.fn(),
}));

jest.mock('@/components/legal/AvisoDeDatos', () => ({
  AvisoDeDatos: () => null,
}));

import EventoEnVivoPage from '@/app/evento/en-vivo/[fiestaId]/page';

describe('Orden 170 - Chat en vivo del invitado: Aviso de lectura fallida', () => {
  let host: HTMLDivElement;
  let root: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    host = document.createElement('div');
    document.body.appendChild(host);

    mockGetFiestaById.mockResolvedValue({
      id: 'qa132-en-vivo-fiesta',
      configuracion: { nombreEvento: 'Fiesta QA En Vivo' },
    });
  });

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root.unmount();
      });
      root = null;
    }
    jest.useRealTimers();
    document.body.replaceChildren();
  });

  it('con getChatMessages rechazando, no aparece "Sé la primera persona" ni "0 mensajes" y sí el aviso', async () => {
    mockGetChatMessages.mockRejectedValue(new Error('Falla de red en chat'));

    root = createRoot(host);
    await act(async () => {
      root.render(<EventoEnVivoPage />);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const text = host.textContent || '';
    expect(text).not.toContain('Sé la primera persona en mandar un saludo a la fiesta');
    expect(text).not.toContain('0 mensajes');
    expect(text).toContain('No pudimos cargar los saludos. Reintentando…');
  });

  it('cuando el sondeo vuelve a andar, el aviso desaparece y se ven los mensajes', async () => {
    mockGetChatMessages
      .mockRejectedValueOnce(new Error('Falla inicial'))
      .mockResolvedValueOnce([
        {
          id: 'msg-1',
          authorName: 'Tía Marta',
          text: '¡Hermosa fiesta, los queremos!',
          timestamp: Date.now(),
        },
      ]);

    root = createRoot(host);
    await act(async () => {
      root.render(<EventoEnVivoPage />);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    // Estado fallido inicial
    expect(host.textContent).toContain('No pudimos cargar los saludos. Reintentando…');

    // Avanzamos los 6 segundos de intervalo de sondeo
    await act(async () => {
      await jest.advanceTimersByTimeAsync(6000);
    });

    const textRecovered = host.textContent || '';
    expect(textRecovered).not.toContain('No pudimos cargar los saludos. Reintentando…');
    expect(textRecovered).toContain('Tía Marta');
    expect(textRecovered).toContain('¡Hermosa fiesta, los queremos!');
    expect(textRecovered).toContain('1 mensajes');
  });
});

