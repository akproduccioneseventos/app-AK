/**
 * Orden 333 — Bloque 4: Estaciones de la fiesta.
 *
 * Verifica comportamiento real de las pantallas de estaciones:
 * 1. Espejo Mágico y Vogue muestran "Guardada sin señal: se sube sola cuando vuelva" en cola offline
 *    y Vogue limpia `qrCodeUrl` en `resetLocalState`.
 * 2. Touchpix muestra cartel visible ante falla de subida o cola, y `QrModal` vive fuera del componente principal.
 * 3. Control de pantalla usa `CentroTriviaPanel` con preguntas reales de la fiesta, nunca "Opción 1..4".
 * 4. Búsqueda por cara espera 15000 ms para modelos; sin modelos, Galería dice
 *    "No pudimos activar la búsqueda por cara; probá de nuevo" y no busca por brillo ni con `fill(0.01)`.
 * 5. Zona digital pasa `guestId` y `token` en "Subir al muro".
 * 6. Barra stats no muestra "Stock estable" fijo y Barra offline conserva `version`.
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import fs from 'node:fs';
import path from 'node:path';

const leer = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), 'utf8');

let mockSearchParams = new URLSearchParams('guestId=inv_1&token=tok_1');
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: () => ({ fiestaId: 'fiesta_est_1' }),
  useRouter: () => ({ push: mockPush, back: mockBack, replace: jest.fn() }),
  useSearchParams: () => mockSearchParams,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => React.createElement('a', { href, ...rest }, children),
}));

jest.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, prop: string) => (props: any) => {
        const { initial, animate, exit, transition, whileInView, viewport, layoutId, ...domProps } = props;
        void initial;
        void animate;
        void exit;
        void transition;
        void whileInView;
        void viewport;
        void layoutId;
        return React.createElement(prop, domProps, props.children);
      },
    },
  ),
  AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock('@/components/legal/AvisoDeDatos', () => ({ AvisoDeDatos: () => null }));
jest.mock('@/components/privacidad/AvisoDeDatos', () => ({ AvisoDeDatos: () => null }));

const mockAsegurarModelosFaciales = jest.fn();
const mockExtraerDescriptorFacial = jest.fn();
jest.mock('@/lib/caras/extractor-facial', () => ({
  asegurarModelosFaciales: () => mockAsegurarModelosFaciales(),
  extraerDescriptorFacial: (...args: any[]) => mockExtraerDescriptorFacial(...args),
}));

const mockBuscarFotosDeUnaCara = jest.fn(() => ({ seguras: ['post_brillo'], dudosas: [] }));
jest.mock('@/lib/caras/agrupar-caras', () => {
  const actual = jest.requireActual('@/lib/caras/agrupar-caras');
  return {
    ...actual,
    buscarFotosDeUnaCara: (...args: any[]) => mockBuscarFotosDeUnaCara(...args),
  };
});

const mockGetPublicSocialEvent = jest.fn();
const mockGetPublicSocialPosts = jest.fn();
const mockBuscarmeEnLaGaleria = jest.fn();
jest.mock('@/app/actions/social-gallery', () => ({
  getPublicSocialEvent: (...args: any[]) => mockGetPublicSocialEvent(...args),
  getPublicSocialPosts: (...args: any[]) => mockGetPublicSocialPosts(...args),
  buscarmeEnLaGaleria: (...args: any[]) => mockBuscarmeEnLaGaleria(...args),
  registrarCaraInvitado: jest.fn(),
  borrarCaraInvitado: jest.fn(),
  obtenerMisFotosInvitado: jest.fn(async () => ({ success: false, posts: [] })),
  buscarInvitadoPorNombreExactoParaCara: jest.fn(),
  getSocialPosts: jest.fn(async () => []),
  moderateSocialPost: jest.fn(async () => ({ success: true })),
}));

const mockGetPublicGuestPortalData = jest.fn();
jest.mock('@/app/actions/public-guest-portal', () => ({
  getPublicGuestPortalData: (...args: any[]) => mockGetPublicGuestPortalData(...args),
}));

const mockGetBarraDashboard = jest.fn();
jest.mock('@/app/actions/fiesta/barra-tecnologica.actions', () => ({
  getBarraTecnologicaDashboard: (...args: any[]) => mockGetBarraDashboard(...args),
}));

const mockObtenerEstadoControlPantalla = jest.fn();
jest.mock('@/app/actions/fiesta/screen-mode.actions', () => ({
  obtenerEstadoControlPantalla: (...args: any[]) => mockObtenerEstadoControlPantalla(...args),
  obtenerEstadisticasEnVivo: jest.fn(async () => ({ success: true, stats: null })),
  nextScreenItem: jest.fn(async () => ({ success: true })),
  prevScreenItem: jest.fn(async () => ({ success: true })),
  playScreenPlaylist: jest.fn(async () => ({ success: true })),
  pauseScreenPlaylist: jest.fn(async () => ({ success: true })),
  goToScreenItem: jest.fn(async () => ({ success: true })),
  updateLedMessage: jest.fn(async () => ({ success: true })),
  launchGame: jest.fn(async () => ({ success: true })),
  clearActiveGame: jest.fn(async () => ({ success: true })),
  startSorteoSpinOnScreen: jest.fn(async () => ({ success: true })),
  sortearGanadorEnServidor: jest.fn(async () => ({ success: true })),
  getMuroParticipantesForSorteo: jest.fn(async () => ({ success: true, participantes: [] })),
}));

jest.mock('@/app/actions/social-live-stream', () => ({
  getLiveStreamRequestsForOperator: jest.fn(async () => ({ success: true, requests: [], featureEnabled: false })),
  acceptLiveStreamRequest: jest.fn(async () => ({ success: true })),
  rejectLiveStreamRequest: jest.fn(async () => ({ success: true })),
  stopLiveStreamRequest: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/app/actions/games.actions', () => ({
  generarTriviaConIa: jest.fn(async () => ({ success: true })),
  confirmarTrivia: jest.fn(async () => ({ success: true })),
  saveTriviaGame: jest.fn(async () => true),
  terminarTrivia: jest.fn(async () => ({ success: true })),
  revelarRespuestaTrivia: jest.fn(async () => ({ success: true })),
}));

import GaleriaPage from '@/app/evento/galeria/[fiestaId]/page';
import ZonaDigitalPublicPage from '@/app/evento/zona-digital/[fiestaId]/page';
import BarraStatsPage from '@/app/evento/barra/[fiestaId]/stats/page';
import ControlPantallaPage from '@/app/evento/control-pantalla/[fiestaId]/page';

async function montarComponente(Component: React.ComponentType) {
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  await act(async () => {
    root.render(React.createElement(Component));
  });
  await act(async () => {
    await new Promise((r) => setTimeout(r, 80));
  });
  return {
    host,
    desmontar: () => {
      act(() => root.unmount());
      host.remove();
    },
  };
}

beforeAll(() => {
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
});

afterAll(() => {
  Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
});

beforeEach(() => {
  jest.clearAllMocks();
  mockSearchParams = new URLSearchParams('guestId=inv_1&token=tok_1');
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    value: jest.fn().mockResolvedValue(undefined),
  });
  Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
    configurable: true,
    value: 640,
  });
  Object.defineProperty(HTMLMediaElement.prototype, 'readyState', {
    configurable: true,
    value: 4,
  });
});

describe('Orden 333 — Bloque 4: Estaciones de la fiesta', () => {
  it('Galería: sin modelos faciales, muestra "No pudimos activar la búsqueda por cara; probá de nuevo" y no busca por brillo', async () => {
    const extractorSrc = leer('src/lib/caras/extractor-facial.ts');
    expect(extractorSrc).toContain('15000');
    expect(extractorSrc).not.toMatch(/setTimeout\([^\n]+,\s*1500\)/);

    const galeriaSrc = leer('src/app/evento/galeria/[fiestaId]/page.tsx');
    expect(galeriaSrc).not.toContain('fill(0.01)');

    mockGetPublicSocialEvent.mockResolvedValue({
      id: 'fiesta_est_1',
      configuracion: { nombreEvento: 'XV de Camila', fechaEvento: '2026-11-21' },
      socialGallerySettings: { enabled: true, carasPreparadas: true },
    });
    mockGetPublicSocialPosts.mockResolvedValue([
      {
        id: 'post_1',
        fiestaId: 'fiesta_est_1',
        imageUrl: 'https://example.com/foto.jpg',
        authorName: 'Camila',
        likes: 0,
        comments: [],
        createdAt: '2026-11-21T20:00:00Z',
        sourceModule: 'fotocabina',
      },
    ]);
    mockBuscarmeEnLaGaleria.mockResolvedValue({
      success: true,
      seguras: ['post_brillo'],
      dudosas: [],
      fotoIds: ['post_brillo'],
    });
    mockAsegurarModelosFaciales.mockResolvedValue(false);
    mockExtraerDescriptorFacial.mockResolvedValue(null);

    const stopTrack = jest.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{ stop: stopTrack }],
        }),
      },
    });

    const { host, desmontar } = await montarComponente(GaleriaPage);
    try {
      const btnEncontrame = Array.from(host.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Encontrame a mí'),
      );
      expect(btnEncontrame).toBeDefined();
      await act(async () => {
        btnEncontrame!.click();
      });

      const btnAceptar = Array.from(host.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Entendido, buscar mis fotos'),
      );
      expect(btnAceptar).toBeDefined();
      await act(async () => {
        btnAceptar!.click();
        await new Promise((r) => setTimeout(r, 80));
      });

      expect(host.textContent).toContain('No pudimos activar la búsqueda por cara; probá de nuevo');
      expect(mockBuscarFotosDeUnaCara).not.toHaveBeenCalled();
      expect(stopTrack).toHaveBeenCalled();
    } finally {
      desmontar();
    }
  });

  it('Zona digital: "Subir al muro" lleva guestId y token', async () => {
    mockGetPublicGuestPortalData.mockResolvedValue({
      fiesta: {
        id: 'fiesta_est_1',
        configuracion: { nombreEvento: 'XV de Camila', fechaEvento: '2026-11-21' },
        zonaDigitalAdolescentes: { enabled: true },
        modulosContratados: [],
      },
      guest: { id: 'inv_1', nombre: 'Lucía' },
      entertainmentLinks: [],
    });

    const { host, desmontar } = await montarComponente(ZonaDigitalPublicPage);
    try {
      const linkMuro = Array.from(host.querySelectorAll('a')).find((a) =>
        a.textContent?.includes('Subir al muro'),
      );
      expect(linkMuro).toBeDefined();
      const href = linkMuro!.getAttribute('href') || '';
      expect(href).toContain('/evento/social/fiesta_est_1');
      expect(href).toContain('guestId=inv_1');
      expect(href).toContain('token=tok_1');
    } finally {
      desmontar();
    }
  });

  it('Barra stats: nunca muestra "Stock estable" fijo y muestra stock real cuando existe', async () => {
    mockGetBarraDashboard.mockResolvedValue({
      success: true,
      data: {
        fiestaId: 'fiesta_est_1',
        eventName: 'XV de Camila',
        orders: [],
        drinks: [{ id: 'd1', nombre: 'Fernet' }],
        settings: {},
      },
    });

    const sinStock = await montarComponente(BarraStatsPage);
    try {
      expect(sinStock.host.textContent).not.toContain('Stock estable');
    } finally {
      sinStock.desmontar();
    }

    mockGetBarraDashboard.mockResolvedValue({
      success: true,
      data: {
        fiestaId: 'fiesta_est_1',
        eventName: 'XV de Camila',
        orders: [],
        drinks: [{ id: 'd1', nombre: 'Daiquiri', stockDisponible: 2 }],
        settings: {},
      },
    });

    const conStock = await montarComponente(BarraStatsPage);
    try {
      expect(conStock.host.textContent).not.toContain('Stock estable');
      expect(conStock.host.textContent).toContain('Daiquiri');
      expect(conStock.host.textContent).toContain('2 disp.');
    } finally {
      conStock.desmontar();
    }

    const barraSrc = leer('src/app/evento/barra/[fiestaId]/page.tsx');
    expect(barraSrc).toContain('version: drinkVersion');
    expect(barraSrc).toContain('version: action.payload.version');
  });

  it('Control de pantalla: usa CentroTriviaPanel con las preguntas reales de la fiesta y nunca "Opción 1..4"', async () => {
    mockObtenerEstadoControlPantalla.mockResolvedValue({
      success: true,
      authorized: true,
      fiestaNombre: 'XV de Camila',
      isPlaying: true,
      playlist: [],
      ledMarqueeText: '',
      activeGame: null,
      triviaGame: {
        id: 'trivia_real_1',
        fiestaId: 'fiesta_est_1',
        title: 'Trivia de Camila',
        status: 'active',
        confirmadaPorEquipo: true,
        createdAt: '2026-11-21T18:00:00Z',
        questions: [
          {
            id: 'q_real_1',
            question: '¿En qué club juega Camila al hockey?',
            options: [
              { id: 'a', text: 'Salto Grande' },
              { id: 'b', text: 'Universitario' },
            ],
            correctOptionId: 'a',
          },
        ],
      },
      triviaRanking: [],
    });

    const { host, desmontar } = await montarComponente(ControlPantallaPage);
    try {
      const texto = host.textContent || '';
      const inputs = Array.from(host.querySelectorAll('input')).map((i) => i.value);
      expect(inputs.join(' ')).toContain('¿En qué club juega Camila al hockey?');
      expect(inputs.join(' ')).toContain('Salto Grande');
      expect(texto).not.toContain('Opción 1');
      expect(texto).not.toContain('Opción 2');
    } finally {
      desmontar();
    }
  });

  it('Espejo Mágico, Vogue y Touchpix: cola sin señal, limpieza de QR en Vogue y cartel de error / QrModal en Touchpix', () => {
    const espejoSrc = leer('src/app/evento/espejo-magico/[fiestaId]/page.tsx');
    expect(espejoSrc).toContain('Guardada sin señal: se sube sola cuando vuelva');

    const vogueSrc = leer('src/app/evento/bogue/[fiestaId]/page.tsx');
    expect(vogueSrc).toContain('Guardada sin señal: se sube sola cuando vuelva');
    const resetIdx = vogueSrc.indexOf('const resetLocalState');
    const resetEnd = vogueSrc.indexOf('const completeGuestCycle');
    expect(resetIdx).toBeGreaterThan(-1);
    expect(vogueSrc.slice(resetIdx, resetEnd)).toContain("setQrCodeUrl('')");

    const touchpixSrc = leer('src/app/evento/touchpix/[fiestaId]/page.tsx');
    const compIdx = touchpixSrc.indexOf('export default function TouchpixPage');
    const qrModalIdx = touchpixSrc.indexOf('function QrModal');
    expect(qrModalIdx).toBeGreaterThan(-1);
    expect(qrModalIdx).toBeLessThan(compIdx);
    expect(touchpixSrc).toContain('setUploadError(');
    expect(touchpixSrc).toContain('data-testid="touchpix-upload-error"');
  });
});
