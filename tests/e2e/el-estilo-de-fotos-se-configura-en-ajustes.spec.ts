import { test, expect } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

test('El estilo de fotos se configura en ajustes', async ({ page, context }, testInfo) => {
  await ponerSesionDelEquipo(context, testInfo.project.use.baseURL as string);
  await page.goto('/settings/estilo-fotos', { waitUntil: 'domcontentloaded' });

  const encabezado = page.getByRole('heading', { name: /Estilo de fotos AK/i });
  await expect(encabezado).toBeVisible({ timeout: 20_000 });
  await expect(encabezado).toContainText('Estilo de fotos AK');

  const tarjetaSalon = page.getByText(/Salón de Noche/i).first();
  await expect(tarjetaSalon).toBeVisible({ timeout: 20_000 });
  await expect(tarjetaSalon).toContainText(/Salón de Noche/i);

  const tarjetaTorta = page.getByText(/Torta y Velas/i).first();
  await expect(tarjetaTorta).toBeVisible({ timeout: 20_000 });
  await expect(tarjetaTorta).toContainText(/Torta y Velas/i);

  const tarjetaExterior = page.getByText(/Exterior de Día/i).first();
  await expect(tarjetaExterior).toBeVisible({ timeout: 20_000 });
  await expect(tarjetaExterior).toContainText(/Exterior de Día/i);

  const botonGuardar = page.getByRole('button', { name: /guardar estilo/i }).first();
  await expect(botonGuardar).toBeVisible({ timeout: 20_000 });
  await expect(botonGuardar).toBeEnabled({ timeout: 20_000 });
});
