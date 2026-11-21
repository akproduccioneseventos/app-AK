/** @jest-environment jsdom */
import React, { act } from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { createRoot, type Root } from 'react-dom/client';
import {
  FONDOS_INVITACION,
  aplicarFondoAConfig,
  getFondosPorTipo,
  type TipoFiestaFondo,
} from '@/lib/invitacion/fondos-invitacion';
import { buildAccesosVivosInvitacion } from '@/lib/invitacion/accesos-vivos';
import { InvitacionPublicaClient } from '@/app/invitacion/[fiestaId]/invitacion-publica-client';
import { defaultInvitacionConfig, buildInvitacionConfigFromFiesta } from '@/lib/invitacion-config-defaults';
import { armarAlbumInteligente } from '@/lib/album/armar-album';
import {
  getMotionVariantsParaTransicion,
  getTransicionMuroClass,
  normalizarTransicionMuro,
  TRANSICIONES_MURO,
} from '@/lib/social-fiesta/transiciones-muro';
import { hoyEnUruguay } from '@/lib/utils';
import type { FiestaEnPlanificacion, InvitacionDigitalConfig } from '@/types/fiesta';
import type { SocialGalleryPost } from '@/types/social-gallery';

/* eslint-disable @next/next/no-img-element */
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img alt={props.alt ?? ''} {...props} />,
}));

jest.mock('@/components/ui/imagen-con-respaldo', () => ({
  ImagenConRespaldo: (props: any) => <img alt={props.alt ?? ''} {...props} />,
}));

jest.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag: string) => {
        return ({ children, initial, animate, exit, transition, whileInView, viewport, whileHover, whileTap, variants, ...props }: any) => {
          const Tag = tag as any;
          return <Tag {...props}>{children}</Tag>;
        };
      },
    }
  ),
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useMotionValue: () => ({ get: () => 0, set: () => {} }),
  useTransform: () => ({ get: () => 0 }),
}));

jest.mock('@/components/invitacion/SplashScreen', () => ({
  SplashScreen: () => null,
}));

jest.mock('@/components/invitacion/xv-theme-effects', () => ({
  XVThemeEffects: () => null,
}));

jest.mock('@/app/actions/fiesta/invitados.actions', () => ({
  submitPublicRsvp: jest.fn(),
}));

const mockGetPublicSocialPosts = jest.fn();
const mockGetPublicSocialEvent = jest.fn();

jest.mock('@/app/actions/social-gallery', () => ({
  getPublicSocialPosts: (...args: any[]) => mockGetPublicSocialPosts(...args),
  getPublicSocialEvent: (...args: any[]) => mockGetPublicSocialEvent(...args),
  getChatMessages: jest.fn().mockResolvedValue([]),
  getPublicInstagramFeedAction: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/app/actions/social-interactive', () => ({
  getActivePoll: jest.fn().mockResolvedValue(null),
  getDedications: jest.fn().mockResolvedValue([]),
  getSongRequests: jest.fn().mockResolvedValue([]),
  getPublicLiveReactions: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/app/actions/settings', () => ({
  getCompanyInfoPublica: jest.fn().mockResolvedValue({ nombre: 'AK Producciones' }),
  getInvoiceTemplateSettings: jest.fn().mockResolvedValue({}),
}));

jest.mock('@/app/actions/social-connections', () => ({
  getSocialConnectionsPublicas: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/hooks/use-pantalla-prendida', () => ({
  usePantallaPrendida: () => undefined,
}));

jest.mock('next/navigation', () => ({
  useParams: () => ({ fiestaId: 'fiesta-323' }),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useSearchParams: () => new URLSearchParams('fiestaId=fiesta-323'),
}));

jest.mock('@/components/evento/CrowdSyncShow', () => ({
  CrowdSyncShow: () => null,
}));

jest.mock('qrcode.react', () => ({
  QRCodeSVG: () => <div data-testid="qr-mock" />,
  QRCodeCanvas: () => <canvas data-testid="qr-canvas-mock" />,
}));

import MuroEnVivoPage from '@/app/evento/muro-en-vivo/[fiestaId]/page';

describe('Orden 323 - Bloques 1, 2, 3, 4 y 7', () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeAll(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    window.HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.pause = jest.fn();
  });

  afterAll(() => {
    Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    jest.clearAllMocks();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  // ── BLOQUE 1 ───────────────────────────────────────────────────────────────
  describe('Bloque 1: Un solo armador en 3 pasos con datos reales', () => {
    it('carga los datos reales de la fiesta sin "María y Juan" y pagina-web tiene los 3 pasos + Ver como invitado', () => {
      const fiestaReal = {
        id: 'fiesta-camila',
        configuracion: {
          nombreEvento: 'XV de Camila',
          protagonista1Nombre: 'Camila',
          protagonista2Nombre: '',
          tipoCelebracion: 'XV años',
          fechaEvento: '2026-12-20',
          horaInicio: '21:30',
          nombreLugar: 'Salón Horizonte',
          direccionLugar: 'Av. Artigas 500',
          googleMapsUrl: 'https://maps.google.com/?q=salto',
          primaryColor: '#db2777',
        },
      } as unknown as FiestaEnPlanificacion;

      const config = buildInvitacionConfigFromFiesta(fiestaReal);
      expect(config.nombreHomenajeada).toBe('Camila');
      expect(config.nombreSalon).toBe('Salón Horizonte');
      expect(config.fechaEvento).toBe('2026-12-20');
      expect(config.horaEvento).toBe('21:30');
      expect(JSON.stringify(config)).not.toContain('María');
      expect(JSON.stringify(config)).not.toContain('Juan');

      const paginaWebSrc = fs.readFileSync(
        path.join(process.cwd(), 'src/components/fiestas/panels/pagina-web.tsx'),
        'utf8'
      );
      expect(paginaWebSrc).toContain('1. Diseño');
      expect(paginaWebSrc).toContain('2. Datos');
      expect(paginaWebSrc).toContain('3. Estilo');
      expect(paginaWebSrc).toContain('Ver como invitado');
      expect(paginaWebSrc).toContain('<InvitacionPublicaClient');
    });
  });

  // ── BLOQUE 2 ───────────────────────────────────────────────────────────────
  describe('Bloque 2: Biblioteca de fondos (>= 40 por tipo, mitad quietos y mitad animados)', () => {
    const tipos: TipoFiestaFondo[] = ['15', 'boda', 'cumpleanos', 'empresa'];

    it.each(tipos)('tiene al menos 40 fondos para %s (mitad quietos y mitad en movimiento)', (tipo) => {
      const todos = getFondosPorTipo(tipo, 'todos');
      const quietos = getFondosPorTipo(tipo, 'quieto');
      const animados = getFondosPorTipo(tipo, 'animado');

      expect(todos.length).toBeGreaterThanOrEqual(40);
      expect(quietos.length).toBeGreaterThanOrEqual(20);
      expect(animados.length).toBeGreaterThanOrEqual(20);

      for (const fondo of todos) {
        expect(fondo.paletaSugerida.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(fondo.paletaSugerida.secondary).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(fondo.paletaSugerida.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
        if (fondo.imagenUrl) {
          const absPath = path.join(process.cwd(), 'public', fondo.imagenUrl.replace(/^\//, ''));
          expect(fs.existsSync(absPath)).toBe(true);
        }
      }
    });

    it('aplica el fondo y su paleta sugerida en un toque y se refleja en InvitacionPublicaClient', async () => {
      const fondoElegido = FONDOS_INVITACION.find((f) => f.id === '15-a-aurora-xv')!;
      expect(fondoElegido).toBeDefined();

      const updatedConfig = aplicarFondoAConfig(
        { ...defaultInvitacionConfig, nombreHomenajeada: 'Lucía' },
        fondoElegido,
        true
      );
      expect(updatedConfig.fondoId).toBe(fondoElegido.id);
      expect(updatedConfig.colorPrincipal).toBe(fondoElegido.paletaSugerida.primary);

      await act(async () => {
        root.render(
          <InvitacionPublicaClient
            config={updatedConfig}
            fiestaId="fiesta-fondo"
            isEditorMode={true}
          />
        );
      });

      const rootNode = container.querySelector('[data-fondo-id="15-a-aurora-xv"]');
      expect(rootNode).not.toBeNull();
      const cssFondo = container.querySelector('[data-testid="invitacion-fondo-css"]');
      expect(cssFondo).not.toBeNull();
      expect(cssFondo?.className).toContain('ak-inv-bg-aurora');
    });
  });

  // ── BLOQUE 3 ───────────────────────────────────────────────────────────────
  describe('Bloque 3: Invitación viva el día de la fiesta y post-evento', () => {
    it('muestra Subir fotos, Buscar mi mesa y Menú digital cuando es hoy y están habilitados', async () => {
      const hoy = hoyEnUruguay();
      const fiestaHoy = {
        id: 'fiesta-hoy',
        modulosContratados: {
          muroSocial: true,
          disenoSalon: true,
          invitados: true,
          catering: true,
          menuMesa: true,
        },
        socialGallerySettings: { enabled: true },
        menuAsignadoId: 'menu-1',
        zonaDigitalAdolescentes: {
          enabled: true,
          features: [{ id: 'muro_social', label: 'Muro', description: '', enabled: true, visibleForGuests: true }],
        },
      } as unknown as FiestaEnPlanificacion;

      const accesos = buildAccesosVivosInvitacion(fiestaHoy, 'fiesta-hoy');
      expect(accesos.muroSocialActivo).toBe(true);
      expect(accesos.miMesaActivo).toBe(true);
      expect(accesos.menuDigitalActivo).toBe(true);

      const configHoy: InvitacionDigitalConfig = {
        ...defaultInvitacionConfig,
        nombreHomenajeada: 'Sofía',
        fechaEvento: hoy,
        contadorActivo: true,
      };

      await act(async () => {
        root.render(
          <InvitacionPublicaClient
            config={configHoy}
            fiestaId="fiesta-hoy"
            isEditorMode={true}
            accesosVivos={accesos}
          />
        );
      });

      const texto = container.textContent || '';
      expect(texto).toContain('¡Es hoy!');
      expect(texto).toContain('Subir fotos');
      expect(texto).toContain('Buscar mi mesa');
      expect(texto).toContain('Menú digital');
      expect(container.querySelector('a[href="/evento/social/fiesta-hoy"]')).not.toBeNull();
      expect(container.querySelector('a[href="/evento/mi-mesa/fiesta-hoy"]')).not.toBeNull();
    });

    it('oculta Subir fotos si el interruptor de muro_social está apagado en zona digital', async () => {
      const hoy = hoyEnUruguay();
      const fiestaSinMuro = {
        id: 'fiesta-sin-muro',
        modulosContratados: { muroSocial: true, disenoSalon: true, invitados: true },
        socialGallerySettings: { enabled: true },
        zonaDigitalAdolescentes: {
          enabled: true,
          features: [
            { id: 'muro_social', label: 'Muro', description: '', enabled: false, visibleForGuests: false },
          ],
        },
      } as unknown as FiestaEnPlanificacion;

      const accesos = buildAccesosVivosInvitacion(fiestaSinMuro, 'fiesta-sin-muro');
      expect(accesos.muroSocialActivo).toBe(false);

      await act(async () => {
        root.render(
          <InvitacionPublicaClient
            config={{ ...defaultInvitacionConfig, nombreHomenajeada: 'Sofía', fechaEvento: hoy }}
            fiestaId="fiesta-sin-muro"
            isEditorMode={true}
            accesosVivos={accesos}
          />
        );
      });

      const texto = container.textContent || '';
      expect(texto).toContain('¡Es hoy!');
      expect(texto).not.toContain('Subir fotos');
      expect(container.querySelector('a[href="/evento/social/fiesta-sin-muro"]')).toBeNull();
      expect(texto).toContain('Buscar mi mesa');
    });

    it('muestra Álbum y Recap cuando la fiesta ya pasó', async () => {
      const accesos = buildAccesosVivosInvitacion(
        { id: 'fiesta-pasada', modulosContratados: { muroSocial: true } } as unknown as FiestaEnPlanificacion,
        'fiesta-pasada'
      );

      await act(async () => {
        root.render(
          <InvitacionPublicaClient
            config={{ ...defaultInvitacionConfig, nombreHomenajeada: 'Mateo', fechaEvento: '2020-01-10' }}
            fiestaId="fiesta-pasada"
            isEditorMode={true}
            accesosVivos={accesos}
          />
        );
      });

      expect(container.querySelector('[data-testid="invitacion-post-evento"]')).not.toBeNull();
      expect(container.textContent).toContain('Ver álbum de recuerdos');
      expect(container.textContent).toContain('Ver recap del evento');
    });
  });

  // ── BLOQUE 4 ───────────────────────────────────────────────────────────────
  describe('Bloque 4: Transiciones elegibles en pantalla gigante', () => {
    it('soporta las 5 transiciones y actualiza el muro dinámicamente sin recargar', async () => {
      expect(TRANSICIONES_MURO.map((t) => t.id)).toEqual([
        'fundido',
        'deslizar',
        'zoom',
        'polaroid',
        'al_ritmo',
      ]);
      expect(getTransicionMuroClass('polaroid')).toBe('ak-transicion-polaroid');
      expect(normalizarTransicionMuro('al_ritmo')).toBe('al_ritmo');
      expect(getMotionVariantsParaTransicion('deslizar', { index: 0, kenBurns: false, reducedMotion: false }).initial).toEqual({ opacity: 0, x: 24 });

      jest.useFakeTimers();

      const samplePost: SocialGalleryPost = {
        id: 'post-1',
        fiestaId: 'fiesta-323',
        imageUrl: 'https://ejemplo.com/foto.jpg',
        authorName: 'Lucía',
        likes: 5,
        comments: [],
        timestamp: '2026-11-19T22:00:00Z',
        moderationStatus: 'approved',
      };

      mockGetPublicSocialPosts.mockResolvedValue([samplePost]);
      mockGetPublicSocialEvent.mockResolvedValue({
        id: 'fiesta-323',
        configuracion: { nombreEvento: 'Fiesta 323', fechaEvento: '2026-11-19' },
        socialGallerySettings: {
          enabled: true,
          allowLikes: true,
          allowComments: true,
          uploadsActive: true,
          transicion: 'deslizar',
          photoFrame: false,
        },
      });

      await act(async () => {
        root.render(<MuroEnVivoPage />);
      });
      await act(async () => {
        await Promise.resolve();
      });

      let stage = container.querySelector('[data-transicion]');
      expect(stage?.getAttribute('data-transicion')).toBe('deslizar');
      expect(stage?.className).toContain('ak-transicion-deslizar');

      // Cambia la transición en el servidor sin recargar la página
      mockGetPublicSocialEvent.mockResolvedValue({
        id: 'fiesta-323',
        configuracion: { nombreEvento: 'Fiesta 323', fechaEvento: '2026-11-19' },
        socialGallerySettings: {
          enabled: true,
          allowLikes: true,
          allowComments: true,
          uploadsActive: true,
          transicion: 'polaroid',
          photoFrame: true,
        },
      });

      await act(async () => {
        jest.advanceTimersByTime(2200);
        await Promise.resolve();
      });

      stage = container.querySelector('[data-transicion]');
      expect(stage?.getAttribute('data-transicion')).toBe('polaroid');
      expect(stage?.className).toContain('ak-transicion-polaroid');

      jest.useRealTimers();
    });
  });

  // ── BLOQUE 7 ───────────────────────────────────────────────────────────────
  describe('Bloque 7: Las más queridas de la noche y marco del evento (photoFrame / marcoEnImpresion)', () => {
    it('armarAlbumInteligente genera la sección "Las más queridas de la noche" con las 20 fotos con más likes', () => {
      const posts: SocialGalleryPost[] = Array.from({ length: 25 }, (_, i) => ({
        id: `foto-${i + 1}`,
        fiestaId: 'fiesta-top',
        imageUrl: `https://ejemplo.com/f${i + 1}.jpg`,
        authorName: `Invitado ${i + 1}`,
        likes: i + 1,
        comments: [],
        timestamp: `2026-11-19T21:${String(i).padStart(2, '0')}:00Z`,
        moderationStatus: 'approved',
      }));
      posts.push({
        id: 'foto-oculta-top',
        fiestaId: 'fiesta-top',
        imageUrl: 'https://ejemplo.com/oculta.jpg',
        authorName: 'Bloqueado',
        likes: 999,
        comments: [],
        timestamp: '2026-11-19T23:00:00Z',
        moderationStatus: 'hidden',
      });

      const album = armarAlbumInteligente({ posts });
      const seccion = album.secciones.find((s) => s.titulo === 'Las más queridas de la noche');

      expect(seccion).toBeDefined();
      expect(seccion!.recuerdos).toHaveLength(20);
      expect(seccion!.recuerdos[0].id).toBe('foto-25');
      expect(seccion!.recuerdos[0].likes).toBe(25);
      expect(seccion!.recuerdos[19].id).toBe('foto-6');
      expect(seccion!.recuerdos.some((r) => r.id === 'foto-oculta-top')).toBe(false);
    });

    it('dibuja photoFrame en muro-en-vivo solo cuando está activo y no dibuja nada si no hay marco', async () => {
      const samplePost: SocialGalleryPost = {
        id: 'post-marco',
        fiestaId: 'fiesta-323',
        imageUrl: 'https://ejemplo.com/foto.jpg',
        authorName: 'Ana',
        likes: 3,
        comments: [],
        timestamp: '2026-11-19T22:00:00Z',
        moderationStatus: 'approved',
      };

      mockGetPublicSocialPosts.mockResolvedValue([samplePost]);
      mockGetPublicSocialEvent.mockResolvedValue({
        id: 'fiesta-323',
        configuracion: { nombreEvento: 'Boda Ana & Luis', fechaEvento: '2026-11-19' },
        socialGallerySettings: {
          enabled: true,
          allowLikes: true,
          allowComments: true,
          uploadsActive: true,
          photoFrame: false,
        },
      });

      await act(async () => {
        root.render(<MuroEnVivoPage />);
      });
      await act(async () => {
        await Promise.resolve();
      });

      expect(container.querySelector('[data-testid="muro-photo-frame"]')).toBeNull();

      act(() => {
        root.unmount();
      });
      root = createRoot(container);

      mockGetPublicSocialEvent.mockResolvedValue({
        id: 'fiesta-323',
        configuracion: { nombreEvento: 'Boda Ana & Luis', fechaEvento: '2026-11-19' },
        socialGallerySettings: {
          enabled: true,
          allowLikes: true,
          allowComments: true,
          uploadsActive: true,
          photoFrame: true,
          accentColor: '#f59e0b',
        },
      });

      await act(async () => {
        root.render(<MuroEnVivoPage />);
      });
      await act(async () => {
        await Promise.resolve();
      });

      const frame = container.querySelector('[data-testid="muro-photo-frame"]');
      expect(frame).not.toBeNull();
      expect(frame?.textContent).toContain('Boda Ana & Luis');

      const impresionSrc = fs.readFileSync(
        path.join(process.cwd(), 'src/app/evento/impresion/[fiestaId]/page.tsx'),
        'utf8'
      );
      expect(impresionSrc).toContain('marcoEnImpresion');
      expect(impresionSrc).toContain('photoFrame');
      expect(impresionSrc).toContain('impresion-marco-evento');
    });
  });
});
