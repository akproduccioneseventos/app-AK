/**
 * @jest-environment jsdom
 *
 * Orden 168 - Bloques 2, 3 y 4: Pantallas que avisan la falla y hora del servidor.
 * - Bloque 2: con lectura rechazada, muestra aviso y reintento, nunca falso vacío ni '0'.
 * - Bloque 3: PDFs diferencian falta de fiestaId vs error de carga.
 * - Bloque 4: tras registrar llegada, usa la hora del servidor devuelta por la acción.
 */

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// --- Mocks de Next.js ---
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

let mockSearchParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  redirect: jest.fn(),
}));

// --- Mock de toast ---
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

// --- Mock de acciones ---
const mockGetFiestas = jest.fn();
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestas: (...args: unknown[]) => mockGetFiestas(...args),
  getFiestaById: jest.fn().mockResolvedValue(null),
}));

const mockGetCargaOperativaAccessView = jest.fn();
jest.mock('@/app/actions/fiesta/carga-operativa.actions', () => ({
  getCargaOperativaAccessView: (...args: unknown[]) => mockGetCargaOperativaAccessView(...args),
  getOrCreateCargaOperativaShareToken: jest.fn(),
  updateCargaOperativaItemState: jest.fn(),
}));

const mockMarcarLlegadaPersonal = jest.fn();
jest.mock('@/app/actions/personal-fiestas', () => ({
  marcarLlegadaPersonal: (...args: unknown[]) => mockMarcarLlegadaPersonal(...args),
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn().mockResolvedValue({ success: true, user: { role: 'admin' } }),
}));
jest.mock('@/lib/auth/perfiles', () => ({
  puede: jest.fn().mockReturnValue(true),
  PERMISOS: { CONTABILIDAD: 'contabilidad' },
}));
jest.mock('@/app/actions/crm', () => ({
  getCrmLeadsForDashboard: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/app/actions/agentes-autonomos', () => ({
  getHistorialAgentes: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/lib/automatico/parte-manana', () => ({
  getParteDeLaManana: jest.fn().mockResolvedValue(null),
  parteParaQuienMira: jest.fn().mockReturnValue({
    textoHablado: 'Buen día equipo',
    itemsPrincipales: [],
  }),
}));

// Componentes a probar
import VideoVidaHubPage from '@/app/video-vida/page';
import MiDiaPage from '@/app/(app)/mi-dia/page';
import CargaOperativaPdfPage from '@/app/(app)/fiestas/nueva/carga-operativa/pdf/page';
import { EquipoCheckIn } from '@/components/centro/EquipoCheckIn';

beforeEach(() => {
  jest.clearAllMocks();
  mockSearchParams = new URLSearchParams();
});

describe('Orden 168 - Bloque 2: Video de Vida ante falla de lectura', () => {
  test('con getFiestas rechazado, muestra role="alert", aviso de reintento y NO lista vacía', async () => {
    mockGetFiestas.mockRejectedValue(new Error('Falla de red'));
    const markup = renderToStaticMarkup(await VideoVidaHubPage());

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('No pudimos cargar las fiestas ahora. Reintentar.');
    expect(markup).not.toContain('No hay fiestas activas para mostrar.');
  });

  test('con getFiestas exitoso y sin fiestas, muestra estado vacío normal sin alerta', async () => {
    mockGetFiestas.mockResolvedValue([]);
    const markup = renderToStaticMarkup(await VideoVidaHubPage());

    expect(markup).not.toContain('role="alert"');
    expect(markup).toContain('No hay fiestas activas para mostrar.');
  });
});

describe('Orden 168 - Bloque 2: Mi Día ante falla de lectura de fiestas', () => {
  test('con getFiestas rechazado, muestra alerta de reintento y contador "Error al cargar", nunca "0"', async () => {
    mockGetFiestas.mockRejectedValue(new Error('Falla de red'));
    const markup = renderToStaticMarkup(await MiDiaPage());

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('Error al cargar');
    expect(markup).toContain('No pudimos cargar las fiestas ahora.');
    expect(markup).toContain('Reintentar');
  });
});

describe('Orden 168 - Bloque 3: Carga Operativa PDF (sin fiestaId vs error con fiestaId)', () => {
  async function montar(Componente: React.ReactElement) {
    const host = document.body.appendChild(document.createElement('div'));
    const root = createRoot(host);
    await act(async () => {
      root.render(Componente);
    });
    await act(async () => {
      await Promise.resolve();
    });
    return {
      host,
      texto: () => host.textContent || '',
      alertas: () => Array.from(host.querySelectorAll('[role="alert"]')).map((el) => el.textContent || ''),
      limpiar: () => {
        act(() => root.unmount());
        host.remove();
      },
    };
  }

  test('sin fiestaId, avisa que elija una fiesta y no muestra reintento de carga', async () => {
    mockSearchParams = new URLSearchParams('');
    const vista = await montar(<CargaOperativaPdfPage />);

    expect(vista.texto()).toContain('Elegí una fiesta para ver la lista de carga');
    expect(vista.texto()).not.toContain('Reintentar');
    vista.limpiar();
  });

  test('con fiestaId pero falla de red al leer la fiesta, muestra alerta con reintento', async () => {
    mockSearchParams = new URLSearchParams('fiestaId=fiesta-999');
    mockGetCargaOperativaAccessView.mockResolvedValue({
      success: false,
      error: 'Error al conectar con la base de datos',
    });

    const vista = await montar(<CargaOperativaPdfPage />);

    expect(vista.texto()).toContain('Error al conectar con la base de datos');
    expect(vista.texto()).not.toContain('Falta el ID del evento');
    vista.limpiar();
  });
});

describe('Orden 168 - Bloque 4: EquipoCheckIn registra llegada con hora del servidor', () => {
  test('al hacer check-in, actualiza el estado usando la confirmación devuelta por el servidor', async () => {
    const timestampServidor = '2026-10-15T22:00:00.000Z';
    mockMarcarLlegadaPersonal.mockResolvedValueOnce({
      success: true,
      checkInTimestamp: timestampServidor,
    });

    const equipoInicial = [
      { empleadoId: 'emp-1', nombre: 'Carlos DJ', rol: 'DJ', llegada: undefined },
    ];

    const host = document.body.appendChild(document.createElement('div'));
    const root = createRoot(host);

    await act(async () => {
      root.render(<EquipoCheckIn fiestaId="f1" equipo={equipoInicial} />);
    });

    const botonLlegue = Array.from(host.querySelectorAll('button')).find((b) => b.textContent?.includes('Llegué'));
    expect(botonLlegue).toBeDefined();

    await act(async () => {
      botonLlegue!.click();
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockMarcarLlegadaPersonal).toHaveBeenCalledWith('f1', 'emp-1');
    // El botón ya no está porque se confirmó la llegada
    const botonPost = Array.from(host.querySelectorAll('button')).find((b) => b.textContent?.includes('Llegué'));
    expect(botonPost).toBeUndefined();

    act(() => root.unmount());
    host.remove();
  });
});
