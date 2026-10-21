import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { toPublicSocialEvent } from '@/lib/social-fiesta/public-event';
import type { Fiesta } from '@/types/fiesta';

const push = jest.fn();
let mockPublicEvent: any = null;
let mockAnchor: any = null;
let mockMindARInstance: any = null;
let mockImportFails = false;

jest.mock('next/navigation', () => ({
  useParams: () => ({ fiestaId: 'fiesta-123' }),
  useRouter: () => ({ push }),
}));

jest.mock('@/app/actions/social-gallery', () => ({
  getPublicSocialEvent: jest.fn(async () => mockPublicEvent),
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

jest.mock('@/lib/vendor/mind-ar/mindar-image-three.prod.js', () => {
  return {
    get MindARThree() {
      if (mockImportFails) return null;
      return jest.fn().mockImplementation(() => {
        mockAnchor = {
          group: { add: jest.fn() },
          onTargetFound: null,
          onTargetLost: null,
        };
        mockMindARInstance = {
          addAnchor: jest.fn().mockReturnValue(mockAnchor),
          start: jest.fn().mockResolvedValue(undefined),
          stop: jest.fn(),
        };
        return mockMindARInstance;
      });
    },
  };
});

import EventoRealidadAumentadaPage from '@/app/evento/ar/[fiestaId]/page';

beforeAll(() => {
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
  Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia: jest.fn().mockResolvedValue({}) },
    configurable: true,
    writable: true,
  });
});

afterAll(() => {
  Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
});

const mockPlay = jest.fn().mockResolvedValue(undefined);
const mockPause = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockImportFails = false;
  mockAnchor = null;
  mockMindARInstance = null;
  mockPlay.mockClear();
  mockPause.mockClear();
  window.HTMLMediaElement.prototype.play = mockPlay;
  window.HTMLMediaElement.prototype.pause = mockPause;
});

async function montar() {
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  await act(async () => {
    root.render(<EventoRealidadAumentadaPage />);
  });
  // Dar oportunidad al microtask de resolver getPublicSocialEvent y startAR
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

describe('Realidad Aumentada - Detección y Reproducción de Video', () => {
  test('toPublicSocialEvent da tieneRealidadAumentada: false con sólo uno de los dos archivos, y true con los dos', () => {
    const baseFiesta: Fiesta = {
      id: 'f1',
      nombre: 'Fiesta Test',
      tipo: 'XV Años',
      fecha: '2026-11-20',
      estado: 'confirmado',
      configuracion: {
        nombreEvento: 'Fiesta Test',
        fechaEvento: '2026-11-20',
      },
    } as any;

    // 1. Sin realidad aumentada
    const resVacio = toPublicSocialEvent(baseFiesta);
    expect(resVacio.tieneRealidadAumentada).toBe(false);

    // 2. Con sólo imagen / target
    const soloTarget: Fiesta = {
      ...baseFiesta,
      invitacionDigital: {
        plantilla: 'Grazia',
        secciones: [],
        cabecera: { visible: true },
        realidadAumentada: { mindTargetUrl: 'https://ejemplo.com/tarjeta.mind' },
      },
    };
    const resSoloTarget = toPublicSocialEvent(soloTarget);
    expect(resSoloTarget.tieneRealidadAumentada).toBe(false);
    expect(resSoloTarget.mindTargetUrl).toBe('https://ejemplo.com/tarjeta.mind');
    expect(resSoloTarget.arVideoUrl).toBeUndefined();

    // 3. Con sólo video
    const soloVideo: Fiesta = {
      ...baseFiesta,
      invitacionDigital: {
        plantilla: 'Grazia',
        secciones: [],
        cabecera: { visible: true },
        realidadAumentada: { videoUrl: 'https://ejemplo.com/video.mp4' },
      },
    };
    const resSoloVideo = toPublicSocialEvent(soloVideo);
    expect(resSoloVideo.tieneRealidadAumentada).toBe(false);
    expect(resSoloVideo.arVideoUrl).toBe('https://ejemplo.com/video.mp4');
    expect(resSoloVideo.mindTargetUrl).toBeUndefined();

    // 4. Con ambos archivos
    const conAmbos: Fiesta = {
      ...baseFiesta,
      invitacionDigital: {
        plantilla: 'Grazia',
        secciones: [],
        cabecera: { visible: true },
        realidadAumentada: {
          mindTargetUrl: 'https://ejemplo.com/tarjeta.mind',
          videoUrl: 'https://ejemplo.com/video.mp4',
        },
      },
    };
    const resConAmbos = toPublicSocialEvent(conAmbos);
    expect(resConAmbos.tieneRealidadAumentada).toBe(true);
    expect(resConAmbos.mindTargetUrl).toBe('https://ejemplo.com/tarjeta.mind');
    expect(resConAmbos.arVideoUrl).toBe('https://ejemplo.com/video.mp4');
  });

  test('antes de onTargetFound el video no se reprodujo, al detectar se reproduce una vez con el src del video, y al perder se pausa', async () => {
    mockPublicEvent = {
      id: 'fiesta-123',
      nombre: 'Fiesta Prueba',
      tieneRealidadAumentada: true,
      mindTargetUrl: 'https://ejemplo.com/target.mind',
      arVideoUrl: 'https://ejemplo.com/video-fiesta.mp4',
    };

    const { host, cerrar } = await montar();

    const video = host.querySelector('video') as HTMLVideoElement;
    expect(video).toBeTruthy();
    expect(video.src).toBe('https://ejemplo.com/video-fiesta.mp4');

    // Antes de onTargetFound: no se llamó play
    expect(mockPlay).not.toHaveBeenCalled();

    // Disparar onTargetFound a mano
    expect(mockAnchor).toBeTruthy();
    expect(typeof mockAnchor.onTargetFound).toBe('function');

    await act(async () => {
      mockAnchor.onTargetFound();
    });

    // Se reprodujo exactamente una sola vez
    expect(mockPlay).toHaveBeenCalledTimes(1);

    // Con onTargetLost se pausa
    expect(typeof mockAnchor.onTargetLost).toBe('function');
    await act(async () => {
      mockAnchor.onTargetLost();
    });

    expect(mockPause).toHaveBeenCalledTimes(1);

    cerrar();
  });

  test('si el import de mind-ar falla, aparece el cartel de error de cámara', async () => {
    mockImportFails = true;
    mockPublicEvent = {
      id: 'fiesta-123',
      nombre: 'Fiesta Prueba',
      tieneRealidadAumentada: true,
      mindTargetUrl: 'https://ejemplo.com/target.mind',
      arVideoUrl: 'https://ejemplo.com/video-fiesta.mp4',
    };

    const { host, cerrar } = await montar();

    // Debe mostrar el cartel de error
    expect(host.textContent).toContain('No pudimos inicializar la realidad aumentada');
    expect(mockPlay).not.toHaveBeenCalled();

    cerrar();
  });
});
