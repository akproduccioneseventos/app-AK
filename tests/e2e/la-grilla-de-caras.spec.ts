import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {
  borrarFiesta,
  crearFiestaDeEstaNoche,
  guardarFiesta,
} from './helpers/fiesta-de-prueba';
import type { CaraEnFoto } from '../../src/lib/caras/agrupar-caras';
import type { SocialGalleryPost } from '../../src/types/social-gallery';

/**
 * Orden 36 � La grilla de caras: "tocá tu cara y llevate tus fotos"
 *
 * Se comprueba:
 * 1. Con la fiesta sin preparar, el botón no aparece.
 * 2. Que la grilla muestra caritas sin nombres.
 * 3. Con el interruptor apagado no se ve ni la grilla ni el botón.
 * 4. Sin aceptar el permiso, la cámara no se prende.
 * 5. La más importante: que la selfie no sale del teléfono ni se manda a la red.
 */

function caraDe(semilla: number, ruido = 0): number[] {
  return Array.from({ length: 128 }, (_, i) => semilla + Math.sin(i * semilla) * 0.01 + ruido);
}

const ANA = caraDe(1);
const BETO = caraDe(9);

function armarCarasDePrueba(): CaraEnFoto[] {
  return [
    { fotoId: 'foto_ana_1', vector: caraDe(1, 0.001), tamano: 0.9 },
    { fotoId: 'foto_ana_2', vector: caraDe(1, 0.002), tamano: 0.5 },
    { fotoId: 'foto_ana_3', vector: caraDe(1, 0.003), tamano: 0.4 },
    { fotoId: 'foto_beto_1', vector: BETO, tamano: 0.8 },
    { fotoId: 'foto_beto_2', vector: caraDe(9, 0.001), tamano: 0.3 },
    { fotoId: 'foto_fondo', vector: caraDe(5), tamano: 0.2 }, // Uno solo: no entra en la grilla
  ];
}

function armarPostsDePrueba(fiestaId: string): SocialGalleryPost[] {
  const ids = ['foto_ana_1', 'foto_ana_2', 'foto_ana_3', 'foto_beto_1', 'foto_beto_2', 'foto_fondo'];
  return ids.map((id, index) => ({
    id,
    fiestaId,
    imageUrl: `https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=500&q=80&sig=${index}`,
    timestamp: new Date(Date.now() - index * 60000).toISOString(),
    authorName: 'Invitado',
    likes: index,
    comments: [],
    moderationStatus: 'approved',
  }));
}

function guardarPostsEnArchivos(posts: SocialGalleryPost[]) {
  for (const relativo of ['data/social-gallery/metadata.json', 'src/data/social-gallery/metadata.json']) {
    const ruta = path.join(process.cwd(), relativo);
    if (!fs.existsSync(ruta)) continue;
    try {
      const actuales: SocialGalleryPost[] = JSON.parse(fs.readFileSync(ruta, 'utf8'));
      const filtrados = actuales.filter((p) => !posts.some((nuevo) => nuevo.id === p.id));
      fs.writeFileSync(ruta, `${JSON.stringify([...filtrados, ...posts], null, 2)}\n`);
    } catch {}
  }
}

function borrarPostsDeArchivos(fiestaId: string) {
  for (const relativo of ['data/social-gallery/metadata.json', 'src/data/social-gallery/metadata.json']) {
    const ruta = path.join(process.cwd(), relativo);
    if (!fs.existsSync(ruta)) continue;
    try {
      const actuales: SocialGalleryPost[] = JSON.parse(fs.readFileSync(ruta, 'utf8'));
      const limpios = actuales.filter((p) => p.fiestaId !== fiestaId);
      fs.writeFileSync(ruta, `${JSON.stringify(limpios, null, 2)}\n`);
    } catch {}
  }
}

async function enchufarCamara(page: Page) {
  await page.addInitScript(() => {
    const armar = () => {
      const lienzo = document.createElement('canvas');
      lienzo.width = 640;
      lienzo.height = 480;
      const ctx = lienzo.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, lienzo.width, lienzo.height);
      }
      return lienzo.captureStream(30);
    };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => armar(),
        enumerateDevices: async () => [{ deviceId: 'cam', kind: 'videoinput', label: 'Camara', groupId: 'g' }],
        addEventListener: () => {},
        removeEventListener: () => {},
      },
    });
  });
}

const ID_SIN_PREPARAR = `e2e_caras_sin_${Date.now()}`;
const ID_PREPARADA = `e2e_caras_prep_${Date.now()}`;
const ID_APAGADO = `e2e_caras_off_${Date.now()}`;

test.beforeAll(() => {
  // 1. Fiesta sin preparar (no tiene caras)
  const fSin = crearFiestaDeEstaNoche({ id: ID_SIN_PREPARAR });
  fSin.socialGallerySettings = {
    ...fSin.socialGallerySettings,
    enabled: true,
    carasPreparadas: false,
    allowLikes: true,
    allowComments: true,
    uploadsActive: true,
  };
  guardarFiesta(fSin);

  // 2. Fiesta preparada con caras
  const fPrep = crearFiestaDeEstaNoche({ id: ID_PREPARADA });
  fPrep.socialGallerySettings = {
    ...fPrep.socialGallerySettings,
    enabled: true,
    carasPreparadas: true,
    modoCaras: 'grilla',
    allowLikes: true,
    allowComments: true,
    uploadsActive: true,
  };
  fPrep.carasIndexadas = armarCarasDePrueba();
  guardarFiesta(fPrep);
  guardarPostsEnArchivos(armarPostsDePrueba(ID_PREPARADA));

  // 3. Fiesta con interruptor apagado
  const fOff = crearFiestaDeEstaNoche({ id: ID_APAGADO });
  fOff.socialGallerySettings = {
    ...fOff.socialGallerySettings,
    enabled: true,
    carasPreparadas: true,
    modoCaras: 'apagado',
    allowLikes: true,
    allowComments: true,
    uploadsActive: true,
  };
  fOff.carasIndexadas = armarCarasDePrueba();
  guardarFiesta(fOff);
});

test.afterAll(() => {
  borrarFiesta(ID_SIN_PREPARAR);
  borrarFiesta(ID_PREPARADA);
  borrarFiesta(ID_APAGADO);
  borrarPostsDeArchivos(ID_PREPARADA);
});

test.describe('Orden 36: La grilla de caras', () => {
  test('con la fiesta sin preparar, el botón no aparece', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await page.goto(`/evento/galeria/${ID_SIN_PREPARAR}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Nunca un botón que no hace nada: el atajo de la selfie no debe existir
    const botonEncontrame = page.getByRole('button', { name: /Encontrame/i });
    await expect(botonEncontrame).toHaveCount(0);

    // La grilla de caras tampoco debe mostrarse
    const grillaCaras = page.locator('[data-testid="grilla-caras"]');
    await expect(grillaCaras).toHaveCount(0);
  });

  test('la grilla muestra caritas sin nombres y permite descargar las fotos de una persona', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await page.goto(`/evento/galeria/${ID_PREPARADA}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    // La grilla de caras debe ser visible
    const grilla = page.locator('[data-testid="grilla-caras"]');
    await expect(grilla).toBeVisible();

    // Deben haber 2 caras (Ana y Beto, el que pasaba por atrás se filtró)
    const caritas = grilla.locator('button');
    await expect(caritas).toHaveCount(2);

    // REGLA 2: NUNCA un nombre al lado de una cara
    const textoGrilla = await grilla.innerText();
    expect(textoGrilla.trim()).toBe(''); // Las caritas no tienen texto

    // Al tocar una cara se filtran sus fotos y aparece "Descargar todas"
    await caritas.first().click();
    await expect(page.getByText(/Fotos de esta persona/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Descargar todas/i })).toBeVisible();

    // Siempre a la vista: "Ver todas las fotos de la fiesta"
    const botonVerTodas = page.getByRole('button', { name: /Ver todas las fotos de la fiesta/i });
    await expect(botonVerTodas).toBeVisible();
    await botonVerTodas.click();

    // Vuelve a la galería completa
    await expect(page.getByText(/Fotos de esta persona/i)).toHaveCount(0);
  });

  test('con el interruptor apagado no se ve ni la grilla ni el botón', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await page.goto(`/evento/galeria/${ID_APAGADO}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    await expect(page.getByRole('button', { name: /Encontrame/i })).toHaveCount(0);
    await expect(page.locator('[data-testid="grilla-caras"]')).toHaveCount(0);
  });

  test('sin aceptar el permiso, la cámara no se prende y la galería sigue igual', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await page.goto(`/evento/galeria/${ID_PREPARADA}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const boton = page.getByRole('button', { name: /Encontrame a mí/i });
    await expect(boton).toBeVisible();
    await boton.click();

    // Debe mostrar el cartel de permiso claro
    await expect(
      page.getByText(/Vamos a mirar tu cara en este teléfono para buscar tus fotos\. No se guarda ni se manda a ningún lado\./i),
    ).toBeVisible();

    // Si cancela, el modal se cierra y la galería sigue igual
    await page.getByRole('button', { name: /Cancelar/i }).click();
    await expect(
      page.getByText(/Vamos a mirar tu cara en este teléfono/i),
    ).toHaveCount(0);
  });

  test('la selfie no sale del teléfono ni se manda a la red', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await enchufarCamara(page);

    // Monitoreamos toda llamada de red para verificar que NUNCA viaje una imagen
    const llamadasConImagenes: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      const postData = req.postData() || '';
      if (
        postData.includes('data:image') ||
        postData.includes('base64') ||
        /upload|selfie|face-api|tensor|ai-vision/i.test(url)
      ) {
        llamadasConImagenes.push(`${req.method()} ${url}`);
      }
    });

    await page.goto(`/evento/galeria/${ID_PREPARADA}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Abrir "Encontrame a mí"
    await page.getByRole('button', { name: /Encontrame a mí/i }).click();

    // Aceptar permiso
    await page.getByRole('button', { name: /Entendido, buscar mis fotos/i }).click();

    // Esperar a que tome los cuadros y cierre el modal
    await page.waitForTimeout(4000);

    // LA REGLA MÁS IMPORTANTE: Que no se dispare ninguna llamada al servidor con la imagen
    expect(llamadasConImagenes, 'la selfie no se envió a ningún servidor externo ni local').toHaveLength(0);

    // Debe mostrar la vista de resultados o el mensaje de "no encontramos".
    // Los dos titulos conviven en la pantalla, asi que hay que contar cuantos se
    // ven y no preguntar por "el" titulo: preguntando de a uno, Playwright corta
    // por ambiguedad (paso el 4 de septiembre de 2026).
    const titulos = page.getByRole('heading', {
      name: /Resultados de tu búsqueda|No encontramos fotos tuyas todavía/i,
    });
    let visibles = 0;
    for (let i = 0; i < (await titulos.count()); i += 1) {
      if (await titulos.nth(i).isVisible()) visibles += 1;
    }
    expect(visibles, 'muestra la pantalla de resultados, armada en el propio teléfono').toBeGreaterThan(0);
  });
});
