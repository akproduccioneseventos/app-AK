import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { borrarFiesta, crearFiestaDeEstaNoche, guardarFiesta } from './helpers/fiesta-de-prueba';

/**
 * El mural a pantalla completa: que ocupe la ventana y que lo pintado se vea.
 *
 * Defecto que cubre (orden 150): la regla de marca `.ak-red-premium-live > *`
 * le ponia `position: relative` al raiz del mural (que declara `fixed inset-0`),
 * el raiz perdia su alto, el panel central media 0 px y el mural quedaba vacio
 * o recortado. `toBeVisible` pasa igual en ese caso, asi que aca se mide la
 * geometria y se pregunta que elemento recibe el punto del centro.
 */

const FOTO = '/media/catalogo-servicios/barra-tragos-ak-01.jpeg';

/** Las fotos del muro se leen de social-gallery/metadata.json (igual que el-muro-se-configura). */
function archivosDeFotos() {
  return ['data', path.join('src', 'data')].map((c) => path.join(process.cwd(), c, 'social-gallery', 'metadata.json'));
}

function sembrarFoto(id: string) {
  const post = {
    id: `post_geom_${id}`,
    fiestaId: id,
    imageUrl: FOTO,
    authorName: 'Invitado geometria',
    caption: 'Foto aprobada de geometria',
    timestamp: new Date(Date.now() - 60_000).toISOString(),
    approved: true,
    moderationStatus: 'approved',
    mediaType: 'image',
    likes: 0,
  };
  for (const archivo of archivosDeFotos()) {
    let lista: any[] = [];
    try { lista = JSON.parse(fs.readFileSync(archivo, 'utf8')); } catch {}
    fs.mkdirSync(path.dirname(archivo), { recursive: true });
    fs.writeFileSync(archivo, `${JSON.stringify([...lista.filter((p) => p.fiestaId !== id), post], null, 2)}\n`);
  }
}

function quitarFoto(id: string) {
  for (const archivo of archivosDeFotos()) {
    try {
      const lista = JSON.parse(fs.readFileSync(archivo, 'utf8'));
      fs.writeFileSync(archivo, `${JSON.stringify(lista.filter((p: any) => p.fiestaId !== id), null, 2)}\n`);
    } catch {}
  }
}

function armarFiesta(id: string, conFoto: boolean) {
  const fiesta: any = crearFiestaDeEstaNoche({ id });
  fiesta.socialWallEnabled = true;
  fiesta.socialGallerySettings = {
    ...fiesta.socialGallerySettings,
    enabled: true,
    privateDedicationsMode: false,
    forcedScreenItem: 'mural',
  };
  guardarFiesta(fiesta);
  if (conFoto) sembrarFoto(id);
}

async function medirRaizYPanel(page: Page) {
  return page.evaluate(() => {
    const raiz = document.querySelector('.ak-live-stage') as HTMLElement | null;
    const r = raiz?.getBoundingClientRect();
    // El panel central es el contenedor `flex-1` que contiene el vacio o las fotos.
    const contenido = document.querySelector('[data-testid="live-wall-empty"]') || document.querySelector('.ak-live-stage img[src*="barra-tragos"]');
    let panel: HTMLElement | null = contenido as HTMLElement | null;
    while (panel && panel !== raiz) {
      const hijoDeFlexColumn = panel.parentElement === raiz;
      if (hijoDeFlexColumn) break;
      panel = panel.parentElement;
    }
    const p = panel?.getBoundingClientRect();
    return {
      ventana: { w: innerWidth, h: innerHeight },
      posicionRaiz: raiz ? getComputedStyle(raiz).position : null,
      altoRaiz: r?.height ?? 0,
      altoPanel: p?.height ?? 0,
    };
  });
}

test.describe('mural a pantalla completa', () => {
  test('mural vacio: la escena ocupa la ventana y el titulo esta pintado', async ({ page }, info) => {
    test.setTimeout(150_000);
    const id = `e2e_geom_vacio_${info.project.name}_${Date.now()}`;
    armarFiesta(id, false);
    try {
      const resp = await page.goto(`/evento/muro-en-vivo/${id}`, { waitUntil: 'domcontentloaded' });
      expect(resp?.status()).toBe(200);
      await expect(page.getByTestId('live-wall-empty')).toBeVisible({ timeout: 60_000 });
      await page.waitForTimeout(3_000);

      const m = await medirRaizYPanel(page);
      expect(m.posicionRaiz, 'el raiz del mural sigue fijo a la ventana').toBe('fixed');
      expect(m.altoRaiz, 'el raiz mide casi todo el alto de la ventana').toBeGreaterThanOrEqual(m.ventana.h * 0.9);
      expect(m.altoPanel, 'el panel central tiene alto de verdad').toBeGreaterThan(300);

      const recibe = await page.evaluate(() => {
        const t = document.querySelector('[data-testid="live-wall-empty"] h1, [data-testid="live-wall-empty"] h2') as HTMLElement | null;
        if (!t) return { hayTitulo: false, recibe: false };
        const r = t.getBoundingClientRect();
        const x = Math.max(0, Math.min(innerWidth - 1, r.x + r.width / 2));
        const y = Math.max(0, Math.min(innerHeight - 1, r.y + r.height / 2));
        const top = document.elementFromPoint(x, y);
        return { hayTitulo: true, recibe: !!top && (t === top || t.contains(top)), alto: r.height, y };
      });
      expect(recibe.hayTitulo, 'el cartel de mural vacio tiene titulo').toBe(true);
      expect(recibe.recibe, 'el titulo es lo que se ve en su centro, no esta recortado ni tapado').toBe(true);
    } finally {
      borrarFiesta(id);
    }
  });

  test('con una foto aprobada: la imagen carga y su caja esta dentro de la ventana', async ({ page }, info) => {
    test.setTimeout(150_000);
    const id = `e2e_geom_foto_${info.project.name}_${Date.now()}`;
    armarFiesta(id, true);
    try {
      const resp = await page.goto(`/evento/muro-en-vivo/${id}`, { waitUntil: 'domcontentloaded' });
      expect(resp?.status()).toBe(200);
      const img = page.locator('.ak-live-stage img[src*="barra-tragos-ak-01"]').first();
      await img.waitFor({ state: 'attached', timeout: 60_000 });
      await page.waitForTimeout(3_000);

      const m = await medirRaizYPanel(page);
      expect(m.altoRaiz).toBeGreaterThanOrEqual(m.ventana.h * 0.9);
      expect(m.altoPanel, 'el panel central tiene alto de verdad').toBeGreaterThan(300);

      const caja = await img.evaluate((el: HTMLImageElement) => {
        const r = el.getBoundingClientRect();
        return { natural: el.naturalWidth, x: r.x, y: r.y, w: r.width, h: r.height, vw: innerWidth, vh: innerHeight, opacidad: getComputedStyle(el).opacity };
      });
      expect(caja.natural, 'la imagen se decodifico').toBeGreaterThan(0);
      expect(caja.w, 'la imagen tiene ancho').toBeGreaterThan(50);
      expect(caja.h, 'la imagen tiene alto').toBeGreaterThan(50);
      // Un pedazo real de la foto cae dentro de la ventana (no quedo fuera ni a 0 px).
      const visibleW = Math.min(caja.x + caja.w, caja.vw) - Math.max(caja.x, 0);
      const visibleH = Math.min(caja.y + caja.h, caja.vh) - Math.max(caja.y, 0);
      expect(visibleW, 'se ve ancho de la foto dentro de la ventana').toBeGreaterThan(50);
      expect(visibleH, 'se ve alto de la foto dentro de la ventana').toBeGreaterThan(50);
    } finally {
      quitarFoto(id);
      borrarFiesta(id);
    }
  });
});
