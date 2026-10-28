import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta } from './helpers/fiesta-de-prueba';
import { enchufarCamaraFalsa } from './helpers/camara-falsa';
import { createPortalSession } from '../../src/lib/security/portal-session';

/**
 * Orden 238: Que el cliente hable por voz con el asistente de su portal.
 *
 * Se simula la ruta de la ficha del cliente con 429 (tope diario de minutos) y el micrófono
 * falso mediante camara-falsa / mediaDevices.
 * Se comprueba:
 * 1. Tocar "Hablar" muestra el mensaje del tope en el chat.
 * 2. El chat escrito sigue andando normalmente.
 */
const fiestaId = `e2e_voz_cliente_${Date.now()}`;
const clavePortal = 'clave-portal-voz-238';

test.describe('Orden 238: el cliente habla por voz con el asistente de su portal', () => {
  test.beforeAll(() => {
    const fiesta = crearFiestaDeEstaNoche({ id: fiestaId, clavePortal });
    fiesta.configuracion.nombreEvento = 'Fiesta E2E Voz Cliente';
    guardarFiesta(fiesta);
  });

  test.afterAll(() => borrarFiesta(fiestaId));

  async function entrarAlPortal(page: Page, context: BrowserContext, baseURL: string) {
    await enchufarCamaraFalsa(page);
    await context.addCookies([
      {
        name: 'ak_portal_session',
        value: createPortalSession(fiestaId, clavePortal),
        url: baseURL,
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    await page.addInitScript(
      ({ fid, key }) => {
        window.sessionStorage.setItem(`portal_auth_${fid}`, key);
      },
      { fid: fiestaId, key: clavePortal }
    );
    await page.goto(`/portal-cliente/${fiestaId}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('necesito-ayuda-btn')).toBeVisible({ timeout: 30_000 });
  }

  test('tocar Hablar con tope alcanzado (429) muestra el mensaje del tope y el chat escrito sigue andando', async ({ page, context }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL as string;
    const mensajeTope = 'Alcanzaste el tope de 5 minutos de voz de hoy para tu fiesta. Podés seguir conversando por el chat escrito.';

    // Interceptamos la llamada de voz del cliente para simular status 429
    await page.route('**/api/asistente/voz-en-vivo/cliente', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: mensajeTope }),
      });
    });

    await entrarAlPortal(page, context, baseURL);

    // Abrimos el asistente virtual
    const botonAbrir = page.getByRole('button', { name: 'Abrir asistente de la fiesta' });
    await expect(botonAbrir).toBeVisible({ timeout: 20_000 });
    await botonAbrir.click();

    // Verificamos que el asistente se abrió y el botón Hablar está visible
    const botonHablar = page.getByRole('button', { name: 'Hablar' });
    await expect(botonHablar).toBeVisible({ timeout: 10_000 });

    // Tocamos "Hablar"
    await botonHablar.click();

    // Verificamos que se muestra el mensaje del tope en el chat mirando el resultado
    const mensajeElemento = page.getByText(mensajeTope);
    await expect(mensajeElemento).toBeVisible({ timeout: 15_000 });
    await expect(mensajeElemento).toContainText('Alcanzaste el tope');

    // Verificamos que el chat escrito sigue andando
    const inputTexto = page.getByPlaceholder('Preguntame sobre tu fiesta o contrato...');
    await expect(inputTexto).toBeVisible();
    await inputTexto.fill('Hola, ¿a qué hora es la fiesta?');
    await expect(inputTexto).toHaveValue('Hola, ¿a qué hora es la fiesta?');
    const botonEnviar = page.getByRole('button', { name: 'Enviar mensaje' });
    await botonEnviar.click();

    // El mensaje enviado por el cliente aparece en el chat
    const mensajeEnviado = page.getByText('Hola, ¿a qué hora es la fiesta?');
    await expect(mensajeEnviado).toBeVisible({ timeout: 10_000 });
    await expect(mensajeEnviado).toContainText('Hola, ¿a qué hora es la fiesta?');
  });
});

