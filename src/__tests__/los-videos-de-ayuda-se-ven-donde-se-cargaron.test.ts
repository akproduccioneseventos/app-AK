/**
 * @jest-environment jsdom
 */

/**
 * Orden 98 — Bloque 2: Videos de ayuda que el dueño carga, uno por pantalla.
 *
 * Comprueba:
 * - idDeYoutube con los tres formatos (watch, youtu.be, shorts) da el mismo id,
 *   y con un enlace de Drive o texto da null;
 * - guardarVideoDeAyuda sin sesión falla y no guarda; con un lugar inventado, no guarda;
 * - VideoDeAyuda lugar="portal-cliente" con video cargado muestra el botón y, al tocarlo, un iframe con ese id; sin video, no renderiza nada;
 * - dos guardados a la vez de lugares distintos quedan los dos (la base de mentira devuelve una copia en cada lectura).
 */

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { idDeYoutube } from '@/lib/videos-de-ayuda';
import {
  guardarVideoDeAyuda,
  getVideosDeAyuda,
} from '@/app/actions/videos-de-ayuda';
import { VideoDeAyuda } from '@/components/ayuda/VideoDeAyuda';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const esperar = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms));

let tieneSesion = true;
let almacen: Record<string, any> = {};

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => {
    if (!tieneSesion) {
      throw new Error('No autorizado');
    }
    return { userId: 'admin', email: 'admin@ak.test', role: 'admin' };
  }),
}));

let transaccionCola = Promise.resolve();

jest.mock('@/lib/generic-json-store', () => ({
  mutateGenericJsonArray: jest.fn(async (archivo: string, cambiar: (lista: any[]) => any[] | null) => {
    return new Promise((resolve, reject) => {
      transaccionCola = transaccionCola.then(async () => {
        try {
          await esperar(15);
          const actual = copia(almacen[archivo] || []);
          const nueva = cambiar(actual);
          if (nueva !== null) {
            almacen[archivo] = copia(nueva);
          }
          resolve(nueva);
        } catch (err) {
          reject(err);
        }
      });
    });
  }),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => {
    await esperar(5);
    const guardado = almacen[archivo];
    return guardado === undefined ? porDefecto : copia(guardado);
  }),
  writeData: jest.fn(async (archivo: string, datos: any) => {
    await esperar(5);
    almacen[archivo] = copia(datos);
  }),
}));

describe('Orden 98 Bloque 2: Videos de ayuda configurables por pantalla', () => {
  beforeEach(() => {
    tieneSesion = true;
    almacen = {};
    jest.clearAllMocks();
  });

  describe('idDeYoutube: extracción pura de identificador de YouTube', () => {
    const ID_ESPERADO = 'dQw4w9WgXcQ';

    it('con los tres formatos aceptados (watch, youtu.be y shorts) da el mismo id', () => {
      const urlWatch = `https://www.youtube.com/watch?v=${ID_ESPERADO}`;
      const urlWatchConParam = `https://www.youtube.com/watch?v=${ID_ESPERADO}&t=30s`;
      const urlYouTuBe = `https://youtu.be/${ID_ESPERADO}`;
      const urlShorts = `https://www.youtube.com/shorts/${ID_ESPERADO}`;

      expect(idDeYoutube(urlWatch)).toBe(ID_ESPERADO);
      expect(idDeYoutube(urlWatchConParam)).toBe(ID_ESPERADO);
      expect(idDeYoutube(urlYouTuBe)).toBe(ID_ESPERADO);
      expect(idDeYoutube(urlShorts)).toBe(ID_ESPERADO);
    });

    it('con un enlace de Google Drive o texto cualquiera da null', () => {
      expect(idDeYoutube('https://drive.google.com/file/d/123456789/view')).toBeNull();
      expect(idDeYoutube('https://vimeo.com/12345678')).toBeNull();
      expect(idDeYoutube('un texto cualquiera que no es link')).toBeNull();
      expect(idDeYoutube('')).toBeNull();
    });
  });

  describe('guardarVideoDeAyuda: permisos y validaciones', () => {
    it('sin sesión falla y no guarda nada', async () => {
      tieneSesion = false;

      await expect(
        guardarVideoDeAyuda('portal-cliente', 'https://youtu.be/dQw4w9WgXcQ', 'Tutorial Portal'),
      ).rejects.toThrow('No autorizado');

      expect(almacen['videos-de-ayuda.json']).toBeUndefined();
    });

    it('con un lugar inventado no guarda y devuelve error', async () => {
      tieneSesion = true;

      const resultado = await guardarVideoDeAyuda(
        'lugar-inventado-que-no-existe',
        'https://youtu.be/dQw4w9WgXcQ',
      );

      expect(resultado.success).toBe(false);
      expect(resultado.error).toMatch(/no admite videos de ayuda/i);
      expect(almacen['videos-de-ayuda.json']).toBeUndefined();
    });

    it('con enlace que no es de youtube no guarda y devuelve error', async () => {
      tieneSesion = true;

      const resultado = await guardarVideoDeAyuda(
        'portal-cliente',
        'https://drive.google.com/file/d/123/view',
      );

      expect(resultado.success).toBe(false);
      expect(resultado.error).toMatch(/debe ser un video v[aá]lido de YouTube/i);
      expect(almacen['videos-de-ayuda.json']).toBeUndefined();
    });
  });

  describe('concurrencia: dos guardados a la vez de lugares distintos quedan los dos', () => {
    it('guarda ambos videos sin pisarse aunque la base devuelva copias en cada lectura', async () => {
      tieneSesion = true;

      const [res1, res2] = await Promise.all([
        guardarVideoDeAyuda('portal-cliente', 'https://youtu.be/dQw4w9WgXcQ', 'Video Cliente'),
        guardarVideoDeAyuda('simulador', 'https://www.youtube.com/watch?v=kJQP7kiw5Fk', 'Video Simulador'),
      ]);

      expect(res1.success).toBe(true);
      expect(res2.success).toBe(true);

      const lista = almacen['videos-de-ayuda.json'];
      expect(Array.isArray(lista)).toBe(true);
      expect(lista).toHaveLength(2);

      const lugares = lista.map((item: any) => item.lugar);
      expect(lugares).toContain('portal-cliente');
      expect(lugares).toContain('simulador');

      const videosPublicos = await getVideosDeAyuda();
      expect(videosPublicos).toHaveLength(2);
      expect(videosPublicos.find((v) => v.lugar === 'portal-cliente')?.videoId).toBe('dQw4w9WgXcQ');
      expect(videosPublicos.find((v) => v.lugar === 'simulador')?.videoId).toBe('kJQP7kiw5Fk');
    });
  });

  describe('VideoDeAyuda: renderizado en pantalla', () => {
    let contenedor: HTMLDivElement;

    beforeEach(() => {
      contenedor = document.createElement('div');
      document.body.appendChild(contenedor);
    });

    afterEach(() => {
      if (contenedor && contenedor.parentNode) {
        contenedor.parentNode.removeChild(contenedor);
      }
    });

    it('sin video para el lugar no renderiza nada', async () => {
      const raiz = createRoot(contenedor);

      await act(async () => {
        raiz.render(
          React.createElement(VideoDeAyuda, {
            lugar: 'portal-cliente',
            initialVideo: null,
          }),
        );
      });

      expect(contenedor.innerHTML).toBe('');
      await act(async () => { raiz.unmount(); });
    });

    it('con video cargado muestra el botón y, al tocarlo, un iframe con ese id', async () => {
      const videoInfo = {
        lugar: 'portal-cliente',
        videoId: 'dQw4w9WgXcQ',
        titulo: 'Cómo usar el portal',
      };

      const raiz = createRoot(contenedor);

      await act(async () => {
        raiz.render(
          React.createElement(VideoDeAyuda, {
            lugar: 'portal-cliente',
            initialVideo: videoInfo,
          }),
        );
      });

      // El botón debe estar visible
      const boton = contenedor.querySelector('button');
      expect(boton).not.toBeNull();
      expect(boton?.textContent).toContain('¿Cómo se usa?');

      // Al principio el modal con el iframe no está abierto
      expect(document.querySelector('iframe')).toBeNull();

      // Tocamos el botón
      await act(async () => {
        boton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });

      // Ahora el iframe debe existir en el documento con el id de YouTube
      const iframe = document.querySelector('iframe');
      expect(iframe).not.toBeNull();
      expect(iframe?.getAttribute('src')).toBe(
        'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1',
      );
      expect(iframe?.getAttribute('title')).toBe('Cómo usar el portal');

      await act(async () => { raiz.unmount(); });
    });
  });
});
