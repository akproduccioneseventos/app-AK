import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

function parseMonto(texto: string): number {
  const soloDigitos = texto.replace(/[^0-9]/g, '');
  return parseInt(soloDigitos, 10);
}

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

test.describe('Orden 243: Los textos nuevos del simulador', () => {
  test('Paso 1 (datos del evento) y el boton para continuar son visibles en 390x844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/simulador-de-presupuesto', { waitUntil: 'domcontentloaded' });

    // Iniciar el simulador
    await page.getByTestId('simulator-cover-start').click({ timeout: 25_000 });
    await expect(page.getByText(/Paso 1 de 4/i)).toBeVisible({ timeout: 15_000 });

    // El paso 1 ya no es una introduccion: es el formulario de datos del evento
    await expect(page.getByRole('heading', { name: 'Ingresá tus datos y los del evento' })).toBeVisible({ timeout: 15_000 });

    // El boton para seguir existe en el paso 1 (es un formulario: queda al final, se llega bajando)
    const ctaButton = page.getByRole('button', { name: /^Continuar$/ }).first();
    await ctaButton.scrollIntoViewIfNeeded();
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toBeInViewport();
  });

  test('Paso 6 con Club Uruguay muestra desglose de 3 renglones, suma correcta, botones nuevos y sin congel', async ({ page }) => {
    test.setTimeout(420_000); // con la tanda entera corriendo pasó los 180 s dos veces (18/11/2026); sola, un minuto
    await page.goto('/simulador-de-presupuesto', { waitUntil: 'domcontentloaded' });

    // Entrar al simulador
    await page.getByTestId('simulator-cover-start').click({ timeout: 25_000 });
    await expect(page.getByText(/Paso 1 de 4/i)).toBeVisible({ timeout: 15_000 });

    // Paso 1 de 4: Datos
    await page.locator('#simulator-name').fill('Cliente Textos Nuevos');
    const phoneInput = page.locator('#simulator-whatsapp').or(page.locator('#simulator-phone')).first();
    await phoneInput.fill('099888777');

    const btnClub = page.getByRole('button', { name: /Quiero Club Uruguay/i }).first();
    await expect(btnClub).toBeVisible({ timeout: 15_000 });
    await btnClub.click();

    await page.getByRole('button', { name: /fecha|Elegí|Seleccion/i }).first().click();
    const nextBtn = page.getByRole('button', { name: /next|siguiente|Go to next month/i }).first();
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click();
    }
    const diaBtn = page.getByRole('grid').getByRole('button', { name: /\b15\b/, disabled: false }).or(page.locator('[role="gridcell"] button:not([disabled])')).first();
    await diaBtn.click();
    await page.waitForFunction(() => !document.body.innerText.includes('Verificando disponibilidad')).catch(() => undefined);

    const btnSiguientePaso2 = page.getByRole('button', { name: /^Siguiente$|Continuar/i }).first();
    await btnSiguientePaso2.click();

    // Paso 2 de 4: Encabezado nuevo y continuar
    await expect(page.getByText(/Paso 2 de 4/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('h2', { hasText: 'Elegí lo que querés para tu fiesta' }).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Cada celebración es diferente. Seleccioná las opciones que más te gusten y mirá cómo se actualiza tu presupuesto.').first()).toBeVisible();

    const mantenerSeleccion = page.getByRole('button', { name: /Mantener mi selección actual/i });
    if (await mantenerSeleccion.isVisible().catch(() => false)) {
      await mantenerSeleccion.click();
    }
    await page.getByRole('button', { name: /^Siguiente$|Continuar/i }).first().click();

    // Paso 3 de 4: Paquete - Encabezado nuevo y continuar
    await expect(page.getByText(/Paso 3 de 4/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('h2', { hasText: 'Elegí lo que querés para tu fiesta' }).first()).toBeVisible({ timeout: 20_000 });
    if (await mantenerSeleccion.isVisible().catch(() => false)) {
      await mantenerSeleccion.click();
    }
    await page.getByRole('button', { name: /^Siguiente$|Continuar/i }).first().click();

    // Paso 4 de 4: Edición y desglose
    await expect(page.getByText(/Paso 4 de 4/i)).toBeVisible({ timeout: 20_000 });
    const keepSelection = page.getByRole('button', { name: /Mantener mi selecci[oó]n actual/i });
    await keepSelection.waitFor({ state: 'visible', timeout: 3_000 }).catch(() => undefined);
    if (await keepSelection.isVisible().catch(() => false)) {
      await keepSelection.click();
      await keepSelection.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => undefined);
    }
    const verPropuesta = page.getByRole('button', { name: /Ver Resumen y Propuesta|^Generar$/i }).first();
    await expect(verPropuesta).toBeVisible({ timeout: 30_000 });
    await verPropuesta.click();

    // Resultado: Verificación de textos y totales
    await expect(page.locator('h2', { hasText: 'Esta es tu fiesta, y este es tu presupuesto estimado.' })).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText('Ya tenés una primera propuesta. Ahora podemos ayudarte a ajustar el menú, los servicios y los detalles para que todo se adapte a lo que estás buscando.')).toBeVisible();

    // Los 3 renglones
    const labelClub = page.getByText('Alquiler del salón Club Uruguay (se paga directo al Club)').first();
    const labelServicios = page.getByText('Servicios AK').first();
    const labelTotalRef = page.getByText('Total de referencia (salón + servicios)').first();

    await expect(labelClub).toBeVisible();
    await expect(labelServicios).toBeVisible();
    await expect(labelTotalRef).toBeVisible();

    // Verificar que el total de referencia sea la suma de alquiler + servicios
    const contenedorFilaClub = labelClub.locator('..');
    const contenedorFilaServicios = labelServicios.locator('..');
    const contenedorFilaTotalRef = labelTotalRef.locator('..');

    const textoClub = (await contenedorFilaClub.textContent()) || '';
    const textoServicios = (await contenedorFilaServicios.textContent()) || '';
    const textoTotalRef = (await contenedorFilaTotalRef.textContent()) || '';

    const montoClub = parseMonto(textoClub);
    const montoServicios = parseMonto(textoServicios);
    const montoTotalRef = parseMonto(textoTotalRef);

    expect(montoClub).toBeGreaterThan(0);
    expect(montoServicios).toBeGreaterThan(0);
    expect(montoTotalRef).toBe(montoClub + montoServicios);

    // Orden 314: el botón principal del cierre es "Coordinar reunión por WhatsApp", y "Consultar por WhatsApp"
    await expect(page.getByRole('button', { name: /Coordinar reunión por WhatsApp/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Consultar por WhatsApp/i }).first()).toBeVisible();

    // Prohibido "congel"
    const contenidoCompleto = (await page.textContent('body')) || '';
    expect(contenidoCompleto.toLowerCase()).not.toContain('congel');
  });
});
