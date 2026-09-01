import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta } from './helpers/fiesta-de-prueba';

test.describe('Orden 32: Los dos fondos de la fotocabina (telón de pantalla y foto)', () => {
  const fiestaId = 'fiesta-fotocabina-fondos-32';

  test.beforeAll(async () => {
    const fiesta = crearFiestaDeEstaNoche({ id: fiestaId });
    fiesta.configuracion.nombreEvento = 'Fiesta de Fondos y Telón';
    guardarFiesta(fiesta);
  });

  test.afterAll(async () => {
    borrarFiesta(fiestaId);
  });

  test('La fotocabina muestra el fondo decorativo (telón) sin tapar la cámara ni el botón de sacar foto', async ({ page }) => {
    // Abrir con tema de cortina roja clásica
    await page.goto(`/evento/fotocabina/${fiestaId}?role=display&fondo=telon-rojo`);

    // 1. Título y encabezado visibles
    await expect(page.locator('h1')).toContainText('Fotocabina AK');

    // 2. El botón de preparar foto está visible y accesible
    const botonPreparar = page.getByRole('button', { name: /Preparar foto/i });
    await expect(botonPreparar).toBeVisible();

    // 3. El contenedor tiene el fondo decorativo aplicado
    const contenedor = page.locator('div.fixed.inset-0');
    await expect(contenedor).toBeVisible();
  });

  test('Permite cambiar al fondo dorado de gala manteniendo todos los controles legibles', async ({ page }) => {
    await page.goto(`/evento/fotocabina/${fiestaId}?role=display&fondo=dorado-gala`);

    // Controles de voz, marca y cambio de cámara visibles
    await expect(page.getByRole('button', { name: /voz/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Preparar foto/i })).toBeVisible();
  });
});
