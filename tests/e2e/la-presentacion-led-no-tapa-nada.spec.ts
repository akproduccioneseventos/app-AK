import { expect, test, type Page } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

const VIEWPORTS = [
  { name: '1600x900', width: 1600, height: 900 },
  { name: '1280x720', width: 1280, height: 720 },
] as const;

async function verificarLaminaSinSolapesNiRotas(page: Page, pasoLabel: string) {
  const stage = page.getByTestId('presentacion-slide-stage');
  const navBar = page.getByTestId('presentacion-nav-bar');
  const nextBtn = page.getByTestId('btn-siguiente-slide');

  await expect(stage).toBeVisible();
  await expect(navBar).toBeVisible();

  // El área de láminas nunca debe invadir la barra inferior de navegación.
  const layoutCheck = await page.evaluate(() => {
    const stageEl = document.querySelector('[data-testid="presentacion-slide-stage"]');
    const navEl = document.querySelector('[data-testid="presentacion-nav-bar"]');
    const nextEl = document.querySelector('[data-testid="btn-siguiente-slide"]');
    if (!stageEl || !navEl || !nextEl) {
      return { ok: false, reason: 'Faltan contenedores de stage o navBar' };
    }
    const stageRect = stageEl.getBoundingClientRect();
    const navRect = navEl.getBoundingClientRect();
    const nextRect = nextEl.getBoundingClientRect();

    if (stageRect.bottom > navRect.top + 1) {
      return {
        ok: false,
        reason: `Stage bottom (${stageRect.bottom}) pisa navBar top (${navRect.top})`,
      };
    }
    if (stageRect.bottom > nextRect.top + 1) {
      return {
        ok: false,
        reason: `Stage bottom (${stageRect.bottom}) pisa Siguiente top (${nextRect.top})`,
      };
    }

    // Al scrollear al fondo del área scrolleable, el último contenido queda por encima de navBar.
    const scroller = stageEl.querySelector('[data-testid="presentacion-slide-scroll"]') as HTMLElement | null;
    if (scroller) {
      scroller.scrollTop = scroller.scrollHeight;
    }

    const targets = Array.from(
      stageEl.querySelectorAll('button, a, [data-testid="servicio-card"], [data-testid="regalo-card"]'),
    ) as HTMLElement[];

    for (const el of targets) {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;

      const visibleTop = Math.max(rect.top, stageRect.top);
      const visibleBottom = Math.min(rect.bottom, stageRect.bottom);
      if (visibleBottom <= visibleTop) continue;

      const overlapsNav =
        rect.right > navRect.left &&
        rect.left < navRect.right &&
        visibleBottom > navRect.top + 1 &&
        visibleTop < navRect.bottom;

      if (overlapsNav) {
        return {
          ok: false,
          reason: `Elemento "${(el.textContent || '').trim().slice(0, 40)}" cruza la barra inferior`,
        };
      }
    }

    if (scroller) {
      scroller.scrollTop = 0;
    }

    return { ok: true, reason: '' };
  });

  expect(layoutCheck.ok, `[${pasoLabel}] ${layoutCheck.reason}`).toBe(true);

  // Todas las imágenes visibles dentro de la lámina deben cargar con naturalWidth > 0.
  const imgResult = await page.evaluate(async () => {
    const stageEl = document.querySelector('[data-testid="presentacion-slide-stage"]');
    if (!stageEl) return { total: 0, broken: [] as string[] };
    const imgs = Array.from(stageEl.querySelectorAll('img')) as HTMLImageElement[];

    await Promise.all(
      imgs.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          const timer = window.setTimeout(resolve, 4000);
          img.addEventListener('load', () => {
            window.clearTimeout(timer);
            resolve();
          }, { once: true });
          img.addEventListener('error', () => {
            window.clearTimeout(timer);
            resolve();
          }, { once: true });
        });
      }),
    );

    const broken: string[] = [];
    for (const img of imgs) {
      const style = window.getComputedStyle(img);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      const rect = img.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      // Rota = el navegador terminó y no pudo dibujarla. Una foto con carga diferida fuera de la vista todavía no se pidió.
      if (img.complete && img.naturalWidth === 0) {
        broken.push(img.getAttribute('src') || img.alt || 'img');
      }
    }
    return { total: imgs.length, broken };
  });

  expect(imgResult.broken, `[${pasoLabel}] Imágenes rotas: ${imgResult.broken.join(', ')}`).toEqual([]);

  // En láminas de servicios y regalos, nunca se repite el mismo src entre tarjetas.
  const duplicateCheck = await page.evaluate(() => {
    const stageEl = document.querySelector('[data-testid="presentacion-slide-stage"]');
    if (!stageEl) return { servicioDupes: [] as string[], regaloDupes: [] as string[] };

    const getSrcs = (selector: string) =>
      Array.from(stageEl.querySelectorAll(`${selector} img`))
        .map((img) => (img as HTMLImageElement).getAttribute('src') || '')
        .filter(Boolean);

    const findDupes = (list: string[]) => {
      const seen = new Set<string>();
      const dupes: string[] = [];
      for (const item of list) {
        if (seen.has(item)) dupes.push(item);
        seen.add(item);
      }
      return dupes;
    };

    return {
      servicioDupes: findDupes(getSrcs('[data-testid="servicio-card"]')),
      regaloDupes: findDupes(getSrcs('[data-testid="regalo-card"]')),
    };
  });

  expect(
    duplicateCheck.servicioDupes,
    `[${pasoLabel}] Fotos repetidas en servicios: ${duplicateCheck.servicioDupes.join(', ')}`,
  ).toEqual([]);
  expect(
    duplicateCheck.regaloDupes,
    `[${pasoLabel}] Fotos repetidas en regalos: ${duplicateCheck.regaloDupes.join(', ')}`,
  ).toEqual([]);
}

test.describe('Orden 344 - Presentación LED sin solapes, sin fotos repetidas y sin imágenes rotas', () => {
  for (const vp of VIEWPORTS) {
    test(`recorre todas las láminas en ${vp.name} (15 años, 120 invitados)`, async ({ context, page }, testInfo) => {
      test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con el proyecto desktop.');
      test.setTimeout(150_000);

      await page.setViewportSize({ width: vp.width, height: vp.height });
      const baseURL = (testInfo.project.use.baseURL as string) || 'http://127.0.0.1:3100';
      await ponerSesionDelEquipo(context, baseURL);

      await page.goto('/presentacion-led', { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await expect(page.getByText(/Cargando presentaci/i)).toBeHidden({ timeout: 60_000 });
      await page.waitForTimeout(350);

      // Lámina 0: Portada
      await verificarLaminaSinSolapesNiRotas(page, `${vp.name} - Slide 0 (Portada)`);

      const nextBtn = page.getByTestId('btn-siguiente-slide');

      // Avanzar hasta Datos del Evento y completar 15 años, 120 invitados
      for (let i = 1; i <= 35; i++) {
        if (await nextBtn.isDisabled()) break;
        await nextBtn.click();
        await page.waitForTimeout(260);

        const inputNombre = page.locator('input[placeholder*="María"]').first();
        if (await inputNombre.isVisible().catch(() => false)) {
          await inputNombre.fill('Sofía 15 Años');
          await page.locator('select').first().selectOption('Cumpleaños 15');
          await page.locator('input[type="date"]').first().fill('2027-10-15');
          await page.locator('input[placeholder="Ej: 100"]').first().fill('100');
          await page.locator('input[placeholder="Ej: 15"]').first().fill('20');
          await page.getByRole('button', { name: /Más de 4 horas/i }).click();
          await page.waitForTimeout(200);
        }

        await verificarLaminaSinSolapesNiRotas(page, `${vp.name} - Slide ${i}`);
      }
    });
  }
});
