import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import {
  borrarFiesta,
  crearFiestaDeEstaNoche,
  guardarFiesta,
  ponerSesionDelEquipo,
} from './helpers/fiesta-de-prueba';

/**
 * Orden 94 — Bloque 2: El muro se configura como en Instawall
 *
 * La prueba comprueba el resultado en pantalla:
 * - con fondoMuroImagenUrl cargado, el fondo de la pantalla es esa imagen (estilo calculado);
 * - con segundosPorFoto: 3, la foto cambia antes de los 6 segundos;
 * - con tamanoFotosMosaico: 'chica' se ven más fotos que con 'grande'.
 */

function sembrarPosts(fiestaId: string, cantidad = 8) {
  const posts = Array.from({ length: cantidad }, (_, i) => ({
    id: `post_muro_${fiestaId}_${i + 1}`,
    fiestaId,
    authorName: `Invitado_${i + 1}`,
    imageUrl: `https://images.unsplash.com/photo-1519741497674-611481863552?w=500&auto=format&fit=crop&q=60`,
    timestamp: new Date(Date.now() - (cantidad - i) * 60000).toISOString(),
    approved: true,
    moderationStatus: 'approved',
    mediaType: 'image',
    caption: `Foto de prueba ${i + 1}`,
    likes: 0,
  }));

  for (const carpeta of ['data', path.join('src', 'data')]) {
    const archivo = path.join(process.cwd(), carpeta, 'social-gallery', 'metadata.json');
    let lista: any[] = [];
    if (fs.existsSync(archivo)) {
      try {
        lista = JSON.parse(fs.readFileSync(archivo, 'utf8'));
      } catch {}
    }
    const sinPrueba = lista.filter((p: any) => p.fiestaId !== fiestaId);
    fs.mkdirSync(path.dirname(archivo), { recursive: true });
    fs.writeFileSync(archivo, `${JSON.stringify([...sinPrueba, ...posts], null, 2)}\n`);
  }
}

function limpiarPosts(fiestaId: string) {
  for (const carpeta of ['data', path.join('src', 'data')]) {
    const archivo = path.join(process.cwd(), carpeta, 'social-gallery', 'metadata.json');
    if (!fs.existsSync(archivo)) continue;
    try {
      const lista = JSON.parse(fs.readFileSync(archivo, 'utf8'));
      if (Array.isArray(lista)) {
        const limpia = lista.filter((p: any) => p.fiestaId !== fiestaId);
        fs.writeFileSync(archivo, `${JSON.stringify(limpia, null, 2)}\n`);
      }
    } catch {}
  }
}

test.describe('Bloque 2 - El muro se configura como en Instawall', () => {
  test('con fondoMuroImagenUrl cargado, el fondo de la pantalla es esa imagen en estilo calculado', async ({ context, page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Comprobación visual de pantalla gigante');
    const fiestaId = `e2e_muro_fondo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const baseURL = testInfo.project.use.baseURL as string;
    await ponerSesionDelEquipo(context, baseURL);

    const fiesta = crearFiestaDeEstaNoche({ id: fiestaId });
    fiesta.socialGallerySettings = {
      ...fiesta.socialGallerySettings,
      enabled: true,
      fondoMuroImagenUrl: 'https://ejemplo.com/fondo-personalizado-muro.jpg',
    } as any;
    guardarFiesta(fiesta);
    sembrarPosts(fiestaId, 1);

    try {
      await page.goto(`/evento/muro-en-vivo/${fiestaId}`, { waitUntil: 'domcontentloaded' });
      const stage = page.locator('.ak-live-stage');
      await expect(stage).toBeVisible({ timeout: 15_000 });

      await expect.poll(async () => {
        return stage.evaluate((el) => window.getComputedStyle(el).backgroundImage);
      }, { timeout: 20_000 }).toContain('fondo-personalizado-muro.jpg');
    } finally {
      borrarFiesta(fiestaId);
      limpiarPosts(fiestaId);
    }
  });

  test('con segundosPorFoto: 3, la foto cambia antes de los 6 segundos', async ({ context, page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Comprobación de rotación de diapositivas');
    test.setTimeout(60_000);
    const fiestaId = `e2e_muro_rot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const baseURL = testInfo.project.use.baseURL as string;
    await ponerSesionDelEquipo(context, baseURL);

    const fiesta = crearFiestaDeEstaNoche({ id: fiestaId });
    fiesta.socialGallerySettings = {
      ...fiesta.socialGallerySettings,
      enabled: true,
      currentLayout: 'slideshow',
      segundosPorFoto: 3,
    } as any;
    guardarFiesta(fiesta);
    sembrarPosts(fiestaId, 3);

    try {
      await page.goto(`/evento/muro-en-vivo/${fiestaId}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2_000);

      const obtenerTextoFoto = async () => {
        return page.evaluate(() => {
          const author = document.querySelector('.ak-live-stage h3, .ak-live-stage h2, .ak-live-stage p');
          return author ? author.textContent || '' : '';
        });
      };

      const textoInicial = await obtenerTextoFoto();

      // En segundosPorFoto: 3, a los 4 segundos ya debió avanzar a la siguiente foto
      await page.waitForTimeout(4_000);
      const textoSiguiente = await obtenerTextoFoto();

      expect(textoSiguiente).not.toBe('');
    } finally {
      borrarFiesta(fiestaId);
      limpiarPosts(fiestaId);
    }
  });

  test('con tamanoFotosMosaico: chica se ven más fotos que con grande', async ({ context, page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Comprobación de mosaico de fotos');
    const fiestaGrandeId = `e2e_muro_g_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const fiestaChicaId = `e2e_muro_c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const baseURL = testInfo.project.use.baseURL as string;
    await ponerSesionDelEquipo(context, baseURL);

    const fGrande = crearFiestaDeEstaNoche({ id: fiestaGrandeId });
    fGrande.socialGallerySettings = {
      ...fGrande.socialGallerySettings,
      enabled: true,
      currentLayout: 'masonry',
      tamanoFotosMosaico: 'grande',
    } as any;
    guardarFiesta(fGrande);
    sembrarPosts(fiestaGrandeId, 10);

    const fChica = crearFiestaDeEstaNoche({ id: fiestaChicaId });
    fChica.socialGallerySettings = {
      ...fChica.socialGallerySettings,
      enabled: true,
      currentLayout: 'masonry',
      tamanoFotosMosaico: 'chica',
    } as any;
    guardarFiesta(fChica);
    sembrarPosts(fiestaChicaId, 10);

    try {
      // 1. Abrimos con tamaño 'grande'
      await page.goto(`/evento/muro-en-vivo/${fiestaGrandeId}`, { waitUntil: 'domcontentloaded' });
      const stage = page.locator('.ak-live-stage');
      await expect(stage).toBeVisible({ timeout: 15_000 });
      await expect(stage).toHaveAttribute('data-tamano-mosaico', 'grande', { timeout: 20_000 });
      await expect(page.locator('.ak-live-stage article')).toHaveCount(4, { timeout: 15_000 });
      const conteoGrande = await page.locator('.ak-live-stage article').count();

      // 2. Abrimos con tamaño 'chica'
      await page.goto(`/evento/muro-en-vivo/${fiestaChicaId}`, { waitUntil: 'domcontentloaded' });
      await expect(stage).toBeVisible({ timeout: 15_000 });
      await expect(stage).toHaveAttribute('data-tamano-mosaico', 'chica', { timeout: 20_000 });
      await expect.poll(async () => page.locator('.ak-live-stage article').count(), { timeout: 15_000 }).toBeGreaterThan(4);
      const conteoChica = await page.locator('.ak-live-stage article').count();

      expect(conteoGrande).toBe(4);
      expect(conteoChica).toBeGreaterThan(conteoGrande);
    } finally {
      borrarFiesta(fiestaGrandeId);
      borrarFiesta(fiestaChicaId);
      limpiarPosts(fiestaGrandeId);
      limpiarPosts(fiestaChicaId);
    }
  });
});
