import { expect, test } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';
import fs from 'node:fs';
import path from 'node:path';

test.describe('Centro de Control (Orden 236)', () => {
  const propuestasPath = path.join(process.cwd(), 'data', 'asistente-propuestas.json');
  let originalPropuestas: string | null = null;
  const propId = `prop_e2e_test_${Date.now()}`;

  test.beforeEach(async () => {
    if (fs.existsSync(propuestasPath)) {
      originalPropuestas = fs.readFileSync(propuestasPath, 'utf8');
    }
    const propTest = {
      id: propId,
      clave: `e2e-ok-${Date.now()}`,
      area: 'fiestas',
      titulo: 'Confirmar recepción de catering para fiesta de Sofía',
      quePasa: 'El catering envió la confirmación final de platos.',
      porQueImporta: 'Permite cerrar la hoja de cocina a tiempo.',
      quePropone: 'Marcar el catering como verificado y notificar al salón.',
      estado: 'pendiente',
      clienteNombre: 'Sofía E2E',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let lista: any[] = [];
    try {
      if (originalPropuestas) lista = JSON.parse(originalPropuestas);
    } catch {}
    fs.writeFileSync(propuestasPath, JSON.stringify([propTest, ...lista], null, 2), 'utf8');
  });

  test.afterEach(async () => {
    if (originalPropuestas !== null) {
      fs.writeFileSync(propuestasPath, originalPropuestas, 'utf8');
    } else if (fs.existsSync(propuestasPath)) {
      fs.unlinkSync(propuestasPath);
    }
  });

  test('verifica que existan las 3 pestañas y que al tocar "No" la tarjeta desaparece', async ({
    page,
    context,
    baseURL,
  }) => {
    test.setTimeout(60_000);
    await ponerSesionDelEquipo(context, baseURL);

    await page.goto(`${baseURL}/centro-de-control`);
    await page.waitForLoadState('networkidle');

    // 1. Verifica que existan las 3 pestañas con sus nombres EXACTOS
    const pestanaOk = page.getByRole('tab', { name: /Para tu OK/i });
    const pestanaReglas = page.getByRole('tab', { name: /Tus reglas/i });
    const pestanaSola = page.getByRole('tab', { name: /Lo que hizo sola/i });

    await expect(pestanaOk).toBeVisible();
    await expect(pestanaReglas).toBeVisible();
    await expect(pestanaSola).toBeVisible();

    // 2. Verifica la presencia de la tarjeta en "Para tu OK"
    const tarjeta = page.locator('div', {
      hasText: 'Confirmar recepción de catering para fiesta de Sofía',
    }).last();
    await expect(tarjeta).toBeVisible();

    // 3. Toca el botón "No"
    const botonNo = tarjeta.getByRole('button', { name: /^No$/i });
    await expect(botonNo).toBeVisible();
    await botonNo.click();

    // 4. Verifica que la tarjeta desaparece inmediatamente de la vista
    await expect(page.getByText('Confirmar recepción de catering para fiesta de Sofía')).not.toBeVisible();
  });
});
