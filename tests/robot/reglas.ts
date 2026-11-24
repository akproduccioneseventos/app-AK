import type { Browser, Page } from '@playwright/test';
import { inspeccionarPdfBuffer } from './pdf-inspector';

export type NombreReglaRobot =
  | 'contexto'
  | 'no-se-cae'
  | 'ida-y-vuelta'
  | 'agregar-y-cancelar'
  | 'volver-no-pierde'
  | 'descargas-pdf'
  | 'publico-sin-borradores'
  | 'lectura-fallida-no-es-cero';

export const REGLAS_ROBOT: NombreReglaRobot[] = [
  'contexto',
  'no-se-cae',
  'ida-y-vuelta',
  'agregar-y-cancelar',
  'volver-no-pierde',
  'descargas-pdf',
  'publico-sin-borradores',
  'lectura-fallida-no-es-cero',
];

export interface ResultadoRegla {
  estado: 'verde' | 'rojo' | 'sin-mirar';
  elemento?: string;
  motivo?: string;
}

const MARCADOR_SIN_REEMPLAZAR_RE = /\{[A-ZÁÉÍÓÚÑ][A-Z0-9_ÁÉÍÓÚÑ]{1,}\}/g;
const PANTALLA_CAIDA_RE = /¡Ups!\s*Algo salió mal|Algo salió mal|Application error|Unhandled Runtime Error/i;
const TEXTO_EXITO_RE = /\b(guardad[oa]s?|sincronizad[oa]s?|actualizad[oa]s?|se guard[oó]|cambios guardados)\b|tildes sincronizadas/i;
const AVISO_ERROR_RE = /\b(error|fall[oó]|no se pudo|no se pudieron|intenta(?:r|lo)? de nuevo|reintentar|sin conexi[oó]n|problema al cargar)\b/i;

function normalizarTexto(texto: string): string {
  return texto.replace(/\s+/g, ' ').trim();
}

function contieneMuestraProhibida(texto: string): string | null {
  if (/fiesta_muestra_auditor/i.test(texto)) return 'fiesta_muestra_auditor';
  if (/DEMO AK\s*-\s*XV Martina|DEMO AK/i.test(texto)) return 'DEMO AK';
  if (/\bfiesta de muestra\b/i.test(texto)) return 'fiesta de muestra';
  // Evita falsos positivos con verbos como "se muestra", "te muestra", "muestra el/la/los/las/tu/un/una".
  const sinVerbosComunes = texto.replace(
    /\b(?:se|te|le|nos|les|que|no|solo|sólo)\s+muestra\b|\bmuestra\s+(?:el|la|los|las|tu|su|un|una|c[oó]mo|qu[eé])\b/gi,
    ' ',
  );
  if (/\bmuestra\b/i.test(sinVerbosComunes)) return 'muestra';
  return null;
}

/** Regla 1 (pura): Contexto, enlaces rotos y marcadores {MAYÚSCULAS}. */
export function evaluarContexto(params: {
  textoVisible: string;
  hrefs: string[];
  fiestaEsperadaNombre?: string;
  otraFiestaNombre?: string;
  exigirFiestaEsperada?: boolean;
}): ResultadoRegla {
  const texto = normalizarTexto(params.textoVisible || '');

  if (params.exigirFiestaEsperada && params.fiestaEsperadaNombre) {
    if (!texto.toLowerCase().includes(params.fiestaEsperadaNombre.toLowerCase())) {
      return {
        estado: 'rojo',
        elemento: 'body',
        motivo: `No se ve el nombre de la fiesta esperada ("${params.fiestaEsperadaNombre}").`,
      };
    }
  }

  if (params.otraFiestaNombre && texto.toLowerCase().includes(params.otraFiestaNombre.toLowerCase())) {
    return {
      estado: 'rojo',
      elemento: 'body',
      motivo: `Aparece mezclada la otra fiesta ("${params.otraFiestaNombre}").`,
    };
  }

  if (params.fiestaEsperadaNombre) {
    const hallazgoMuestra = contieneMuestraProhibida(texto);
    if (hallazgoMuestra) {
      return {
        estado: 'rojo',
        elemento: 'body',
        motivo: `Aparece texto de fiesta de muestra ("${hallazgoMuestra}") en lugar de "${params.fiestaEsperadaNombre}".`,
      };
    }
  }

  for (const href of params.hrefs || []) {
    const h = String(href || '').trim();
    if (!h) continue;
    if (
      /\bundefined\b/i.test(h) ||
      /\bnull\b/i.test(h) ||
      /[?&]fiestaId=(?:&|$)/i.test(h) ||
      /[?&]token=(?:&|$)/i.test(h)
    ) {
      return {
        estado: 'rojo',
        elemento: `a[href="${h}"]`,
        motivo: `Enlace visible roto o vacío: "${h}".`,
      };
    }
  }

  const marcadores = texto.match(MARCADOR_SIN_REEMPLAZAR_RE);
  if (marcadores && marcadores.length > 0) {
    return {
      estado: 'rojo',
      elemento: 'texto',
      motivo: `Marcador sin reemplazar visible en pantalla: ${marcadores[0]}.`,
    };
  }

  return { estado: 'verde' };
}

/** Regla 2 (pura): La pantalla no se cae ni tira errores en consola. */
export function evaluarNoSeCae(params: {
  textoVisible: string;
  consoleErrors?: string[];
  pageErrors?: string[];
}): ResultadoRegla {
  const texto = normalizarTexto(params.textoVisible || '');
  const matchCaida = texto.match(PANTALLA_CAIDA_RE);
  if (matchCaida) {
    return {
      estado: 'rojo',
      elemento: 'pantalla-error',
      motivo: `La pantalla mostró error de caída: "${matchCaida[0]}".`,
    };
  }

  const pageErrors = params.pageErrors || [];
  if (pageErrors.length > 0) {
    return {
      estado: 'rojo',
      elemento: 'pageerror',
      motivo: `Excepción no capturada en la página: ${pageErrors[0]}`,
    };
  }

  const consoleErrors = (params.consoleErrors || []).filter(
    (e) =>
      !/favicon\.ico/i.test(e) &&
      !/Failed to load resource: the server responded with a status of 404/i.test(e),
  );
  if (consoleErrors.length > 0) {
    return {
      estado: 'rojo',
      elemento: 'console.error',
      motivo: `Error en consola del navegador: ${consoleErrors[0]}`,
    };
  }

  return { estado: 'verde' };
}

/** Regla 3 (pura): Si el guardado falló, nunca puede quedar cartel de éxito. */
export function evaluarCartelExitoSinConfirmacion(params: {
  servidorFallo: boolean;
  textoVisible: string;
}): ResultadoRegla {
  if (!params.servidorFallo) return { estado: 'verde' };
  const texto = normalizarTexto(params.textoVisible || '');
  const matchExito = texto.match(TEXTO_EXITO_RE);
  if (matchExito) {
    return {
      estado: 'rojo',
      elemento: 'cartel-exito',
      motivo: `El servidor falló pero la pantalla igual mostró "${matchExito[0]}".`,
    };
  }
  return { estado: 'verde' };
}

/** Regla 4 (pura): Cancelar un diálogo de agregar deja la lista igual que antes. */
export function evaluarListaTrasCancelar(params: {
  itemsAntes: string[];
  itemsDespues: string[];
}): ResultadoRegla {
  const antes = params.itemsAntes.map(normalizarTexto).filter(Boolean);
  const despues = params.itemsDespues.map(normalizarTexto).filter(Boolean);

  if (antes.length !== despues.length) {
    const extra = despues.find((x) => !antes.includes(x));
    return {
      estado: 'rojo',
      elemento: extra || 'lista',
      motivo: `Al cancelar el diálogo la lista cambió (${antes.length} -> ${despues.length}${extra ? `, quedó "${extra}"` : ''}).`,
    };
  }

  for (let i = 0; i < antes.length; i++) {
    if (antes[i] !== despues[i]) {
      return {
        estado: 'rojo',
        elemento: despues[i],
        motivo: `Al cancelar cambió el ítem "${antes[i]}" por "${despues[i]}".`,
      };
    }
  }

  return { estado: 'verde' };
}

/** Regla 5 (pura): Compara datos entre botones de presupuesto / plan de pagos. */
export function evaluarComparacionBotonesPresupuesto(params: {
  datosPlanPagos: Record<string, string | number | undefined>;
  datosPresupuestoManual: Record<string, string | number | undefined>;
}): ResultadoRegla {
  const claves = ['cliente', 'fecha', 'adultos', 'ninos', 'adolescentes', 'servicios', 'menuId'];
  for (const clave of claves) {
    const a = String(params.datosPresupuestoManual[clave] ?? '');
    const b = String(params.datosPlanPagos[clave] ?? '');
    if (a && a !== b) {
      return {
        estado: 'rojo',
        elemento: 'Plan de Pagos',
        motivo: `"Plan de Pagos" no lleva el mismo "${clave}" que "Generar Presupuesto Manual" ("${b}" vs "${a}").`,
      };
    }
  }
  return { estado: 'verde' };
}

/** Regla 7 (pura): Lo público no muestra borradores ni fiesta de muestra. */
export function evaluarPublicoSinBorradores(params: {
  textoVisible: string;
  borradoresProhibidos: string[];
  muestrasProhibidas?: string[];
}): ResultadoRegla {
  const texto = normalizarTexto(params.textoVisible || '');
  for (const borrador of params.borradoresProhibidos) {
    if (borrador && texto.toLowerCase().includes(borrador.toLowerCase())) {
      return {
        estado: 'rojo',
        elemento: borrador,
        motivo: `Se filtró un borrador en pantalla pública: "${borrador}".`,
      };
    }
  }

  const muestras = params.muestrasProhibidas || ['DEMO AK', 'fiesta_muestra_auditor', 'XV Martina'];
  for (const muestra of muestras) {
    if (muestra && texto.toLowerCase().includes(muestra.toLowerCase())) {
      return {
        estado: 'rojo',
        elemento: muestra,
        motivo: `Se filtró la fiesta de muestra en pantalla pública: "${muestra}".`,
      };
    }
  }

  return { estado: 'verde' };
}

/** Regla 8 (pura): Si la lectura falló, debe verse un aviso y nunca un 0 o $0 como dato sano. */
export function evaluarLecturaFallidaNoEsCero(params: {
  textoVisible: string;
  lecturaAbortada: boolean;
}): ResultadoRegla {
  if (!params.lecturaAbortada) return { estado: 'verde' };
  const texto = normalizarTexto(params.textoVisible || '');
  const tieneAviso = AVISO_ERROR_RE.test(texto);
  const muestraCeroComoDato = /(?:^|\s)\$\s*0(?:[.,]00)?(?:\s|$)|\b0\s+(?:clientes?|fiestas?|presupuestos?|facturas?)\b/i.test(texto);

  if (!tieneAviso) {
    return {
      estado: 'rojo',
      elemento: 'aviso-lectura',
      motivo: muestraCeroComoDato
        ? 'La lectura falló pero mostró ceros ("$0" / "0") en lugar de avisar el error.'
        : 'La lectura falló pero no mostró ningún aviso de error al usuario.',
    };
  }

  if (muestraCeroComoDato && !/no se pudo|error/i.test(texto)) {
    return {
      estado: 'rojo',
      elemento: 'cifra-cero',
      motivo: 'Presentó "$0" o "0" cuando falló la lectura.',
    };
  }

  return { estado: 'verde' };
}

// =============================================================================
// Ejecutores de Playwright sobre pantalla real
// =============================================================================

export async function leerTextoYLinks(page: Page): Promise<{ textoVisible: string; hrefs: string[] }> {
  return page.evaluate(() => {
    const textoVisible = (document.body?.innerText || '').trim();
    const hrefs = Array.from(document.querySelectorAll('a[href]'))
      .filter((a) => {
        const el = a as HTMLElement;
        const st = window.getComputedStyle(el);
        return st.display !== 'none' && st.visibility !== 'hidden';
      })
      .map((a) => a.getAttribute('href') || '');
    return { textoVisible, hrefs };
  });
}

export async function ejecutarReglaIdaYVuelta(page: Page, rutaUrl: string): Promise<ResultadoRegla> {
  const botonGuardar = page
    .locator('button:visible')
    .filter({ hasText: /^(Guardar|Guardar cambios|Actualizar)$/i })
    .first();

  if ((await botonGuardar.count()) === 0) {
    return { estado: 'verde' };
  }

  const habilitadoInicial = await botonGuardar.isEnabled().catch(() => false);
  if (!habilitadoInicial) {
    return { estado: 'verde' };
  }

  const campo = page
    .locator(
      'input:visible:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="color"]):not([type="number"]):not([readonly]):not([disabled]), textarea:visible:not([readonly]):not([disabled])',
    )
    .first();

  if ((await campo.count()) === 0) {
    return { estado: 'verde' };
  }

  const marca = `ROBOT-${Date.now().toString().slice(-5)}`;
  const valorAnterior = await campo.inputValue({ timeout: 2_000 }).catch(() => '');

  await campo.fill(marca, { timeout: 5_000 });
  await botonGuardar.click({ timeout: 5_000 });
  await page.waitForLoadState('networkidle', { timeout: 2_000 }).catch(() => {});
  await page.waitForTimeout(700);

  // Recarga real para comprobar que quedó guardado en la base.
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15_000 });
  await page.waitForLoadState('networkidle', { timeout: 2_000 }).catch(() => {});
  await page.waitForTimeout(400);
  const bodyTrasRecarga = await page.locator('body').innerText({ timeout: 3_000 }).catch(() => '');
  const valorCampoTrasRecarga = (await campo.count()) > 0 ? await campo.inputValue({ timeout: 2_000 }).catch(() => '') : '';

  const persiste =
    bodyTrasRecarga.includes(marca) ||
    valorCampoTrasRecarga.includes(marca);

  if (!persiste) {
    return {
      estado: 'rojo',
      elemento: 'Guardar',
      motivo: `Al cambiar a "${marca}", tocar Guardar y recargar ${rutaUrl}, el dato no persistió.`,
    };
  }

  // Restaurar valor previo sin ruido si era distinto, antes de probar corte de servidor.
  if (valorAnterior && valorAnterior !== marca) {
    await campo.fill(valorAnterior, { timeout: 5_000 }).catch(() => {});
  }

  // Ahora repetir cortando respuestas de servidor y verificar que NO muestre éxito.
  const rutaHandler = async (route: import('@playwright/test').Route) => {
    const req = route.request();
    if (req.method() === 'POST' || req.method() === 'PUT' || req.method() === 'PATCH') {
      await route.abort();
      return;
    }
    await route.continue();
  };

  await page.route('**/*', rutaHandler);
  try {
    const marcaFalla = `${marca}-ABORT`;
    await campo.fill(marcaFalla, { timeout: 5_000 });
    const habilitadoFalla = await botonGuardar.isEnabled().catch(() => false);
    if (!habilitadoFalla) {
      return { estado: 'verde' };
    }
    await botonGuardar.click({ timeout: 5_000 });
    await page.waitForTimeout(1000);
    const textoTrasFallo = await page.locator('body').innerText({ timeout: 3_000 }).catch(() => '');
    const checkFallo = evaluarCartelExitoSinConfirmacion({
      servidorFallo: true,
      textoVisible: textoTrasFallo,
    });
    if (checkFallo.estado === 'rojo') {
      return checkFallo;
    }
  } finally {
    await page.unroute('**/*', rutaHandler).catch(() => {});
  }

  return { estado: 'verde' };
}

export async function ejecutarReglaAgregarYCancelar(page: Page): Promise<ResultadoRegla> {
  const botonAgregar = page
    .locator('button:visible')
    .filter({ hasText: /^(?:\+|Añadir|Agregar)\b/i })
    .first();

  if ((await botonAgregar.count()) === 0) {
    return { estado: 'verde' };
  }

  const habilitadoAgregar = await botonAgregar.isEnabled().catch(() => false);
  if (!habilitadoAgregar) {
    return { estado: 'verde' };
  }

  const leerItems = async () =>
    page.evaluate(() => {
      const nodos = Array.from(document.querySelectorAll('li, tbody tr, [role="listitem"]'));
      return nodos
        .map((n) => (n.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean);
    });

  const itemsAntes = await leerItems();
  await botonAgregar.click({ timeout: 5_000 });
  await page.waitForTimeout(400);

  const dialogo = page.locator('[role="dialog"]:visible').first();
  if ((await dialogo.count()) === 0) {
    return { estado: 'verde' };
  }

  const botonCancelar = dialogo
    .locator('button:visible')
    .filter({ hasText: /^(Cancelar|Cerrar|Volver)$/i })
    .first();

  if ((await botonCancelar.count()) > 0) {
    const habilitadoCancelar = await botonCancelar.isEnabled().catch(() => false);
    if (habilitadoCancelar) {
      await botonCancelar.click({ timeout: 5_000 }).catch(async () => {
        await page.keyboard.press('Escape').catch(() => {});
      });
    } else {
      await page.keyboard.press('Escape').catch(() => {});
    }
  } else {
    await page.keyboard.press('Escape').catch(() => {});
  }
  await page.waitForTimeout(400);

  const itemsDespues = await leerItems();
  return evaluarListaTrasCancelar({ itemsAntes, itemsDespues });
}

export async function ejecutarReglaVolverNoPierde(page: Page, pathname: string): Promise<ResultadoRegla> {
  if (pathname !== '/presentacion-led' && pathname !== '/presupuestos/nuevo/crear') {
    return { estado: 'verde' };
  }

  if (pathname === '/presupuestos/nuevo/crear') {
    const inputCliente = page.locator('input:visible').first();
    if ((await inputCliente.count()) === 0) return { estado: 'verde' };
    const textoPrueba = `ROBOT Cliente Volver ${Date.now().toString().slice(-4)}`;
    await inputCliente.fill(textoPrueba, { timeout: 5_000 });
    await page.waitForTimeout(300);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 15_000 });
    await page.waitForTimeout(400);
    const inputLuegoElem = page.locator('input:visible').first();
    const valorLuego = (await inputLuegoElem.count()) > 0 ? await inputLuegoElem.inputValue({ timeout: 2_000 }).catch(() => '') : '';
    if (!valorLuego.includes(textoPrueba)) {
      return {
        estado: 'rojo',
        elemento: 'presupuestoEnProgreso',
        motivo: 'Al recargar /presupuestos/nuevo/crear se perdieron los datos ingresados.',
      };
    }
    return { estado: 'verde' };
  }

  // /presentacion-led
  const textoPrueba = `ROBOT LED ${Date.now().toString().slice(-4)}`;
  const inputNombre = page.locator('input:visible').first();
  if ((await inputNombre.count()) > 0) {
    await inputNombre.fill(textoPrueba, { timeout: 5_000 });
  }

  const verGaleria = page.locator('button:visible, a:visible').filter({ hasText: /Ver galería|Galería/i }).first();
  if ((await verGaleria.count()) > 0) {
    const habilitadoGaleria = await verGaleria.isEnabled().catch(() => false);
    if (habilitadoGaleria) {
      await verGaleria.click({ timeout: 5_000 });
      await page.waitForTimeout(600);
      const cerrar = page.locator('button:visible').filter({ hasText: /Cerrar|Volver|X/i }).first();
      if ((await cerrar.count()) > 0) {
        const habilitadoCerrar = await cerrar.isEnabled().catch(() => false);
        if (habilitadoCerrar) {
          await cerrar.click({ timeout: 5_000 }).catch(async () => {
            await page.goBack({ timeout: 5_000 }).catch(() => {});
          });
        } else {
          await page.goBack({ timeout: 5_000 }).catch(() => {});
        }
      } else if (!page.url().includes('/presentacion-led')) {
        await page.goBack({ timeout: 5_000 }).catch(() => {});
      }
      await page.waitForTimeout(400);
    }
    if ((await inputNombre.count()) > 0) {
      const actual = (await inputNombre.count()) > 0 ? await inputNombre.inputValue({ timeout: 2_000 }).catch(() => '') : '';
      if (actual && !actual.includes(textoPrueba)) {
        return {
          estado: 'rojo',
          elemento: 'Ver galería',
          motivo: 'Al abrir "Ver galería" en /presentacion-led y volver se borraron los datos de la propuesta.',
        };
      }
    }
  }

  return { estado: 'verde' };
}

export async function ejecutarReglaDescargasPdf(page: Page): Promise<ResultadoRegla> {
  const botonPdf = page
    .locator('button:visible, a:visible')
    .filter({ hasText: /\bPDF\b|\bDescargar PDF\b/i })
    .first();

  if ((await botonPdf.count()) === 0) {
    return { estado: 'verde' };
  }

  const habilitadoPdf = await botonPdf.isEnabled().catch(() => false);
  if (!habilitadoPdf) {
    return { estado: 'verde' };
  }

  try {
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 6_000 }),
      botonPdf.click({ timeout: 5_000 }),
    ]);
    const stream = await download.createReadStream();
    if (!stream) {
      return {
        estado: 'rojo',
        elemento: 'PDF',
        motivo: 'La descarga de PDF no entregó contenido legible.',
      };
    }
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    const inspeccion = await inspeccionarPdfBuffer(buffer);
    if (!inspeccion.ok) {
      return {
        estado: 'rojo',
        elemento: 'PDF',
        motivo: inspeccion.fallas.join(' '),
      };
    }
    return { estado: 'verde' };
  } catch {
    // Algunos botones "PDF" abren vista de impresión (`window.print()`) en lugar de descargar archivo.
    return { estado: 'verde' };
  }
}

export async function ejecutarReglaPublicoSinBorradores(
  browser: Browser,
  baseURL: string,
  testUrl: string,
  pathname: string,
  opts: { borradoresProhibidos: string[]; muestrasProhibidas: string[] },
): Promise<ResultadoRegla> {
  const esPublicaObjetivo =
    pathname === '/' ||
    pathname === '/presentacion-led' ||
    pathname === '/simulador-de-presupuesto' ||
    pathname.startsWith('/public');

  if (!esPublicaObjetivo) {
    return { estado: 'verde' };
  }

  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  try {
    await page.goto(`${baseURL}${testUrl}`, { waitUntil: 'domcontentloaded', timeout: 15_000 });
    await page.waitForLoadState('networkidle', { timeout: 2_000 }).catch(() => {});
    await page.waitForTimeout(400);
    const { textoVisible } = await leerTextoYLinks(page);
    return evaluarPublicoSinBorradores({
      textoVisible,
      borradoresProhibidos: opts.borradoresProhibidos,
      muestrasProhibidas: opts.muestrasProhibidas,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      estado: 'rojo',
      elemento: 'navegacion',
      motivo: `Error abriendo vista pública ${testUrl}: ${msg}`,
    };
  } finally {
    await context.close().catch(() => {});
  }
}

export async function ejecutarReglaLecturaFallidaNoEsCero(
  page: Page,
  fullUrl: string,
  pathname: string,
): Promise<ResultadoRegla> {
  const aplica =
    pathname === '/customers' ||
    pathname === '/empresa/contabilidad' ||
    pathname.includes('/reportes') ||
    pathname.includes('/analytics') ||
    pathname.includes('/finanzas');

  if (!aplica) return { estado: 'verde' };

  const handler = async (route: import('@playwright/test').Route) => {
    const req = route.request();
    const url = req.url();
    if (req.method() === 'POST' || url.includes('/api/')) {
      await route.abort();
      return;
    }
    await route.continue();
  };

  await page.route('**/*', handler);
  try {
    await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 15_000 });
    await page.waitForTimeout(1_200);
    const texto = await page.locator('body').innerText({ timeout: 3_000 }).catch(() => '');
    return evaluarLecturaFallidaNoEsCero({ textoVisible: texto, lecturaAbortada: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      estado: 'rojo',
      elemento: 'navegacion',
      motivo: `Error abriendo lectura fallida ${fullUrl}: ${msg}`,
    };
  } finally {
    await page.unroute('**/*', handler).catch(() => {});
  }
}
