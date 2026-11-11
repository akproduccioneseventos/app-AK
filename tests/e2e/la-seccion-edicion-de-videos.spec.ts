import { expect, test } from '@playwright/test';
import { ponerSesionDelEquipo, SESSION_SECRET } from './helpers/fiesta-de-prueba';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function crearCookieSinAdmin() {
  const payload = `v1.${Date.now() + 60 * 60 * 1000}.${crypto.randomUUID()}.${encodeURIComponent(
    JSON.stringify({ email: 'mozo@akproducciones.com', role: 'mozo', userId: 'mozo-1', perfil: 'mozo' }),
  )}`;
  return encodeURIComponent(`${payload}.${crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')}`);
}

test.describe('Sección Edición de Videos (Orden 271)', () => {
  test('un usuario sin permiso de administración ve la pantalla de acceso restringido', async ({
    page,
    context,
    baseURL,
  }) => {
    test.setTimeout(60_000);

    await context.addInitScript(() => {
      window.localStorage.setItem('ak_session', 'true');
      window.sessionStorage.setItem('ak_session', 'true');
    });
    await context.addCookies([
      {
        name: 'ak_session',
        value: crearCookieSinAdmin(),
        url: baseURL,
        httpOnly: true,
        sameSite: 'Lax' as const,
      },
    ]);

    await page.goto(`${baseURL}/edicion-videos`);
    await page.waitForLoadState('networkidle');

    // Debe mostrar la tarjeta de Acceso Restringido
    await expect(page.getByText('Acceso Restringido')).toBeVisible();
    await expect(page.getByText('La sección de Edición de Videos está reservada')).toBeVisible();
  });

  test('el administrador accede a la sección, ve los botones y puede descargar ak-editor.zip no vacío', async ({
    page,
    context,
    baseURL,
  }) => {
    test.setTimeout(60_000);
    await ponerSesionDelEquipo(context, baseURL);

    await page.goto(`${baseURL}/edicion-videos`);
    await page.waitForLoadState('networkidle');

    // 1. Título y encabezado principal
    await expect(page.getByRole('heading', { name: 'AK Editor Inteligente' })).toBeVisible();

    // 2. Botón "Bajar AK Editor"
    const botonBajar = page.getByRole('link', { name: /Bajar AK Editor/i }).first();
    await expect(botonBajar).toBeVisible();
    await expect(botonBajar).toHaveAttribute('href', '/descargas/ak-editor.zip');

    // 3. Botón "Abrir AK Editor"
    const botonAbrir = page.getByRole('link', { name: /Abrir AK Editor/i }).first();
    await expect(botonAbrir).toBeVisible();
    await expect(botonAbrir).toHaveAttribute('href', 'http://localhost:8765');
    await expect(botonAbrir).toHaveAttribute('target', '_blank');

    // 4. Los 3 pasos en criollo
    await expect(page.getByText('Bajar el programa')).toBeVisible();
    await expect(page.getByText('Instalar en un clic')).toBeVisible();
    await expect(page.getByText('Abrir y editar')).toBeVisible();

    // 5. Descarga del archivo ak-editor.zip y verificación de contenido no vacío
    const downloadPromise = page.waitForEvent('download');
    await botonBajar.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('ak-editor.zip');
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    if (downloadPath) {
      const stats = fs.statSync(downloadPath);
      expect(stats.size).toBeGreaterThan(1000);
    }
  });

  test('el archivo empaquetado ak-editor.zip en public/descargas existe y es un zip válido', async () => {
    const rutaZip = path.join(process.cwd(), 'public', 'descargas', 'ak-editor.zip');
    expect(fs.existsSync(rutaZip)).toBe(true);

    const stats = fs.statSync(rutaZip);
    expect(stats.size).toBeGreaterThan(5000);

    // Los primeros 4 bytes de un archivo ZIP válido son siempre PK\x03\x04
    const buffer = Buffer.alloc(4);
    const fd = fs.openSync(rutaZip, 'r');
    fs.readSync(fd, buffer, 0, 4, 0);
    fs.closeSync(fd);

    expect(buffer[0]).toBe(0x50); // P
    expect(buffer[1]).toBe(0x4b); // K
    expect(buffer[2]).toBe(0x03);
    expect(buffer[3]).toBe(0x04);
  });
});
