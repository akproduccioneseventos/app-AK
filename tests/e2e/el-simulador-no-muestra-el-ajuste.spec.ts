import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

/**
 * Orden 267: El ajuste anual NO se muestra al prospecto
 *
 * Navegador: el resultado del simulador para una fecha de dos años después
 * no contiene "15%" ni "ajuste acumulativo".
 */

const MUTABLE_FILES = [
  'data/presupuestos.json',
  'src/data/presupuestos.json',
  'data/crm-leads.json',
  'src/data/crm-leads.json',
  'data/notifications.json',
  'src/data/notifications.json',
];

const snapshots = new Map<string, Buffer | null>();

test.beforeAll(() => {
  for (const relativePath of MUTABLE_FILES) {
    const absolutePath = path.join(process.cwd(), relativePath);
    snapshots.set(
      absolutePath,
      fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath) : null,
    );
  }
});

test.afterAll(() => {
  for (const [absolutePath, snapshot] of snapshots) {
    if (snapshot === null) fs.rmSync(absolutePath, { force: true });
    else fs.writeFileSync(absolutePath, snapshot);
  }
});

test.describe('Orden 267: El simulador público no muestra el ajuste anual al prospecto', () => {
  test('un evento con fecha a dos años adelante no muestra "15%" ni "ajuste acumulativo"', async ({ page }) => {
    test.setTimeout(120_000);

    const anioFuturo = new Date().getFullYear() + 2;
    await page.goto(
      `/simulador-de-presupuesto?mes=${anioFuturo}-11&tipo=Cumplea%C3%B1os&name=Prospecto+Ajuste&guests=60`,
      { waitUntil: 'domcontentloaded' }
    );

    // Si aparece la portada, iniciarla; si ya inició por query param, avanzar
    const btnPortada = page.getByTestId('simulator-cover-start');
    if (await btnPortada.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await btnPortada.click();
    }

    // Paso 1: Introducción
    await expect(page.getByText(/Paso 1 de 5/i)).toBeVisible({ timeout: 20_000 });
    const ctaPaso1 = page.getByTestId('simulator-first-step-cta');
    await expect(ctaPaso1).toBeVisible({ timeout: 15_000 });
    await ctaPaso1.click();

    // Paso 2: Datos del evento (mismo recorrido que el-simulador-tiene-los-textos-nuevos, que anda)
    await expect(page.getByText(/Paso 2 de 5/i)).toBeVisible({ timeout: 20_000 });
    await page.locator('#simulator-name').fill('Prospecto Ajuste');
    const phoneInput = page.locator('#simulator-whatsapp').or(page.locator('#simulator-phone')).first();
    await phoneInput.fill('099123456');
    const btnClub = page.getByRole('button', { name: /Quiero Club Uruguay/i }).first();
    await expect(btnClub).toBeVisible({ timeout: 15_000 });
    await btnClub.click();

    // La fecha a dos años viene puesta por la dirección (?mes=): se comprueba que esté, no se elige a mano
    await expect(page.getByRole('button', { name: new RegExp(`de ${anioFuturo}`) }).first()).toBeVisible({ timeout: 15_000 });
    await page.waitForFunction(() => !document.body.innerText.includes('Verificando disponibilidad')).catch(() => undefined);
    await page.getByRole('button', { name: /^Siguiente$|Continuar/i }).first().click();

    // Paso 3: Catering / Comida
    await expect(page.locator('h2', { hasText: 'Elegí lo que querés para tu fiesta' }).first()).toBeVisible({ timeout: 20_000 });
    const mantenerPaso3 = page.getByRole('button', { name: /Mantener mi selección actual/i });
    if (await mantenerPaso3.isVisible().catch(() => false)) {
      await mantenerPaso3.click();
    }
    await page.getByRole('button', { name: /^Siguiente$|Continuar/i }).first().click();

    // Paso 4: Paquetes
    await expect(page.locator('h2', { hasText: 'Elegí lo que querés para tu fiesta' }).first()).toBeVisible({ timeout: 20_000 });
    const mantenerPaso4 = page.getByRole('button', { name: /Mantener mi selección actual/i });
    if (await mantenerPaso4.isVisible().catch(() => false)) {
      await mantenerPaso4.click();
    }
    await page.getByRole('button', { name: /^Siguiente$|Continuar/i }).first().click();

    // Paso 5: Personalización y generación de propuesta
    await expect(page.getByText(/Paso 5 de 5/i)).toBeVisible({ timeout: 20_000 });
    const keepSelection = page.getByRole('button', { name: /Mantener mi selecci[oó]n actual/i });
    // La oferta de pasar a premium aparece unos segundos después y tapa el botón: se espera y se cierra
    await keepSelection.waitFor({ state: 'visible', timeout: 12_000 }).catch(() => undefined);
    if (await keepSelection.isVisible().catch(() => false)) {
      await keepSelection.click();
      await keepSelection.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => undefined);
    }
    const verPropuesta = page.getByRole('button', { name: /Ver Resumen y Propuesta|^Generar$/i }).first();
    await expect(verPropuesta).toBeVisible({ timeout: 30_000 });
    await verPropuesta.click();

    // Paso 6: Propuesta final en pantalla
    await expect(page.locator('h2', { hasText: 'Esta es tu fiesta, y este es tu presupuesto estimado.' })).toBeVisible({ timeout: 45_000 });

    const cuerpoTexto = (await page.locator('body').innerText()).toLowerCase();

    // Que la fecha elegida sea de verdad la de dos años adelante: si no, no prueba nada
    expect(cuerpoTexto).toContain(String(anioFuturo));

    // El prospecto no debe ver el 15% ni menciones de ajuste acumulativo / proyección anual
    // Ojo: "Bonificación especial (15%)" es el descuento de la promoción y SÍ va. Lo que no va es el ajuste.
    expect(cuerpoTexto).toContain('precio vigente');
    expect(cuerpoTexto).not.toMatch(/ajuste[^\n]{0,60}15\s*%|15\s*%[^\n]{0,40}(anual|por cada a)/);
    expect(cuerpoTexto).not.toMatch(/total estimado \d{4}/);
    expect(cuerpoTexto).not.toContain('ajuste acumulativo');
    expect(cuerpoTexto).not.toContain('proyeccion de ajuste anual');
    expect(cuerpoTexto).not.toContain('proyección de ajuste anual');
  });
});
