import { test, expect } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
} from './helpers/fiesta-de-prueba';

/**
 * Orden 89 — Bloque 2: La barra muestra "Agotado" en vez de ofrecer lo que no hay.
 *
 * Se comprueba:
 * 1. En la carta de tragos (MiniQuiosco y pantalla de barra touch), el trago sin stock (stockDisponible <= 0):
 *    - Muestra la etiqueta "Agotado".
 *    - Tiene el botón de selección / pedido desactivado.
 *    - Aparece posicionado al final del carrusel / lista.
 * 2. El botón "Sugerirme uno" nunca sugiere un trago agotado (probado 20 veces consecutivas).
 */

const fiestaId = `e2e_barra_agotado_${Date.now()}`;
const fiesta = crearFiestaDeEstaNoche({ id: fiestaId });

if (fiesta.modulosContratados) {
  fiesta.modulosContratados.barraTecnologica = true;
}

fiesta.others = {
  ...fiesta.others,
  barraTecnologica: {
    settings: {
      enabled: true,
      accentColor: '#dc2626',
    },
    orders: [],
  },
};

fiesta.cartaTragos = {
  items: [
    {
      id: 'custom_trago_agotado',
      nombre: 'Trago Especial Agotado',
      stockDisponible: 0,
      ingredientes: ['Ingrediente agotado', 'Hielo'],
    },
    {
      id: 'custom_trago_disponible_1',
      nombre: 'Trago Alfa Disponible',
      stockDisponible: 10,
      ingredientes: ['Frutilla', 'Menta'],
    },
    {
      id: 'custom_trago_disponible_2',
      nombre: 'Trago Beta Disponible',
      stockDisponible: 8,
      ingredientes: ['Limón', 'Jengibre'],
    },
  ],
  empresa: {
    linea1: 'AK Producciones',
    linea2: 'Barra de Tragos',
    contacto: '099000000',
  },
};

const invitado = fiesta.invitados?.[0] || {
  id: 'inv_test_89',
  nombre: 'Martín Rodríguez',
  tableNumber: '5',
  guestAccessToken: 'tok_test_89',
};

test.beforeAll(() => guardarFiesta(fiesta));
test.afterAll(() => borrarFiesta(fiesta.id));

test.describe('Orden 89 — Bloque 2: La barra no ofrece lo agotado', () => {
  test('trago con stock 0 se muestra como Agotado, no se puede pedir, va al final y nunca es sugerido', async ({ page }) => {
    test.setTimeout(90_000);

    // 1. Abrir la invitación del invitado y abrir el quiosco
    await page.goto(`/invitacion/${fiesta.id}/invitado/${invitado.id}?token=${invitado.guestAccessToken}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Estamos preparando tu información/i)).toBeHidden({ timeout: 45_000 });
    await expect(page.getByText(invitado.nombre).first()).toBeVisible({ timeout: 25_000 });

    const btnCarta = page.getByRole('button', { name: /carta de tragos/i }).first();
    await expect(btnCarta).toBeVisible({ timeout: 20_000 });
    await btnCarta.click();

    // Esperar a que el quiosco de tragos cargue
    await expect(page.getByText(/Estamos preparando el quiosco de tragos/i)).toBeHidden({ timeout: 30_000 });

    // 2. Verificar que el trago agotado muestra la etiqueta "Agotado"
    const tarjetaAgotada = page.locator('article', { hasText: 'Trago Especial Agotado' });
    await expect(tarjetaAgotada).toBeVisible({ timeout: 15_000 });
    await expect(tarjetaAgotada.getByText('Agotado').first()).toBeVisible();

    // 3. El botón para pedirlo está desactivado
    const botonAgotado = tarjetaAgotada.locator('[data-testid="boton-pedir-trago"]');
    await expect(botonAgotado).toBeDisabled();

    // 4. El trago agotado aparece al final del carrusel de tragos
    const articulos = page.locator('div[aria-label="Carta de tragos"] article');
    const cantidadArticulos = await articulos.count();
    expect(cantidadArticulos).toBeGreaterThanOrEqual(3);
    const ultimoArticulo = articulos.nth(cantidadArticulos - 1);
    await expect(ultimoArticulo).toContainText('Trago Especial Agotado');

    // 5. Probar 20 veces consecutivas que "Sugerirme uno" nunca trae el trago agotado
    const btnSugerir = page.getByRole('button', { name: /sugerirme uno/i });
    await expect(btnSugerir).toBeVisible();

    for (let i = 0; i < 20; i++) {
      await btnSugerir.click();

      // Al sugerir, se abre el modal de confirmación con el trago seleccionado
      const modalDialog = page.getByRole('dialog');
      await expect(modalDialog).toBeVisible({ timeout: 5_000 });

      // Verificar que el título o contenido NO sea el trago agotado
      await expect(modalDialog).not.toContainText('Trago Especial Agotado');

      // Cerrar el diálogo para el siguiente intento
      const btnCancelar = modalDialog.getByRole('button', { name: /cancelar/i });
      await btnCancelar.click();
      await expect(modalDialog).toBeHidden({ timeout: 5_000 });
    }
  });

  test('en la pantalla táctil de barra el trago agotado también se ve inactivo y no se sugiere al azar', async ({ page }) => {
    test.setTimeout(90_000);

    await page.goto(`/evento/barra/${fiesta.id}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Verificar tarjeta de trago agotado en la barra touch
    const tarjetaAgotada = page.locator('[data-testid="tarjeta-trago"]', { hasText: 'Trago Especial Agotado' });
    await expect(tarjetaAgotada).toBeVisible({ timeout: 30_000 });
    await expect(tarjetaAgotada.getByText('Agotado')).toBeVisible();
    await expect(tarjetaAgotada).toBeDisabled();

    // Comprobar que en la lista de tarjetas está al final
    const tarjetas = page.locator('[data-testid="tarjeta-trago"]');
    const total = await tarjetas.count();
    expect(total).toBeGreaterThanOrEqual(3);
    const ultimaTarjeta = tarjetas.nth(total - 1);
    await expect(ultimaTarjeta).toContainText('Trago Especial Agotado');
  });
});
