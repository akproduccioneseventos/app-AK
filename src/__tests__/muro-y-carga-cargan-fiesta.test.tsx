/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

const mockGetFiestaParaPantalla = jest.fn();
const mockGetFiestaById = jest.fn();
const mockGetGlobalScreenMediaLibrary = jest.fn();
const mockGetActivePoll = jest.fn();
const mockGetSocialPosts = jest.fn();
const mockGetActivosFijos = jest.fn();
const mockGetCargaOperativaMasterTemplate = jest.fn();
const mockCheckAssetConflicts = jest.fn();
const mockToast = jest.fn();
const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();

const stableRouter = { push: mockRouterPush, replace: mockRouterReplace, back: jest.fn() };
const stableToast = { toast: mockToast };
const stableSearchParams = new URLSearchParams('fiestaId=fiesta_valida_1');

jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => () => null,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

jest.mock('next/navigation', () => ({
  usePathname: () => '/fiestas/nueva/operacion',
  useParams: () => ({ id: 'fiesta_valida_1', fiestaId: 'fiesta_valida_1' }),
  useSearchParams: () => stableSearchParams,
  useRouter: () => stableRouter,
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => stableToast,
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaParaPantalla: (...args: unknown[]) => mockGetFiestaParaPantalla(...args),
  getFiestaById: (...args: unknown[]) => mockGetFiestaById(...args),
}));

jest.mock('@/app/actions/fiesta-actual', () => ({
  getFiestaById: (...args: unknown[]) => mockGetFiestaById(...args),
  updateSocialGallerySettingsFiestaActual: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/app/actions/social-gallery', () => ({
  getSocialPosts: (...args: unknown[]) => mockGetSocialPosts(...args),
  clearGallery: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/components/social-gallery/PrepararGrillaDeCara', () => ({
  PrepararGrillaDeCara: () => null,
}));

jest.mock('@/app/actions/fiesta/screen-mode.actions', () => ({
  getGlobalScreenMediaLibrary: (...args: unknown[]) => mockGetGlobalScreenMediaLibrary(...args),
  uploadScreenMediaAsset: jest.fn(async () => ({ success: true })),
  playScreenPlaylist: jest.fn(async () => ({ success: true })),
  pauseScreenPlaylist: jest.fn(async () => ({ success: true })),
  nextScreenItem: jest.fn(async () => ({ success: true })),
  prevScreenItem: jest.fn(async () => ({ success: true })),
  setScreenLoop: jest.fn(async () => ({ success: true })),
  updateLedMessage: jest.fn(async () => ({ success: true })),
  updateLedConfig: jest.fn(async () => ({ success: true })),
  triggerLiveMoment: jest.fn(async () => ({ success: true })),
  updateScreenBrand: jest.fn(async () => ({ success: true })),
  launchGame: jest.fn(async () => ({ success: true })),
  clearActiveGame: jest.fn(async () => ({ success: true })),
  sortearGanadorEnServidor: jest.fn(async () => ({ success: true, winner: 'Ana' })),
  startSorteoSpinOnScreen: jest.fn(async () => ({ success: true })),
  transferSorteoToScreen: jest.fn(async () => ({ success: true })),
  getMuroParticipantesForSorteo: jest.fn(async () => ({ success: true, participantes: [] })),
}));

jest.mock('@/app/actions/social-interactive', () => ({
  createPoll: jest.fn(async () => ({ success: true })),
  closePoll: jest.fn(async () => ({ success: true })),
  getActivePoll: (...args: unknown[]) => mockGetActivePoll(...args),
}));

jest.mock('@/app/actions/games.actions', () => ({
  revelarRespuestaTrivia: jest.fn(async () => ({ success: true })),
  terminarTrivia: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/app/actions/fiesta/invitados.actions', () => ({
  getInvitados: jest.fn(async () => []),
}));

jest.mock('@/app/actions/activos-fijos', () => ({
  getActivosFijos: (...args: unknown[]) => mockGetActivosFijos(...args),
}));

jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestoById: jest.fn(async () => null),
}));

jest.mock('@/app/actions/fiesta/carga-operativa.actions', () => ({
  getCargaOperativaAccessView: jest.fn(async () => ({ success: false })),
  getCargaOperativaMasterTemplate: (...args: unknown[]) => mockGetCargaOperativaMasterTemplate(...args),
  checkAssetConflicts: (...args: unknown[]) => mockCheckAssetConflicts(...args),
  updateCargaOperativaItemState: jest.fn(async () => ({ success: true })),
  updateListaDeCargaOperativa: jest.fn(async () => ({ success: true })),
  generateCargaFromActivos: jest.fn(async () => ({ success: true })),
}));

import MuroSocialPage from '@/components/fiestas/panels/muro-social';
import ListaDeCargaOperativaPage from '@/components/fiestas/panels/carga-operativa';

const FIESTA_VALIDA = {
  id: 'fiesta_valida_1',
  configuracion: {
    nombreEvento: 'Boda Ana y Lucas',
    fechaEvento: '2026-12-12',
    invitadosEstimados: 120,
  },
  modulosContratados: {
    socialGallery: true,
    cargaOperativa: true,
  },
  socialGallerySettings: {
    enabled: true,
    allowLikes: true,
    allowComments: true,
    uploadsActive: true,
    chatEnabled: true,
    showPolls: true,
    showSongRequests: true,
    showDedications: true,
  },
  listaDeCargaOperativa: {
    id: 'lista_1',
    name: 'Carga Principal',
    notasGenerales: '',
    categorias: [
      {
        id: 'cat_sonido',
        nombre: 'Sonido Principal',
        items: [
          {
            id: 'item_consola',
            nombre: 'Consola Digital X32',
            cantidad: '1',
            unidad: 'Uds.',
            cargado: false,
            retornado: false,
          },
        ],
      },
    ],
  },
};

async function flushRender() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 80));
  });
}

describe('Bloque 7: Muro social y Carga operativa cargan el evento y reportan fallos con referencia', () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGetFiestaParaPantalla.mockReset();
    mockGetFiestaById.mockReset();
    mockGetGlobalScreenMediaLibrary.mockReset();
    mockGetActivePoll.mockReset();
    mockGetSocialPosts.mockReset();
    mockGetActivosFijos.mockReset();
    mockGetCargaOperativaMasterTemplate.mockReset();
    mockCheckAssetConflicts.mockReset();
    mockToast.mockReset();

    mockGetFiestaParaPantalla.mockResolvedValue({ fiesta: FIESTA_VALIDA, fallo: false });
    mockGetFiestaById.mockResolvedValue(FIESTA_VALIDA);
    mockGetGlobalScreenMediaLibrary.mockResolvedValue([]);
    mockGetActivePoll.mockResolvedValue(null);
    mockGetSocialPosts.mockResolvedValue([]);
    mockGetActivosFijos.mockResolvedValue([]);
    mockGetCargaOperativaMasterTemplate.mockResolvedValue({ id: 'master', name: 'Master', categorias: [] });
    mockCheckAssetConflicts.mockImplementation(async (_id, _date, items) => items);

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    jest.restoreAllMocks();
  });

  test('con un evento válido, muro-social carga su contenido real', async () => {
    await act(async () => {
      root.render(<MuroSocialPage />);
    });
    await flushRender();

    expect(container.textContent).toContain('Panel de Muro Social & Juegos');
    expect(container.textContent).toContain('Boda Ana y Lucas');
    expect(container.textContent).toContain('Control rápido');
    expect(container.textContent).not.toContain('No se pudo cargar la fiesta');
  });

  test('con un evento válido, carga-operativa carga su contenido real', async () => {
    await act(async () => {
      root.render(<ListaDeCargaOperativaPage />);
    });
    await flushRender();

    expect(container.textContent).toContain('Carga Operativa — Control de Logística');
    expect(container.textContent).toContain('Sonido Principal');
    expect(container.textContent).toContain('Consola Digital X32');
    expect(container.textContent).not.toContain('No se pudo cargar la lista de carga operativa');
  });

  test('si falla getGlobalScreenMediaLibrary, muro-social degrada con aviso y no bloquea la fiesta', async () => {
    mockGetGlobalScreenMediaLibrary.mockRejectedValueOnce(new Error('Tu usuario no tiene acceso a las fiestas.'));

    await act(async () => {
      root.render(<MuroSocialPage />);
    });
    await flushRender();

    expect(container.textContent).toContain('Boda Ana y Lucas');
    expect(container.textContent).toContain('Control rápido');
    expect(container.textContent).toMatch(/biblioteca global de medios.*Ref: ERR-MURO-LIB-/i);
    expect(container.textContent).not.toContain('No se pudo cargar la fiesta');
  });

  test('si fallan activos o conflictos de stock, carga-operativa carga igual la lista con aviso', async () => {
    mockGetActivosFijos.mockRejectedValueOnce(new Error('Tu perfil no tiene acceso a esta parte.'));
    mockCheckAssetConflicts.mockRejectedValueOnce(new Error('Tiempo de espera agotado'));

    await act(async () => {
      root.render(<ListaDeCargaOperativaPage />);
    });
    await flushRender();

    expect(container.textContent).toContain('Sonido Principal');
    expect(container.textContent).toContain('Consola Digital X32');
    expect(container.textContent).toMatch(/Ref: ERR-CARGA-ACT-/);
    expect(container.textContent).toMatch(/Ref: ERR-CARGA-CONF-/);
  });

  test('cuando el servidor devuelve fallo con motivo y código, muro-social lo muestra con Reintentar y sin datos privados', async () => {
    mockGetFiestaParaPantalla.mockResolvedValueOnce({
      fiesta: null,
      fallo: true,
      motivo: 'Tu sesión venció o no está autorizada. Volvé a iniciar sesión.',
      codigoError: 'ERR-SES-9A2B',
    });

    await act(async () => {
      root.render(<MuroSocialPage />);
    });
    await flushRender();

    expect(container.textContent).toContain('No se pudo cargar la fiesta');
    expect(container.textContent).toContain('Tu sesión venció o no está autorizada. Volvé a iniciar sesión.');
    expect(container.textContent).toContain('ERR-SES-9A2B');
    expect(container.textContent).toContain('Reintentar');
    expect(container.textContent).not.toMatch(/@|accessKey|privateKey/i);
  });

  test('cuando el servidor devuelve fallo con motivo y código, carga-operativa lo muestra con Reintentar y sin datos privados', async () => {
    mockGetFiestaParaPantalla.mockResolvedValueOnce({
      fiesta: null,
      fallo: true,
      motivo: 'La base de datos tardó demasiado en responder. Reintentá en unos segundos.',
      codigoError: 'ERR-READ-7C4D',
    });

    await act(async () => {
      root.render(<ListaDeCargaOperativaPage />);
    });
    await flushRender();

    expect(container.textContent).toContain('No se pudo cargar la lista de carga operativa');
    expect(container.textContent).toContain('La base de datos tardó demasiado en responder. Reintentá en unos segundos.');
    expect(container.textContent).toContain('ERR-READ-7C4D');
    expect(container.textContent).toContain('Reintentar');
    expect(container.textContent).not.toMatch(/@|accessKey|privateKey/i);
  });
});
