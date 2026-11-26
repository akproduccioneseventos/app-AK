import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

test.use({ viewport: { width: 390, height: 844 } });

const EMPLEADOS_PATHS = [
  path.join(process.cwd(), 'data', 'empleados.json'),
  path.join(process.cwd(), 'src', 'data', 'empleados.json'),
];

test.describe('Orden 349 - Tercera auditoría del 25/11 en celular (390 px)', () => {
  test('en /simulador-ak el campo se ve y el botón enviar queda dentro de 390 px', async ({ page }) => {
    await page.goto('/simulador-ak', { waitUntil: 'domcontentloaded' });

    const input = page.locator('input[placeholder*="Sofía"]');
    await expect(input).toBeVisible({ timeout: 25_000 });
    const sendBtn = page.getByRole('button', { name: 'Enviar mensaje' });
    await expect(sendBtn).toBeVisible({ timeout: 15_000 });

    const inputBox = await input.boundingBox();
    const btnBox = await sendBtn.boundingBox();
    expect(inputBox?.width).toBeGreaterThan(120);
    expect(btnBox).not.toBeNull();
    expect((btnBox?.x ?? 0) + (btnBox?.width ?? 0)).toBeLessThanOrEqual(390);
  });

  test('en /empleados a 390 px se ve el teléfono de la persona sin deslizar', async ({ page, context }, testInfo) => {
    const baseURL = (testInfo.project.use.baseURL as string) || 'http://127.0.0.1:3100';
    await ponerSesionDelEquipo(context, baseURL);

    const backups = EMPLEADOS_PATHS.map((p) => ({
      path: p,
      existed: fs.existsSync(p),
      content: fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null,
    }));

    const empDemo = {
      id: 'emp_test_349_390px',
      nombre: 'Lucía Celular Prueba',
      cedula: '41234567',
      telefono: '099777888',
      rolIds: [],
    };

    try {
      for (const b of backups) {
        fs.mkdirSync(path.dirname(b.path), { recursive: true });
        const lista = b.content ? JSON.parse(b.content) : [];
        const actualizada = Array.isArray(lista)
          ? [...lista.filter((e: { id?: string }) => e?.id !== empDemo.id), empDemo]
          : [empDemo];
        fs.writeFileSync(b.path, JSON.stringify(actualizada, null, 2), 'utf8');
      }

      await page.goto('/empleados', { waitUntil: 'domcontentloaded' });
      const phone = page.getByText('099777888').first();
      await expect(phone).toBeVisible({ timeout: 25_000 });

      const box = await phone.boundingBox();
      expect(box).not.toBeNull();
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(390);
    } finally {
      for (const b of backups) {
        if (b.existed && b.content !== null) {
          fs.writeFileSync(b.path, b.content, 'utf8');
        } else if (fs.existsSync(b.path)) {
          fs.unlinkSync(b.path);
        }
      }
    }
  });
});
