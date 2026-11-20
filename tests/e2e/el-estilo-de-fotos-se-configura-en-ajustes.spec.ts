import { test, expect } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

test('El estilo de fotos se configura en ajustes', async ({ page, context }, testInfo) => {
  await ponerSesionDelEquipo(context, testInfo.project.use.baseURL as string);
  await page.goto('/settings/estilo-fotos', { waitUntil: 'domcontentloaded' });

  const encabezado = page.getByRole('heading', { name: /Estilo de fotos AK/i });
  await expect(encabezado).toBeVisible({ timeout: 20_000 });
  await expect(encabezado).toContainText('Estilo de fotos AK');

  const tarjetaSalon = page.getByText(/Brindis y Coctelería en Salón/i).first();
  await expect(tarjetaSalon).toBeVisible({ timeout: 20_000 });
  await expect(tarjetaSalon).toContainText(/Brindis y Coctelería en Salón/i);

  const tarjetaTorta = page.getByText(/Barra y Colores de Evento/i).first();
  await expect(tarjetaTorta).toBeVisible({ timeout: 20_000 });
  await expect(tarjetaTorta).toContainText(/Barra y Colores de Evento/i);

  const tarjetaExterior = page.getByText(/Recepción al Aire Libre/i).first();
  await expect(tarjetaExterior).toBeVisible({ timeout: 20_000 });
  await expect(tarjetaExterior).toContainText(/Recepción al Aire Libre/i);

  const botonGuardar = page.getByRole('button', { name: /guardar estilo/i }).first();
  await expect(botonGuardar).toBeVisible({ timeout: 20_000 });
  await expect(botonGuardar).toBeEnabled({ timeout: 20_000 });
});
