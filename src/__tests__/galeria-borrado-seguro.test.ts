import {
  archivosHuerfanos,
  esArchivoPropio,
  urlsDelItem,
} from '@/lib/galeria/borrado-seguro';
import type { CatalogoFoto } from '@/types/catalogo';
import type { GaleriaData, GaleriaFoto, GaleriaVideo } from '@/types/galeria';

/**
 * Sacar una foto de la galería tiene que sacarla de verdad: del listado, del
 * catálogo y del depósito. Pero sin borrar un archivo que otra foto sigue usando,
 * porque ahí el cliente vería un cuadro roto.
 */

const NUESTRO = 'https://storage.googleapis.com/presupuestador-ak-producciones.firebasestorage.app';

function foto(id: string, url: string): GaleriaFoto {
  return {
    id,
    tipo: 'foto',
    url,
    categoria: 'Salón',
    destacada: false,
    orden: 0,
    createdAt: '2026-08-01T00:00:00.000Z',
  };
}

function video(id: string, urls: Partial<GaleriaVideo>): GaleriaVideo {
  return {
    id,
    tipo: 'video',
    youtubeUrl: '',
    youtubeId: '',
    thumbnailUrl: '',
    titulo: 'Un video',
    categoria: 'DJ/Sonido',
    destacada: false,
    orden: 0,
    createdAt: '2026-08-01T00:00:00.000Z',
    ...urls,
  };
}

function catalogo(url: string): CatalogoFoto {
  return {
    id: 'cat_1',
    url,
    categoriaServicio: 'Salón',
    destacada: false,
    orden: 0,
    source: 'galeria',
    createdAt: '2026-08-01T00:00:00.000Z',
  };
}

const galeriaVacia: GaleriaData = { fotos: [], videos: [] };

describe('borrado seguro de la galería', () => {
  it('reconoce los archivos propios y descarta los de afuera', () => {
    expect(esArchivoPropio(`${NUESTRO}/public-page-assets/galeria-empresa/a.jpg`)).toBe(true);
    expect(esArchivoPropio('https://images.unsplash.com/foto.jpg')).toBe(false);
    expect(esArchivoPropio('')).toBe(false);
    expect(esArchivoPropio(undefined)).toBe(false);
    expect(esArchivoPropio('no es una direccion')).toBe(false);
  });

  it('borra el archivo de una foto nuestra que ya no usa nadie', () => {
    const url = `${NUESTRO}/public-page-assets/galeria-empresa/a.jpg`;

    expect(archivosHuerfanos(foto('f1', url), galeriaVacia, [])).toEqual([url]);
  });

  it('NO borra el archivo si el catálogo todavía muestra esa misma foto', () => {
    const url = `${NUESTRO}/public-page-assets/galeria-empresa/a.jpg`;

    expect(archivosHuerfanos(foto('f1', url), galeriaVacia, [catalogo(url)])).toEqual([]);
  });

  it('NO borra el archivo si otra foto de la galería lo usa', () => {
    const url = `${NUESTRO}/public-page-assets/galeria-empresa/a.jpg`;
    const resto: GaleriaData = { fotos: [foto('f2', url)], videos: [] };

    expect(archivosHuerfanos(foto('f1', url), resto, [])).toEqual([]);
  });

  it('no intenta borrar una foto cargada pegando una dirección de otro lado', () => {
    expect(archivosHuerfanos(foto('f1', 'https://images.unsplash.com/foto.jpg'), galeriaVacia, []))
      .toEqual([]);
  });

  it('de un video subido borra el archivo una sola vez, aunque figure repetido', () => {
    const url = `${NUESTRO}/public-page-assets/galeria-empresa-videos/v.mp4`;
    const item = video('v1', { youtubeUrl: url, embedUrl: url, plataforma: 'archivo' });

    expect(archivosHuerfanos(item, galeriaVacia, [])).toEqual([url]);
  });

  it('de un video de YouTube no borra nada del depósito', () => {
    const item = video('v1', {
      youtubeUrl: 'https://www.youtube.com/watch?v=abc',
      youtubeId: 'abc',
      thumbnailUrl: 'https://i.ytimg.com/vi/abc/hqdefault.jpg',
      plataforma: 'youtube',
    });

    expect(archivosHuerfanos(item, galeriaVacia, [])).toEqual([]);
  });

  it('junta todas las direcciones que cuelgan de un video', () => {
    const item = video('v1', {
      youtubeUrl: 'a',
      embedUrl: 'b',
      thumbnailUrl: 'c',
    });

    expect(urlsDelItem(item)).toEqual(['a', 'b', 'c']);
  });
});
