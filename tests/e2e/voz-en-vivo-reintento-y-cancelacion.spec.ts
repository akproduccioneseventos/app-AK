import { expect, test } from '@playwright/test';
import { borrarFiesta, crearFiestaDeEstaNoche, guardarFiesta, ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

/**
 * Orden 146 (Codex, VOZ94-CORTAR y VOZ94-REINTENTO): en el asistente real, Cortar y Reintentar
 * funcionan de verdad.
 *
 * El pedido de la ficha se intercepta con `page.route` (nunca llega a Google), el socket es un
 * falso puesto con `addInitScript` y el micrófono es el NATIVO falso de Chromium. Se mira el
 * resultado en la pantalla y en los recursos: panel, pedidos, micrófonos pedidos, pistas vivas y
 * sockets abiertos/cerrados después de cortar y después de reintentar.
 *
 * Probado rompiéndolo: devolver el objeto `detener` vacío al fallar (guardarlo como sesión
 * activa) deja el segundo toque sin pedido y rompe "503 y un toque"; sacar la señal de
 * `iniciarVozEnVivo` deja el micrófono pedido tras Cortar y rompe "cortar antes de la ficha".
 */

// Al pisar launchOptions se pierde el navegador que fija playwright.config.ts: se repone acá.
const chromiumInstalado = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
test.use({
  launchOptions: {
    ...(chromiumInstalado ? { executablePath: chromiumInstalado } : {}),
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  },
});

const FICHA = {
  token: 'auth_tokens/QA146', model: 'gemini-3.8-live', voz: 'Kore', segundosMaximos: 30,
  wsUrl: 'wss://qa146.invalid/controlado',
};

async function abrirAsistente(page: any, context: any, baseURL: string | undefined) {
  const id = `e2e_voz146_${process.pid}_${Date.now()}`;
  guardarFiesta(crearFiestaDeEstaNoche({ id }));
  await ponerSesionDelEquipo(context, baseURL);
  await page.goto(`/fiestas/nueva/tareas?fiestaId=${id}`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Abrir Asistente IA AK' }).click();
  await expect(page.getByTestId('boton-hablar-en-vivo')).toBeVisible();
  return () => borrarFiesta(id);
}

/** Micrófono nativo contado (las pistas se guardan para mirar si quedan vivas) y socket falso. */
async function ponerInstrumentos(page: any) {
  await page.addInitScript(() => {
    const w = window as any;
    w.__voz146 = { micro: 0, sockets: 0, closes: 0, tracks: [] as MediaStreamTrack[] };
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async (...args: any[]) => {
      w.__voz146.micro++;
      const s = await (original as any)(...args);
      w.__voz146.tracks.push(...s.getTracks());
      return s;
    };
    const Nativo = window.WebSocket;
    (window as any).WebSocket = class {
      readyState = 1; onopen: any; onmessage: any;
      constructor(url: string, protocolos?: any) {
        if (!String(url).startsWith('wss://qa146.invalid/')) return new Nativo(url, protocolos) as any;
        w.__voz146.sockets++;
        setTimeout(() => this.onopen?.({}), 0);
      }
      send(raw: string) {
        if (JSON.parse(raw).setup) setTimeout(() => this.onmessage?.({ data: JSON.stringify({ setupComplete: {} }) }), 0);
      }
      close() { this.readyState = 3; w.__voz146.closes++; }
    };
  });
}

const recursos = (page: any) => page.evaluate(() => {
  const v = (window as any).__voz146;
  return { micro: v.micro, sockets: v.sockets, closes: v.closes, vivas: v.tracks.filter((t: any) => t.readyState === 'live').length };
});

test('503 y UN solo toque inicia un pedido nuevo', async ({ page, context, baseURL }) => {
  test.setTimeout(120000);
  let pedidos = 0;
  await ponerInstrumentos(page);
  await page.route('**/api/asistente/voz-en-vivo', async (route) => {
    pedidos++;
    if (pedidos === 1) {
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'QA146: sin clave de prueba' }) });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(FICHA) });
    }
  });
  const limpiar = await abrirAsistente(page, context, baseURL);
  try {
    const boton = page.getByTestId('boton-hablar-en-vivo');
    await boton.click();
    await expect(page.getByText('QA146: sin clave de prueba', { exact: true })).toBeVisible();
    await expect(boton).toHaveAttribute('title', /Hablar en vivo/);
    expect(pedidos).toBe(1);
    await boton.click(); // un solo toque
    await expect.poll(() => pedidos).toBe(2);
    await expect(page.getByTestId('panel-voz-en-vivo')).toBeVisible();
    await expect(boton).toHaveAttribute('title', /Cortar/);
    await expect.poll(async () => (await recursos(page)).sockets).toBe(1);
  } finally {
    await page.evaluate(() => (window as any).__voz146?.tracks.forEach((t: any) => t.stop())).catch(() => {});
    limpiar();
  }
});

test('cortar antes de la ficha: ni micrófono ni socket ni panel cuando llega tarde', async ({ page, context, baseURL }) => {
  test.setTimeout(120000);
  let pedidos = 0;
  let liberar!: () => void;
  const espera = new Promise<void>((r) => { liberar = r; });
  await ponerInstrumentos(page);
  await page.route('**/api/asistente/voz-en-vivo', async (route) => {
    pedidos++;
    await espera;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(FICHA) }).catch(() => {});
  });
  const limpiar = await abrirAsistente(page, context, baseURL);
  try {
    const boton = page.getByTestId('boton-hablar-en-vivo');
    await boton.click();
    await expect.poll(() => pedidos).toBe(1);
    await expect(boton).toHaveAttribute('title', /Cortar/);
    await boton.click();
    await expect(page.getByTestId('panel-voz-en-vivo')).toHaveCount(0);
    liberar();
    await page.waitForTimeout(2000);
    const despues = await recursos(page);
    expect(despues.micro, 'Cortar antes de la ficha no puede pedir el micrófono').toBe(0);
    expect(despues.sockets).toBe(0);
    await expect(page.getByTestId('panel-voz-en-vivo')).toHaveCount(0);
    await expect(boton).toHaveAttribute('title', /Hablar en vivo/);
  } finally {
    liberar();
    await page.evaluate(() => (window as any).__voz146?.tracks.forEach((t: any) => t.stop())).catch(() => {});
    limpiar();
  }
});

test('cortar y empezar de nuevo: vive sólo el último y la respuesta tardía del primero se descarta', async ({ page, context, baseURL }) => {
  test.setTimeout(120000);
  const liberadores: Array<() => void> = [];
  await ponerInstrumentos(page);
  await page.route('**/api/asistente/voz-en-vivo', async (route) => {
    await new Promise<void>((r) => liberadores.push(r));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(FICHA) }).catch(() => {});
  });
  const limpiar = await abrirAsistente(page, context, baseURL);
  try {
    const boton = page.getByTestId('boton-hablar-en-vivo');
    await boton.click();
    await expect.poll(() => liberadores.length).toBe(1);
    await boton.click(); // corta el primero
    await boton.click(); // empieza el segundo
    await expect.poll(() => liberadores.length).toBe(2);
    liberadores[1](); // contesta primero el segundo...
    await expect.poll(async () => (await recursos(page)).sockets).toBe(1);
    liberadores[0](); // ...y después el primero, ya descartado
    await page.waitForTimeout(1500);
    const despues = await recursos(page);
    expect(despues.micro).toBe(1);
    expect(despues.sockets).toBe(1);
    expect(despues.closes).toBe(0);
    await expect(page.getByTestId('panel-voz-en-vivo')).toBeVisible();
  } finally {
    liberadores.forEach((l) => l());
    await page.evaluate(() => (window as any).__voz146?.tracks.forEach((t: any) => t.stop())).catch(() => {});
    limpiar();
  }
});

test('cortar con la conversación en vivo cierra el socket y suelta las pistas', async ({ page, context, baseURL }) => {
  test.setTimeout(120000);
  await ponerInstrumentos(page);
  await page.route('**/api/asistente/voz-en-vivo', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(FICHA) }));
  const limpiar = await abrirAsistente(page, context, baseURL);
  try {
    const boton = page.getByTestId('boton-hablar-en-vivo');
    await boton.click();
    await expect(page.getByTestId('panel-voz-en-vivo')).toContainText('En vivo');
    expect((await recursos(page)).vivas).toBeGreaterThan(0);
    await boton.click();
    await expect(page.getByTestId('panel-voz-en-vivo')).toHaveCount(0);
    const despues = await recursos(page);
    expect(despues.closes).toBe(1);
    await expect.poll(async () => (await recursos(page)).vivas).toBe(0);
  } finally {
    await page.evaluate(() => (window as any).__voz146?.tracks.forEach((t: any) => t.stop())).catch(() => {});
    limpiar();
  }
});
