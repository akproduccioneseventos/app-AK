// @ts-nocheck -- lector REAL + pagina REAL; solo se simula el SDK de Storage y los adornos de la pantalla.
/**
 * MATAFUEGO - Un error de lectura no es una galería vacía (orden 148, VID96-LECTOR, 10 de octubre de 2026).
 *
 * `getLifeStoryVideoPhotos` devolvía `[]` si fallaba el listado de Storage o la firma de UNA foto, y
 * la pantalla del cliente decía "Tu Galería (0 de N)" con recuadros para subir: podía reemplazar
 * fotos que sí estaban. Ahora el lector devuelve ok / parcial / error, y la pantalla avisa, deja
 * reintentar, conserva lo que ya se veía y no ofrece subir con la lista desconocida.
 *
 * Las lecturas de la base de mentira devuelven COPIAS nuevas en cada llamada (como la de verdad).
 *
 * Probado rompiéndolo: (1) devolviendo [] en el catch del lector, los tests de "error" se ponen en
 * rojo; (2) volviendo a hacer que una firma fallida tire todo (sin el try interno), el parcial se
 * pone en rojo; (3) sacando `bloqueado` de los recuadros, el test de "no ofrece subir" se pone en rojo.
 */
import React, { act } from 'react';
import fs from 'node:fs';
import { createRoot } from 'react-dom/client';

const mockList = jest.fn();
const mockToast = jest.fn();
const mockFiesta = { id: 'f148', configuracion: { nombreEvento: 'Evento 148' }, videoVida: { galleryEnabled: true, photoCount: 2, photosUploaded: true } };
jest.mock('firebase-admin', () => ({ __esModule: true, default: { apps: [{}], storage: () => ({ bucket: () => ({ getFiles: mockList }) }) } }));
jest.mock('@/app/actions/fiesta-actual', () => ({ getFiestaById: jest.fn(async () => mockFiesta) }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({ saveFiesta: jest.fn() }));
jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: jest.fn(), deleteFromStorage: jest.fn() }));
jest.mock('next/navigation', () => ({ useParams: () => ({ fiestaId: 'f148' }) }));
jest.mock('next/image', () => ({ __esModule: true, default: ({ src, alt }) => <img src={src} alt={alt} /> }));
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mockToast }) }));
jest.mock('@/components/company-logo', () => ({ CompanyLogo: () => null }));
jest.mock('@/components/public-footer', () => ({ PublicFooter: () => null }));
jest.mock('@/components/ayuda/VideoDeAyuda', () => ({ VideoDeAyuda: () => null }));
jest.mock('@/components/legal/AvisoDeDatos', () => ({ AvisoDeDatos: () => null }));

import VideoVidaPage from '@/app/video-vida/[fiestaId]/page';
import { getLifeStoryVideoPhotos } from '@/app/actions/fiesta/video-vida.actions';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const publico = (n) => ({ name: `video-vida-photos/f148/${n}.jpg`, getMetadata: async () => [{ acl: [{ entity: 'allUsers' }] }] });
const sinFirma = (n) => ({
  name: `video-vida-photos/f148/${n}.jpg`,
  getMetadata: async () => [{}],
  getSignedUrl: async () => { throw new Error('no se pudo firmar'); },
});
const firmado = (n) => ({
  name: `video-vida-photos/f148/${n}.jpg`,
  getMetadata: async () => [{}],
  getSignedUrl: async () => [`https://firmada.test/video-vida-photos/f148/${n}.jpg?sig=1`],
});
/** Cada llamada arma archivos NUEVOS (copias), nunca la misma lista en memoria. */
const lista = (...fabricas) => async () => [fabricas.map((f) => f())];

describe('getLifeStoryVideoPhotos: cuatro estados', () => {
  beforeEach(() => { mockList.mockReset(); jest.spyOn(console, 'error').mockImplementation(() => {}); });
  afterEach(() => jest.restoreAllMocks());

  it('galería realmente vacía: ok con cero fotos', async () => {
    mockList.mockImplementation(lista());
    expect(await getLifeStoryVideoPhotos('f148')).toEqual({ estado: 'ok', urls: [], fallidas: 0 });
  });

  it('con fotos: ok, ordenadas por número', async () => {
    mockList.mockImplementation(lista(() => publico('02'), () => firmado('01')));
    const r = await getLifeStoryVideoPhotos('f148');
    expect(r.estado).toBe('ok');
    expect(r.urls.map((u) => u.split('/').pop().split('?')[0])).toEqual(['01.jpg', '02.jpg']);
  });

  it('una firma fallida: parcial, conserva las buenas y cuenta la fallida', async () => {
    mockList.mockImplementation(lista(() => sinFirma('01'), () => publico('02'), () => firmado('03')));
    const r = await getLifeStoryVideoPhotos('f148');
    expect(r.estado).toBe('parcial');
    expect(r.fallidas).toBe(1);
    expect(r.urls).toHaveLength(2);
    expect(r.urls[0]).toContain('/02.jpg');
    expect(r.urls[1]).toContain('/03.jpg');
  });

  it('falla el listado: error, nunca ok vacío', async () => {
    mockList.mockRejectedValue(new Error('Storage caído'));
    const r = await getLifeStoryVideoPhotos('f148');
    expect(r.estado).toBe('error');
    expect(r.urls).toEqual([]);
    expect(r.error).toMatch(/no se perdieron/i);
  });

  it('ninguna foto se pudo firmar: error (no se sabe qué hay), no galería vacía', async () => {
    mockList.mockImplementation(lista(() => sinFirma('01'), () => sinFirma('02')));
    expect((await getLifeStoryVideoPhotos('f148')).estado).toBe('error');
  });
});

describe('Pantalla del cliente: error de lectura, reintento y recuperación', () => {
  let root;
  const texto = () => document.body.textContent || '';
  async function montar() {
    await act(async () => { root = createRoot(document.body.appendChild(document.createElement('div'))); root.render(<VideoVidaPage />); });
  }
  async function esperar(cond) {
    for (let i = 0; i < 60; i++) { if (cond()) return; await act(async () => new Promise((r) => setTimeout(r, 30))); }
    throw new Error('La pantalla no llegó al estado esperado: ' + texto());
  }
  const boton = () => Array.from(document.querySelectorAll('button')).find((b) => /Reintentar/.test(b.textContent));
  const fotos = () => document.querySelectorAll('img[alt^="Foto "]');
  const entradas = () => Array.from(document.querySelectorAll('input[type=file]'));

  beforeEach(() => { mockList.mockReset(); mockToast.mockReset(); jest.spyOn(console, 'error').mockImplementation(() => {}); });
  afterEach(() => { if (root) act(() => root.unmount()); root = null; document.body.replaceChildren(); jest.restoreAllMocks(); });

  it('si Storage no responde: avisa, ofrece reintentar, no dice "0 de" y no ofrece subir', async () => {
    mockList.mockRejectedValue(new Error('Storage caído'));
    await montar();
    await esperar(() => texto().includes('No pudimos leer tus fotos ahora; no se perdieron. Reintentá.'));
    expect(texto()).not.toMatch(/0 de \d/);
    expect(boton()).toBeTruthy();
    expect(entradas().filter((i) => !i.disabled)).toHaveLength(0);
    expect(texto()).not.toContain('Subir foto');
  });

  it('el reintento restaura las fotos y el contador sin duplicar', async () => {
    mockList.mockRejectedValueOnce(new Error('Storage caído'));
    mockList.mockImplementation(lista(() => publico('01')));
    await montar();
    await esperar(() => !!boton());
    await act(async () => { boton().click(); });
    await esperar(() => texto().includes('Tu Galería (1 de 2)'));
    expect(fotos()).toHaveLength(1);
    expect(boton()).toBeFalsy();
    expect(entradas().filter((i) => !i.disabled)).toHaveLength(2);

    expect(mockList).toHaveBeenCalledTimes(2);
  });

  it('si la recarga falla se conservan las fotos que ya se veían (y no se ofrece subir)', async () => {
    // Primera lectura parcial (se ve 01); la recarga falla y 01 tiene que seguir a la vista.
    mockList.mockImplementationOnce(lista(() => publico('01'), () => sinFirma('02')));
    mockList.mockRejectedValue(new Error('Storage caído'));
    await montar();
    await esperar(() => !!boton());
    expect(fotos()).toHaveLength(1);
    await act(async () => { boton().click(); });
    await esperar(() => texto().includes('No pudimos leer tus fotos ahora'));
    expect(fotos()).toHaveLength(1);
    expect(texto()).not.toMatch(/0 de \d/);
    expect(entradas().filter((i) => !i.disabled)).toHaveLength(0);
  });

  it('una firma fallida: muestra lo que cargó, avisa cuántas faltan y bloquea subir', async () => {
    mockList.mockImplementation(lista(() => publico('01'), () => sinFirma('02')));
    await montar();
    await esperar(() => texto().includes('No pudimos mostrar 1 foto ahora'));
    expect(fotos()).toHaveLength(1);
    expect(boton()).toBeTruthy();
    expect(entradas().filter((i) => !i.disabled)).toHaveLength(0);
  });

  it('galería realmente vacía: sigue diciendo "0 de 2" y deja subir', async () => {
    mockList.mockImplementation(lista());
    await montar();
    await esperar(() => texto().includes('Tu Galería (0 de 2)'));
    expect(boton()).toBeFalsy();
    expect(entradas().filter((i) => !i.disabled)).toHaveLength(2);
  });

  it('la pantalla usa el resultado estructurado y no tiene un [] como atajo', () => {
    const pagina = fs.readFileSync('src/app/video-vida/[fiestaId]/page.tsx', 'utf8');
    const accion = fs.readFileSync('src/app/actions/fiesta/video-vida.actions.ts', 'utf8');
    expect(pagina).toContain('resultado.estado');
    const cuerpo = accion.slice(accion.indexOf('export async function getLifeStoryVideoPhotos'), accion.indexOf('export async function deleteAllVideoVidaPhotos'));
    expect(cuerpo).not.toMatch(/return \[\];/);
  });
});
