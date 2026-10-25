import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const mockGetProveedorByToken = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: () => ({ token: 'tok_test_123' }),
}));

jest.mock('@/app/actions/provider-portal', () => ({
  getProveedorByToken: (...args: any[]) => mockGetProveedorByToken(...args),
  addNotaProveedor: jest.fn(),
  confirmarLlegada: jest.fn(),
  confirmarPartida: jest.fn(),
  toggleTareaProveedor: jest.fn(),
  updateProveedorEstado: jest.fn(),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

import ProveedorAccessPage from '@/app/proveedor/acceso/[token]/page';

beforeAll(() => {
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
});

afterAll(() => {
  Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
});

beforeEach(() => {
  mockGetProveedorByToken.mockReset();
});

async function montar() {
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  await act(async () => {
    root.render(<ProveedorAccessPage />);
  });
  // Dar oportunidad al microtask de resolver la carga inicial
  await act(async () => {
    await new Promise((r) => setTimeout(r, 20));
  });
  return {
    host,
    cerrar: () => {
      act(() => root.unmount());
      host.remove();
    },
  };
}

describe('Portal de Proveedor - Manejo de error inicial y corte de señal', () => {
  test('cuando getProveedorByToken rechaza (corte de señal): muestra mensaje de reintento, quita el loader y Reintentar vuelve a llamar', async () => {
    mockGetProveedorByToken.mockRejectedValueOnce(new Error('Network error / Conexión perdida'));

    const { host, cerrar } = await montar();

    // No debe tener el loader de carga activa
    expect(host.querySelector('.animate-spin')).toBeNull();

    // Debe mostrar el texto específico requerido
    expect(host.textContent).toContain('No pudimos abrir tu acceso. Revisá la conexión y tocá Reintentar');
    // NO debe mostrar "Acceso no disponible"
    expect(host.textContent).not.toContain('Acceso no disponible');

    // Botón de reintento
    const botonReintentar = host.querySelector('button');
    expect(botonReintentar).toBeTruthy();
    expect(botonReintentar?.textContent).toContain('Reintentar');

    // Al tocar Reintentar vuelve a llamar a getProveedorByToken
    mockGetProveedorByToken.mockResolvedValueOnce({
      success: true,
      data: {
        token: 'tok_test_123',
        nombreProveedor: 'DJ Sonido Pro',
        tipoProveedor: 'Sonido e Iluminación',
        estadoActual: 'Confirmado',
        horaLlegadaEstimada: '18:00',
        tareas: [],
        notas: '',
      },
    });

    await act(async () => {
      botonReintentar?.click();
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(mockGetProveedorByToken).toHaveBeenCalledTimes(2);
    expect(host.textContent).toContain('DJ Sonido Pro');

    cerrar();
  });

  test('con { success: false } muestra "Acceso no disponible" y no el error de conexión', async () => {
    mockGetProveedorByToken.mockResolvedValueOnce({
      success: false,
      error: 'El enlace venció o fue revocado.',
    });

    const { host, cerrar } = await montar();

    expect(host.querySelector('.animate-spin')).toBeNull();
    expect(host.textContent).toContain('Acceso no disponible');
    expect(host.textContent).toContain('El enlace venció o fue revocado.');
    expect(host.textContent).not.toContain('No pudimos abrir tu acceso. Revisá la conexión y tocá Reintentar');

    cerrar();
  });
});
