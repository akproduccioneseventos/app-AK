import { expect, test } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';
import fs from 'node:fs';
import path from 'node:path';

test.describe('Centro de Control (Orden 236)', () => {
  const propuestasPath = path.join(process.cwd(), 'data', 'asistente-propuestas.json');
  let originalPropuestas: string | null = null;
  // Título único por corrida y por proyecto (escritorio y celular corren a la vez): si no, quedan
  // tarjetas repetidas de corridas anteriores y el "No" cae en otra.
  const propId = `prop_e2e_test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const tituloUnico = `Confirmar recepción de catering para fiesta de Sofía ${propId.slice(-5)}`;

  test.beforeEach(async () => {
    if (fs.existsSync(propuestasPath)) {
      originalPropuestas = fs.readFileSync(propuestasPath, 'utf8');
    }
    const propTest = {
      id: propId,
      clave: `e2e-ok-${Date.now()}`,
      area: 'fiestas',
      titulo: tituloUnico,
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
    // Saca sólo la tarjeta propia: la otra corrida (escritorio o celular) puede estar usando la suya.
    try {
      const actual = JSON.parse(fs.readFileSync(propuestasPath, 'utf8')) as Array<{ id: string }>;
      const resto = actual.filter((p) => p.id !== propId);
      if (resto.length === 0 && originalPropuestas === null) fs.unlinkSync(propuestasPath);
      else fs.writeFileSync(propuestasPath, JSON.stringify(resto, null, 2), 'utf8');
    } catch {}
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
    // La tarjeta es el contenedor que lleva el título Y los botones (un div más adentro sólo tiene el texto).
    const tarjeta = page
      .locator('div', { hasText: tituloUnico })
      .filter({ has: page.getByRole('button', { name: /^No$/i }) })
      .last();
    await expect(tarjeta).toBeVisible();

    // 3. Toca el botón "No"
    const botonNo = tarjeta.getByRole('button', { name: /^No$/i });
    await expect(botonNo).toBeVisible();
    await botonNo.click();

    // 4. Verifica que la tarjeta desaparece inmediatamente de la vista
    await expect(page.getByText(tituloUnico)).not.toBeVisible();
  });
});
