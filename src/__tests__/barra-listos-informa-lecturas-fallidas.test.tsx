/**
 * @jest-environment jsdom
 *
 * Orden 170 - Bloque 2: Pantalla de tragos listos avisa si no pudo leer
 * Ruta: /evento/barra/[fiestaId]/listo
 */

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const mockParams = { fiestaId: 'qa132-barra-fiesta' };
const mockGetBarPedidosListos = jest.fn();
const mockUsePantallaPrendida = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: () => mockParams,
}));

jest.mock('@/hooks/use-pantalla-prendida', () => ({
  usePantallaPrendida: () => mockUsePantallaPrendida(),
}));

jest.mock('@/app/actions/fiesta/barra-tecnologica.actions', () => ({
  getBarPedidosListos: (...args: unknown[]) => mockGetBarPedidosListos(...args),
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, exit, transition, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

import PantallaTragoListoPage from '@/app/evento/barra/[fiestaId]/listo/page';

const readyOrder = (id: string, guestName: string, drinkName: string) => ({
  id,
  guestName,
  drinkName,
  tableNumber: 'Mesa 5',
  status: 'listo' as const,
});

describe('Orden 170 - Pantalla tragos listos: Avisos de lectura fallida', () => {
  let host: HTMLDivElement;
  let root: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    host = document.createElement('div');
    document.body.appendChild(host);
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

  it('1. success:false de entrada muestra aviso y no dice "Los tragos se están preparando" ni "En tiempo real"', async () => {
    mockGetBarPedidosListos.mockResolvedValue({ success: false, error: 'Error de prueba' });

    root = createRoot(host);
    await act(async () => {
      root.render(<PantallaTragoListoPage />);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const text = host.textContent || '';
    expect(text).toContain('No pudimos leer los pedidos');
    expect(text).toContain('Sin conexión, reintentando…');
    expect(text).not.toContain('Los tragos se están preparando');
    expect(text).not.toContain('En tiempo real');
  });

  it('2. primero un pedido listo y después una falla: el pedido sigue en pantalla y aparece "Puede estar desactualizado"', async () => {
    mockGetBarPedidosListos
      .mockResolvedValueOnce({
        success: true,
        orders: [readyOrder('ord-1', 'Martina Rossi', 'Gin Tonic')],
        eventName: 'Fiesta 15',
      })
      .mockResolvedValueOnce({ success: false, error: 'Caída de conexión en sondeo' });

    root = createRoot(host);
    await act(async () => {
      root.render(<PantallaTragoListoPage />);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    // Primera carga: pedido visible y sin error
    expect(host.textContent).toContain('Martina Rossi');
    expect(host.textContent).toContain('Gin Tonic');
    expect(host.textContent).toContain('En tiempo real');

    // Avanzar intervalo de sondeo (2500 ms)
    await act(async () => {
      await jest.advanceTimersByTimeAsync(2500);
    });

    const textAfterFail = host.textContent || '';
    // El pedido sigue en pantalla
    expect(textAfterFail).toContain('Martina Rossi');
    expect(textAfterFail).toContain('Gin Tonic');
    // Aparece cartel de que puede estar desactualizado
    expect(textAfterFail).toContain('Puede estar desactualizado. Reintentando…');
    expect(textAfterFail).toContain('Sin conexión, reintentando…');
    expect(textAfterFail).not.toContain('Los tragos se están preparando');
  });

  it('3. después vuelve a andar: el aviso desaparece y la lista nueva reemplaza a la vieja', async () => {
    mockGetBarPedidosListos
      .mockResolvedValueOnce({
        success: true,
        orders: [readyOrder('ord-1', 'Martina Rossi', 'Gin Tonic')],
        eventName: 'Fiesta 15',
      })
      .mockRejectedValueOnce(new Error('Falla de red'))
      .mockResolvedValueOnce({
        success: true,
        orders: [readyOrder('ord-2', 'Santiago Pérez', 'Mojito')],
        eventName: 'Fiesta 15',
      });

    root = createRoot(host);
    await act(async () => {
      root.render(<PantallaTragoListoPage />);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    // Falla en el segundo tick
    await act(async () => {
      await jest.advanceTimersByTimeAsync(2500);
    });
    expect(host.textContent).toContain('Puede estar desactualizado');

    // Recuperación en el tercer tick
    await act(async () => {
      await jest.advanceTimersByTimeAsync(2500);
    });

    const textRecovered = host.textContent || '';
    expect(textRecovered).not.toContain('Puede estar desactualizado');
    expect(textRecovered).toContain('En tiempo real');
    expect(textRecovered).toContain('Santiago Pérez');
    expect(textRecovered).toContain('Mojito');
    expect(textRecovered).not.toContain('Martina Rossi');
  });

  it('4. lista vacía confirmada: dice "Los tragos se están preparando", sin aviso', async () => {
    mockGetBarPedidosListos.mockResolvedValue({
      success: true,
      orders: [],
      eventName: 'Fiesta 15',
    });

    root = createRoot(host);
    await act(async () => {
      root.render(<PantallaTragoListoPage />);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const text = host.textContent || '';
    expect(text).toContain('Los tragos se están preparando');
    expect(text).toContain('En tiempo real');
    expect(text).not.toContain('No pudimos leer los pedidos');
    expect(text).not.toContain('Sin conexión, reintentando…');
  });
});

