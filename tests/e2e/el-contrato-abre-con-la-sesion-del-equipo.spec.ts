import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, ponerSesionDelEquipo, ponerSesionDeAuditor } from './helpers/fiesta-de-prueba';

/**
 * Orden 308 — Bloque 2: El contrato abre con la sesión del equipo (y del auditor).
 * - Con sesión del equipo o auditor, la pantalla del contrato muestra el contrato de la fiesta (modo sólo lectura para el auditor).
 * - Si de verdad la fiesta no tiene contrato armado, muestra "Todavía no hay contrato para esta fiesta" (no "No pudimos cargar").
 * - Sin ninguna sesión, la frena el control del portal y redirige a /portal.
 */
test.describe('Orden 308: el contrato abre con la sesión del equipo', () => {
  let fiestaConContratoId: string;
  let fiestaSinContratoId: string;

  test.beforeAll(async () => {
    // Fiesta con contrato
    const f1 = crearFiestaDeEstaNoche({ id: `e2e_contrato_con_${Date.now()}` });
    f1.contratoServicioTexto = 'CONTRATO DE SERVICIO INTEGRAL DE FIESTAS Y EVENTOS\nCláusula 1: Objeto del contrato.';
    f1.contratoFirmaInfo = undefined;
    guardarFiesta(f1);
    fiestaConContratoId = f1.id;

    // Fiesta sin contrato
    const f2 = crearFiestaDeEstaNoche({ id: `e2e_contrato_sin_${Date.now()}` });
    f2.contratoServicioTexto = '';
    guardarFiesta(f2);
    fiestaSinContratoId = f2.id;
  });

  test.afterAll(async () => {
    if (fiestaConContratoId) borrarFiesta(fiestaConContratoId);
    if (fiestaSinContratoId) borrarFiesta(fiestaSinContratoId);
  });

  test('con sesión del equipo: el contrato carga y muestra el texto del contrato', async ({ page, context }, testInfo) => {
    test.setTimeout(240_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await ponerSesionDelEquipo(context, baseURL);

    await page.goto(`/portal/${fiestaConContratoId}/contrato`, { waitUntil: 'domcontentloaded' });

    // No debe mostrar el mensaje de error de carga
    await expect(page.getByText('No pudimos cargar tu contrato')).toHaveCount(0);

    // Debe mostrar los términos y el texto del contrato
    await expect(page.getByText('CONTRATO DE SERVICIO INTEGRAL DE FIESTAS Y EVENTOS')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('Cláusula 1: Objeto del contrato.')).toBeVisible({ timeout: 30_000 });
  });

  test('con sesión del equipo y fiesta sin contrato: muestra "Todavía no hay contrato para esta fiesta"', async ({ page, context }, testInfo) => {
    test.setTimeout(240_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await ponerSesionDelEquipo(context, baseURL);

    await page.goto(`/portal/${fiestaSinContratoId}/contrato`, { waitUntil: 'domcontentloaded' });

    // No debe decir "No pudimos cargar"
    await expect(page.getByText('No pudimos cargar tu contrato')).toHaveCount(0);

    // Debe decir "Todavía no hay contrato para esta fiesta"
    await expect(page.getByText('Todavía no hay contrato para esta fiesta')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('El contrato aún no ha sido redactado por el organizador.')).toBeVisible({ timeout: 30_000 });
  });

  test('con sesión de auditor: abre en modo sólo lectura y no permite firmar', async ({ page, context }, testInfo) => {
    test.setTimeout(240_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await ponerSesionDeAuditor(context, baseURL);

    await page.goto(`/portal/${fiestaConContratoId}/contrato`, { waitUntil: 'domcontentloaded' });

    // Muestra el contrato
    await expect(page.getByText('CONTRATO DE SERVICIO INTEGRAL DE FIESTAS Y EVENTOS')).toBeVisible({ timeout: 60_000 });

    // Muestra aviso de sólo lectura y no ofrece formulario de firma
    await expect(page.getByText(/sesión de sólo lectura/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: /dejar constancia de firma digital/i })).toHaveCount(0);
  });

  test('sin sesión: el portal frena el acceso y redirige a /portal', async ({ page }) => {
    test.setTimeout(240_000);
    await page.goto(`/portal/${fiestaConContratoId}/contrato`, { waitUntil: 'domcontentloaded' });

    // Redirige al portal
    await expect(page).toHaveURL(/\/portal(?:\?|$)/, { timeout: 60_000 });
  });
});
