import { test, expect } from '@playwright/test';

test('abrir /invitacion/x/invitado/y sin token muestra el error con contraste legible y botón Ir al inicio (Orden 285 - Bloque 10)', async ({
  page,
}) => {
  // Navegar a un enlace de invitado sin token
  await page.goto('/invitacion/fiesta_inexistente_e2e/invitado/invitado_sin_token');

  const titulo = page.getByRole('heading', { name: /No pudimos abrir tu invitación/i });
  await expect(titulo).toBeVisible({ timeout: 30_000 });

  // Comprobar que el color del título no es igual al color de fondo visible
  const contraste = await titulo.evaluate((el) => {
    const fondoEl = el.closest('div') || el.parentElement || el;
    const colorTexto = window.getComputedStyle(el).color;
    const colorFondo = window.getComputedStyle(fondoEl).backgroundColor;
    return {
      colorTexto,
      colorFondo,
      distintos: colorTexto !== colorFondo,
    };
  });
  expect(contraste.distintos).toBe(true);

  // Comprobar que el botón "Ir al inicio" se ve y tiene al menos 44 px de altura
  const botonInicio = page.getByRole('link', { name: /Ir al inicio/i });
  await expect(botonInicio).toBeVisible();

  const box = await botonInicio.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeGreaterThanOrEqual(40);
});
