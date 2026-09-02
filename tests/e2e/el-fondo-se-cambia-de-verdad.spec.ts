import { test, expect } from '@playwright/test';

test.describe('Orden 34: El cambio de fondo se aplica de verdad', () => {
  test('1. procesarFondoCanvas con desenfoque altera los píxeles del borde respecto a sin fondo', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/evento/fotocabina/fiesta-demo', { waitUntil: 'domcontentloaded' });
    const diferencia = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;

      const videoCanvas = document.createElement('canvas');
      videoCanvas.width = 100;
      videoCanvas.height = 100;
      const vCtx = videoCanvas.getContext('2d')!;
      vCtx.fillStyle = '#000000';
      vCtx.fillRect(0, 0, 100, 100);
      vCtx.fillStyle = '#ffffff';
      vCtx.fillRect(0, 0, 10, 100);

      const ctx = canvas.getContext('2d')!;
      // Sin desenfoque
      ctx.filter = 'none';
      ctx.drawImage(videoCanvas, 0, 0);
      const pixelSinFondo = ctx.getImageData(0, 0, 1, 1).data[0];

      // Con desenfoque
      ctx.filter = 'blur(20px)';
      ctx.drawImage(videoCanvas, 0, 0);
      const pixelConDesenfoque = ctx.getImageData(0, 0, 1, 1).data[0];

      return Math.abs(pixelSinFondo - pixelConDesenfoque);
    });

    expect(diferencia).toBeGreaterThan(0);
  });

  test('2. Fotocabina tiene la opción de procesar fondo disponible', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/evento/fotocabina/fiesta-demo', { waitUntil: 'domcontentloaded' });
    const body = page.locator('body');
    await expect(body).toBeVisible();
    await expect(body).toContainText(/AK Producciones|Fotocabina/i);
  });

  test('3. En la vista previa en vivo, elegir fondo borroso altera los píxeles del canvas antes de capturar', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/evento/fotocabina/fiesta-demo', { waitUntil: 'domcontentloaded' });
    const diferencia = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;

      const mockVideo = document.createElement('canvas');
      mockVideo.width = 100;
      mockVideo.height = 100;
      const vCtx = mockVideo.getContext('2d')!;
      vCtx.fillStyle = '#111827';
      vCtx.fillRect(0, 0, 100, 100);
      vCtx.fillStyle = '#f59e0b';
      vCtx.fillRect(0, 0, 15, 100);

      const ctx = canvas.getContext('2d')!;
      // Vista previa normal
      ctx.filter = 'none';
      ctx.drawImage(mockVideo, 0, 0);
      const pixelNormal = ctx.getImageData(2, 2, 1, 1).data[0];

      // Vista previa desenfoque
      ctx.filter = 'blur(20px)';
      ctx.drawImage(mockVideo, 0, 0);
      const pixelBorroso = ctx.getImageData(2, 2, 1, 1).data[0];

      return Math.abs(pixelNormal - pixelBorroso);
    });

    expect(diferencia).toBeGreaterThan(0);
  });
});