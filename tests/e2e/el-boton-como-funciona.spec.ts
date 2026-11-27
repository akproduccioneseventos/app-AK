import fs from 'fs';
import path from 'path';
import { test, expect } from '@playwright/test';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'tutoriales-settings.json');

test.use({ viewport: { width: 390, height: 844 } });

test.describe('Orden 350 - El botón ¿Cómo funciona? en pantallas externas', () => {
  test('con video cargado muestra el botón y abre modal YouTube nocookie; sin video no aparece', async ({ page }) => {
    const hadFile = fs.existsSync(SETTINGS_FILE);
    const previousContent = hadFile ? fs.readFileSync(SETTINGS_FILE, 'utf8') : null;

    try {
      fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
      fs.writeFileSync(
        SETTINGS_FILE,
        JSON.stringify(
          {
            simulador: {
              youtubeUrl: 'https://youtu.be/abc123',
              videoId: 'abc123',
            },
          },
          null,
          2,
        ),
        'utf8',
      );

      await page.goto('/simulador-de-presupuesto', { waitUntil: 'domcontentloaded' });
      const btn = page.locator('button[data-tutorial-clave="simulador"]').first();
      await expect(btn).toBeVisible({ timeout: 15000 });
      await expect(btn).toContainText('¿Cómo funciona?');

      await btn.click();
      const iframe = page.locator('iframe[src*="youtube-nocookie.com/embed/abc123"]');
      await expect(iframe).toBeVisible({ timeout: 10000 });

      const closeBtn = page.getByRole('button', { name: 'Cerrar tutorial' });
      await expect(closeBtn).toBeVisible();
      const box = await closeBtn.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
      await closeBtn.click();
      await expect(iframe).toBeHidden();

      // Sin video cargado para la clave, el botón NO debe aparecer
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify({}, null, 2), 'utf8');
      await page.goto('/simulador-de-presupuesto', { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
      await expect(page.locator('button[data-tutorial-clave="simulador"]')).toHaveCount(0);
    } finally {
      if (hadFile && previousContent !== null) {
        fs.writeFileSync(SETTINGS_FILE, previousContent, 'utf8');
      } else if (fs.existsSync(SETTINGS_FILE)) {
        fs.unlinkSync(SETTINGS_FILE);
      }
    }
  });
});
