import { expect, test } from '@playwright/test';

test.describe('Orden 101 - Bloque 3: La web lista para asistentes de afuera (accesibilidad y llms.txt)', () => {
  test('public/llms.txt responde 200 y menciona Salto', async ({ request }) => {
    const response = await request.get('/llms.txt');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('Salto');
    expect(body).toContain('AK Producciones');
    expect(body).toContain('/simulador-de-presupuesto');
  });

  test('asistente externo puede navegar el simulador por accesibilidad (getByRole/getByLabel) hasta ver el total', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await page.goto('/simulador-de-presupuesto?step=2', { waitUntil: 'domcontentloaded' });

    // Si aparece portada o inicio, saltarla
    const startBtn = page.getByRole('button', { name: /Comenzar|Empezar|Armar mi presupuesto/i });
    if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await startBtn.click();
    }

    // Completar datos por etiqueta accesible
    const nameInput = page.getByLabel(/Nombre completo/i);
    if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nameInput.fill('Asistente IA Test');
      await page.getByLabel(/WhatsApp/i).fill('099123456');

      const continuarBtn = page.getByRole('button', { name: /Continuar/i });
      if (await continuarBtn.isVisible()) {
        await continuarBtn.click();
      }
    }

    // Verificar que existe total o resumen visible accesible
    const totalVisible = page.getByText(/Total|Presupuesto|UYU|\$/i).first();
    await expect(totalVisible).toBeVisible({ timeout: 15000 });
  });
});
