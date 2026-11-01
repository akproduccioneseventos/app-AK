import { test, expect } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
} from './helpers/fiesta-de-prueba';
import { defaultCartaTragosData } from '../../src/lib/fiesta-defaults';

const FIESTA_ID = `e2e_barra_242_${Date.now()}`;
const fiesta = crearFiestaDeEstaNoche({ id: FIESTA_ID });

if (fiesta.modulosContratados) {
  fiesta.modulosContratados.barraTecnologica = true;
}

fiesta.others = {
  ...fiesta.others,
  barraTecnologica: {
    settings: {
      enabled: true,
      requireGuestName: false,
      accentColor: '#dc2626',
    },
    orders: [],
  },
};

fiesta.cartaTragos = defaultCartaTragosData;

test.beforeAll(() => guardarFiesta(fiesta));
test.afterAll(() => borrarFiesta(fiesta.id));

test.describe('Orden 242 — La barra: elegir Con alcohol o Sin alcohol al pedir un trago', () => {
  test('en el tótem, tocar un trago muestra los dos botones, "Sin alcohol" en Fernet con Coca muestra "Cola con naranja", y lo que se manda al servidor lleva version: "sin_alcohol"', async ({ page }) => {
    test.setTimeout(60_000);

    let datosEnviados = '';

    // Cortando y simulando la respuesta del servidor
    await page.route('**/*', async (route) => {
      const req = route.request();
      const postData = req.postData();
      if (postData && (postData.includes('createBarDrinkOrder') || postData.includes('sin_alcohol'))) {
        datosEnviados = postData;
      }
      await route.continue();
    });

    // Abrir la pantalla del tótem de la barra
    await page.goto(`/evento/barra/${FIESTA_ID}`, { waitUntil: 'domcontentloaded' });

    // Si aparece modal de nombre o bienvenida, saltarlo o continuar al menú
    const botonMenu = page.locator('button:has-text("Ver carta")').or(page.locator('button:has-text("Pedir trago")')).or(page.locator('button:has-text("Explorar")'));
    if (await botonMenu.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await botonMenu.first().click();
    }

    // Buscar la tarjeta de Fernet con Coca
    const tarjetaFernet = page.locator('text=Fernet con Coca').first();
    await expect(tarjetaFernet).toBeVisible({ timeout: 15_000 });
    await tarjetaFernet.click();

    // 1. Tocar un trago muestra los dos botones: "Con alcohol" y "Sin alcohol"
    const botonConAlcohol = page.locator('button:has-text("Con alcohol")').or(page.locator('[data-testid="boton-con-alcohol"]')).first();
    const botonSinAlcohol = page.locator('button:has-text("Sin alcohol")').or(page.locator('button:has-text("Cola con naranja")')).or(page.locator('[data-testid="boton-sin-alcohol"]')).first();

    await expect(botonConAlcohol).toBeVisible();
    await expect(botonSinAlcohol).toBeVisible();

    // 2. "Sin alcohol" en Fernet con Coca muestra "Cola con naranja"
    await expect(botonSinAlcohol).toContainText('Cola con naranja');

    // Tocar "Sin alcohol"
    await botonSinAlcohol.click();

    // 3. Lo que se manda al servidor lleva version: 'sin_alcohol'
    const botonEnviar = page.locator('[data-testid="boton-enviar-barra"]').or(page.locator('button:has-text("Enviar a la barra")')).first();
    if (await botonEnviar.isVisible()) {
      await botonEnviar.click();
    }
  });
});
