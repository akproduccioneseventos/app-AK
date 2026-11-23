import { test, expect, Locator } from '@playwright/test';

/**
 * Orden 334 Bloque 3: Verificación de contraste real en /simulador (redirige a /simulador-de-presupuesto).
 */

const VIEWPORTS = [
  { nombre: 'móvil', width: 390, height: 844 },
  { nombre: 'escritorio', width: 1280, height: 720 },
];

async function obtenerContrasteElemento(locator: Locator) {
  return locator.evaluate((el) => {
    const probeCanvas = document.createElement('canvas');
    probeCanvas.width = 1;
    probeCanvas.height = 1;
    const probeCtx = probeCanvas.getContext('2d');

    function parseCssColor(colorStr: string): { r: number; g: number; b: number; a: number } {
      const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (match) {
        return {
          r: parseInt(match[1], 10),
          g: parseInt(match[2], 10),
          b: parseInt(match[3], 10),
          a: match[4] !== undefined ? parseFloat(match[4]) : 1,
        };
      }
      if (probeCtx) {
        probeCtx.clearRect(0, 0, 1, 1);
        probeCtx.fillStyle = colorStr;
        probeCtx.fillRect(0, 0, 1, 1);
        const data = probeCtx.getImageData(0, 0, 1, 1).data;
        return { r: data[0], g: data[1], b: data[2], a: data[3] / 255 };
      }
      return { r: 255, g: 255, b: 255, a: 1 };
    }

    const fgColor = window.getComputedStyle(el).color;
    const fg = parseCssColor(fgColor);

    let curr: HTMLElement | null = el as HTMLElement;
    const layers: { r: number; g: number; b: number; a: number }[] = [];
    const elRect = el.getBoundingClientRect();

    while (curr) {
      const bg = window.getComputedStyle(curr).backgroundColor;
      if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
        const parsed = parseCssColor(bg);
        if (parsed.a > 0) {
          layers.push(parsed);
          if (parsed.a >= 1) break;
        }
      }
      // Revisar overlays absolutos hermanos que cubran el elemento (ej: bg-black/65 en hero)
      if (curr.parentElement) {
        const siblings = Array.from(curr.parentElement.children) as HTMLElement[];
        for (const sib of siblings) {
          if (sib === curr) break;
          const sibStyle = window.getComputedStyle(sib);
          if (sibStyle.position !== 'absolute') continue;
          const sibRect = sib.getBoundingClientRect();
          const covers =
            sibRect.left <= elRect.left + 1 &&
            sibRect.right >= elRect.right - 1 &&
            sibRect.top <= elRect.top + 1 &&
            sibRect.bottom >= elRect.bottom - 1;
          if (!covers) continue;
          const sibBg = sibStyle.backgroundColor;
          if (sibBg && sibBg !== 'transparent' && sibBg !== 'rgba(0, 0, 0, 0)') {
            const parsedSib = parseCssColor(sibBg);
            if (parsedSib.a > 0) {
              layers.push(parsedSib);
            }
          }
        }
      }
      curr = curr.parentElement;
    }

    let bgR = 255;
    let bgG = 255;
    let bgB = 255;
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      bgR = Math.round(layer.r * layer.a + bgR * (1 - layer.a));
      bgG = Math.round(layer.g * layer.a + bgG * (1 - layer.a));
      bgB = Math.round(layer.b * layer.a + bgB * (1 - layer.a));
    }

    function luminance(r: number, g: number, b: number): number {
      const a = [r, g, b].map((v) => {
        const c = v / 255;
        return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    }

    const l1 = luminance(fg.r, fg.g, fg.b);
    const l2 = luminance(bgR, bgG, bgB);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    return {
      ratio,
      foreground: [fg.r, fg.g, fg.b],
      background: [bgR, bgG, bgB],
    };
  });
}

test.describe('Orden 334 Bloque 3: Contraste real en Simulador de Presupuesto (/simulador)', () => {
  for (const vp of VIEWPORTS) {
    test(`mantiene contraste legible en viewport ${vp.nombre} (${vp.width}x${vp.height})`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/simulador', { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(/\/simulador-de-presupuesto/);

      // 1. Título principal h1
      const heading = page.getByRole('heading', { name: /Presupuesto para tu evento/i });
      await expect(heading).toBeVisible({ timeout: 15000 });
      const boxHeading = await heading.boundingBox();
      expect(boxHeading).not.toBeNull();
      expect(boxHeading!.width).toBeGreaterThan(0);
      expect(boxHeading!.height).toBeGreaterThan(0);

      const contrasteHeading = await obtenerContrasteElemento(heading);
      expect(
        contrasteHeading.ratio,
        `Contraste de título h1 en ${vp.nombre} (${contrasteHeading.ratio.toFixed(2)}:1)`
      ).toBeGreaterThanOrEqual(4.5);

      // 2. Subtítulo explicativo
      const subtitulo = page.getByText(/Armá una propuesta con gastronomía, salón, tecnología y servicios reales/i);
      await expect(subtitulo).toBeVisible({ timeout: 15000 });
      const boxSubtitulo = await subtitulo.boundingBox();
      expect(boxSubtitulo).not.toBeNull();
      expect(boxSubtitulo!.width).toBeGreaterThan(0);
      expect(boxSubtitulo!.height).toBeGreaterThan(0);

      const contrasteSubtitulo = await obtenerContrasteElemento(subtitulo);
      expect(
        contrasteSubtitulo.ratio,
        `Contraste de subtítulo en ${vp.nombre} (${contrasteSubtitulo.ratio.toFixed(2)}:1)`
      ).toBeGreaterThanOrEqual(4.5);

      // 3. Botón principal de cover
      const botonCover = page.getByTestId('simulator-cover-start');
      await expect(botonCover).toBeVisible({ timeout: 15000 });
      const boxBoton = await botonCover.boundingBox();
      expect(boxBoton).not.toBeNull();
      expect(boxBoton!.width).toBeGreaterThan(0);
      expect(boxBoton!.height).toBeGreaterThan(0);

      const contrasteBoton = await obtenerContrasteElemento(botonCover);
      expect(
        contrasteBoton.ratio,
        `Contraste de botón principal en ${vp.nombre} (${contrasteBoton.ratio.toFixed(2)}:1)`
      ).toBeGreaterThanOrEqual(3.0);

      await expect(botonCover).toBeEnabled({ timeout: 30000 });
      await botonCover.click();

      // 4. Enlace al pie hacia Sofía
      const enlaceSofia = page.getByRole('link', { name: /Preferís armarlo conversando\? Probá con Sofía/i });
      await expect(enlaceSofia).toBeVisible({ timeout: 15000 });
      await expect(enlaceSofia).toHaveAttribute('href', /\/simulador-ak/);
      const boxSofia = await enlaceSofia.boundingBox();
      expect(boxSofia).not.toBeNull();
      expect(boxSofia!.width).toBeGreaterThan(0);
      expect(boxSofia!.height).toBeGreaterThan(0);

      const contrasteSofia = await obtenerContrasteElemento(enlaceSofia);
      expect(
        contrasteSofia.ratio,
        `Contraste de enlace a Sofía en ${vp.nombre} (${contrasteSofia.ratio.toFixed(2)}:1)`
      ).toBeGreaterThanOrEqual(3.0);

      // 5. Navegar al enlace de Sofía y verificar
      await enlaceSofia.click();
      await expect(page).toHaveURL(/\/simulador-ak/);
      const headingSofia = page.getByRole('heading', { name: /Asistente Inteligente AK/i });
      await expect(headingSofia).toBeVisible({ timeout: 15000 });
      const contrasteHeadingSofia = await obtenerContrasteElemento(headingSofia);
      expect(
        contrasteHeadingSofia.ratio,
        `Contraste de título de Sofía en ${vp.nombre} (${contrasteHeadingSofia.ratio.toFixed(2)}:1)`
      ).toBeGreaterThanOrEqual(4.5);
    });
  }
});
