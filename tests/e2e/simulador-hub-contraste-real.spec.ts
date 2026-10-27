import { test, expect, Locator } from '@playwright/test';

/**
 * Orden 231: Verificación de contraste real e inteligibilidad en /simulador.
 * Asegura que el título, subtítulo y opciones del hub mantengan contraste accesible
 * tanto en vista móvil como escritorio, sin ser transparentados por capas globales.
 */

const VIEWPORTS = [
  { nombre: 'móvil', width: 390, height: 844 },
  { nombre: 'escritorio', width: 1280, height: 720 },
];

async function obtenerContrasteElemento(locator: Locator) {
  return locator.evaluate((el) => {
    function parseRgb(colorStr: string): { r: number; g: number; b: number; a: number } {
      const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!match) {
        return { r: 255, g: 255, b: 255, a: 1 };
      }
      return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10),
        a: match[4] !== undefined ? parseFloat(match[4]) : 1,
      };
    }

    const fgColor = window.getComputedStyle(el).color;
    const fg = parseRgb(fgColor);

    // Subir por la cadena de ancestros hasta encontrar el primer fondo no transparente o componer alfa
    let curr: HTMLElement | null = el as HTMLElement;
    const layers: { r: number; g: number; b: number; a: number }[] = [];

    while (curr) {
      const bg = window.getComputedStyle(curr).backgroundColor;
      if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
        const parsed = parseRgb(bg);
        if (parsed.a > 0) {
          layers.push(parsed);
          if (parsed.a >= 1) break;
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

test.describe('Orden 231: Contraste real en Hub de Simulador (/simulador)', () => {
  for (const vp of VIEWPORTS) {
    test(`mantiene contraste legible en viewport ${vp.nombre} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/simulador', { waitUntil: 'domcontentloaded' });

      // 1. Título de sección h2
      const heading = page.getByRole('heading', { name: /Elegí la experiencia para cotizar tu fiesta/i });
      await expect(heading).toBeVisible({ timeout: 15000 });
      const boxHeading = await heading.boundingBox();
      expect(boxHeading).not.toBeNull();
      expect(boxHeading!.width).toBeGreaterThan(0);
      expect(boxHeading!.height).toBeGreaterThan(0);

      const contrasteHeading = await obtenerContrasteElemento(heading);
      expect(
        contrasteHeading.ratio,
        `Contraste de título h2 en ${vp.nombre} (${contrasteHeading.ratio.toFixed(2)}:1)`
      ).toBeGreaterThanOrEqual(4.5);

      // 2. Subtítulo explicativo
      const subtitulo = page.getByText(/Ambas herramientas cuentan con el catálogo oficial/i);
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

      // 3. Tres destinos: opción visual, opción Sofia asistente y link de WhatsApp
      const opcionVisual = page.locator('[data-testid="simulator-option-visual"]');
      const opcionAsistente = page.locator('[data-testid="simulator-option-assistant"]');
      const opcionWhatsApp = page.getByRole('link', { name: /Consultar por WhatsApp/i });

      const destinos = [
        { nombre: 'Opción Visual', locator: opcionVisual },
        { nombre: 'Opción Sofía Asistente', locator: opcionAsistente },
        { nombre: 'Opción WhatsApp', locator: opcionWhatsApp },
      ];

      for (const destino of destinos) {
        await expect(destino.locator).toBeVisible({ timeout: 15000 });
        const boxDestino = await destino.locator.boundingBox();
        expect(boxDestino).not.toBeNull();
        expect(boxDestino!.width).toBeGreaterThan(0);
        expect(boxDestino!.height).toBeGreaterThan(0);

        const contrasteDestino = await obtenerContrasteElemento(destino.locator);
        expect(
          contrasteDestino.ratio,
          `Contraste de ${destino.nombre} en ${vp.nombre} (${contrasteDestino.ratio.toFixed(2)}:1)`
        ).toBeGreaterThanOrEqual(3.0);
      }
    });
  }
});
