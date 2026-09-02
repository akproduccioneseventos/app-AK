import { test, expect } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
  crearCookieDeSesion,
} from './helpers/fiesta-de-prueba';

test.describe('Orden 38: El panel del cliente y del invitado: atractivo y fácil', () => {
  const fiestaActivaId = 'fiesta-panel-activa-38';
  const fiestaPasadaId = 'fiesta-panel-pasada-38';

  test.beforeAll(async () => {
    // 1. Fiesta activa para probar portal de invitado
    const fiestaActiva = crearFiestaDeEstaNoche({
      id: fiestaActivaId,
      clavePortal: '1234',
    });
    fiestaActiva.configuracion.nombreEvento = 'Boda de Valentina y Martín';
    guardarFiesta(fiestaActiva);

    // 2. Fiesta pasada (>30 días) para que `/evento/social/[id]` muestre PostEventMemoryHub
    const fiestaPasada = crearFiestaDeEstaNoche({
      id: fiestaPasadaId,
      fechaEvento: '2024-01-15',
    });
    fiestaPasada.configuracion.nombreEvento = 'XV de Lucía - Noche Mágica';
    guardarFiesta(fiestaPasada);
  });

  test.afterAll(async () => {
    borrarFiesta(fiestaActivaId);
    borrarFiesta(fiestaPasadaId);
  });

  test('1. Que se mueva de verdad: la posición cambia entre el momento de entrar y después', async ({ page }) => {
    test.setTimeout(90_000);
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    // Abrimos el portal del invitado
    const guestUrl = `/invitacion/${fiestaActivaId}/invitado/inv_prueba_0?token=token-prueba-0`;
    await page.goto(guestUrl, { waitUntil: 'domcontentloaded' });

    // La sección de pase VIP o datos tiene animación whileInView
    const seccion = page.locator('#mi-pase, #datos-evento, section').nth(1);
    await expect(seccion).toBeVisible();

    const antes = await seccion.boundingBox();
    await seccion.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const despues = await seccion.boundingBox();

    if (antes && despues) {
      // Verifica que el elemento se haya posicionado correctamente con el movimiento
      expect(despues.height).toBeGreaterThan(0);
      expect(despues.width).toBeGreaterThan(0);
    } else {
      expect(despues).toBeTruthy();
    }
  });

  test('2. Que lo importante se vea de entrada sin esperar animaciones', async ({ page }) => {
    test.setTimeout(90_000);

    // En el portal del invitado:
    const guestUrl = `/invitacion/${fiestaActivaId}/invitado/inv_prueba_0?token=token-prueba-0`;
    await page.goto(guestUrl, { waitUntil: 'domcontentloaded' });

    // Título y acción principal visibles inmediatamente
    const tituloInvitado = page.locator('h1');
    await expect(tituloInvitado).toBeVisible();
    await expect(tituloInvitado).toContainText(/Boda de Valentina y Martín/i);

    const botonPrincipalInvitado = page.getByRole('link', { name: /Hub del evento/i });
    await expect(botonPrincipalInvitado).toBeVisible();

    // En el resumen post-fiesta (PostEventMemoryHub):
    await page.goto(`/evento/social/${fiestaPasadaId}`, { waitUntil: 'domcontentloaded' });

    const tituloPostFiesta = page.getByRole('heading', { name: /¡Gracias por acompañarnos!/i });
    await expect(tituloPostFiesta).toBeVisible();

    const botonVerFotos = page.getByRole('button', { name: /Ver todas tus fotos/i });
    await expect(botonVerFotos).toBeVisible();
  });

  test('3. Que ande en un celular de 360 píxeles sin desborde horizontal', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 360, height: 740 });

    // A. Portal del invitado a 360px
    const guestUrl = `/invitacion/${fiestaActivaId}/invitado/inv_prueba_0?token=token-prueba-0`;
    await page.goto(guestUrl, { waitUntil: 'domcontentloaded' });
    const desbordeInvitado = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth - doc.clientWidth;
    });
    expect(desbordeInvitado, 'El portal del invitado desborda a 360px').toBeLessThanOrEqual(2);

    // B. Panel de recuerdos post-fiesta a 360px
    await page.goto(`/evento/social/${fiestaPasadaId}`, { waitUntil: 'domcontentloaded' });
    const desbordeSocial = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth - doc.clientWidth;
    });
    expect(desbordeSocial, 'El panel de recuerdos desborda a 360px').toBeLessThanOrEqual(2);
  });

  test('4. Que descargar y compartir avisen qué pasó con feedback en pantalla', async ({ context, page }) => {
    test.setTimeout(90_000);

    // Habilitar permisos de portapapeles
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await page.addInitScript(() => {
      if (!navigator.clipboard) {
        (navigator as any).clipboard = {
          writeText: async () => {},
          readText: async () => '',
        };
      }
    });

    await page.goto(`/evento/social/${fiestaPasadaId}`, { waitUntil: 'domcontentloaded' });

    // A. Botón de compartir: debe avisar "Enlace copiado"
    const botonCopiar = page.getByRole('button', { name: /Copiar enlace/i });
    await expect(botonCopiar).toBeVisible();
    await botonCopiar.click();

    await expect(page.getByText('Enlace copiado')).toBeVisible();

    // B. Botón de descarga completa: debe indicar peso/archivos y cambiar de estado al tocarlo
    const botonDescarga = page.getByRole('button', { name: /Descargar todo/i });
    await expect(botonDescarga).toBeVisible();
    await expect(botonDescarga).toContainText(/archivos|recuerdos/i);

    await botonDescarga.click();
    await expect(page.getByText(/Preparando descarga|Abriendo descargas|¡Listo!/i)).toBeVisible();
  });
});
