import { expect, test } from '@playwright/test';
import { borrarFiesta, crearFiestaDeEstaNoche } from './helpers/fiesta-de-prueba';

/**
 * La tarjeta que aparece al pegar un enlace en WhatsApp.
 *
 * AK comparte enlaces por WhatsApp todo el tiempo: la invitación al invitado, el
 * catálogo y el simulador al prospecto. Si el enlace no lleva título, descripción
 * e imagen, en el chat aparece pelado y da mala impresión antes de que nadie lo
 * abra.
 *
 * Defecto real que motivó esta prueba: la invitación decía "Evento Especial -
 * Valentina" para una fiesta llamada "XV de Valentina", y sin ninguna foto.
 */

const fiesta = crearFiestaDeEstaNoche({ id: `e2e_tarjeta_${Date.now()}` });

test.afterAll(() => {
  borrarFiesta(fiesta.id);
});

/** Lee del HTML los datos con los que WhatsApp arma la tarjeta. */
async function leerTarjeta(request: import('@playwright/test').APIRequestContext, ruta: string) {
  const respuesta = await request.get(ruta);
  const html = await respuesta.text();
  const buscar = (propiedad: string) => {
    const directo = html.match(new RegExp(`property="${propiedad}"[^>]*content="([^"]*)"`, 'i'));
    const invertido = html.match(new RegExp(`content="([^"]*)"[^>]*property="${propiedad}"`, 'i'));
    return (directo?.[1] ?? invertido?.[1] ?? '').trim();
  };
  return {
    estado: respuesta.status(),
    titulo: (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? '').trim(),
    ogTitulo: buscar('og:title'),
    ogDescripcion: buscar('og:description'),
    ogImagen: buscar('og:image'),
  };
}

const TITULO_GENERICO = /Plataforma inteligente|Producción Integral de Fiestas/i;

test.describe('tarjetas al compartir por WhatsApp', () => {
  test('la invitación lleva el nombre real de la fiesta y una foto', async ({ request }) => {
    const tarjeta = await leerTarjeta(request, `/invitacion/${fiesta.id}`);

    expect(tarjeta.estado).toBeLessThan(400);
    // El nombre que cargó el equipo, no una etiqueta genérica.
    expect(tarjeta.ogTitulo).toContain('Fiesta de esta noche');
    expect(tarjeta.ogTitulo).not.toMatch(/Evento Especial/i);
    expect(tarjeta.ogDescripcion.length).toBeGreaterThan(10);
    expect(tarjeta.ogImagen, 'La invitación se comparte sin ninguna imagen').not.toBe('');
  });

  test('el simulador tiene su propia tarjeta y no la genérica de la app', async ({ request }) => {
    const tarjeta = await leerTarjeta(request, '/simulador-de-presupuesto');

    expect(tarjeta.estado).toBeLessThan(400);
    expect(tarjeta.titulo, 'El simulador muestra el título genérico de la app').not.toMatch(TITULO_GENERICO);
    expect(tarjeta.ogTitulo.length).toBeGreaterThan(5);
    expect(tarjeta.ogImagen, 'El simulador se comparte sin imagen').not.toBe('');
  });

  test('cada catálogo tiene su propia tarjeta, no la genérica', async ({ request }) => {
    // Es material de venta: se le pasa el enlace al prospecto por WhatsApp.
    for (const [ruta, esperado] of [
      ['/catalogo/bodas', /Bodas/i],
      ['/catalogo/xv-anos', /XV/i],
      ['/catalogo/cumpleanos', /Cumpleaños/i],
    ] as const) {
      const tarjeta = await leerTarjeta(request, ruta);
      expect(tarjeta.estado, ruta).toBeLessThan(400);
      expect(tarjeta.titulo, `${ruta} muestra el título genérico de la app`).not.toMatch(TITULO_GENERICO);
      expect(tarjeta.ogTitulo, ruta).toMatch(esperado);
      expect(tarjeta.ogImagen, `${ruta} se comparte sin imagen`).not.toBe('');
    }
  });

  test('la portada sigue teniendo su tarjeta completa', async ({ request }) => {
    const tarjeta = await leerTarjeta(request, '/');

    expect(tarjeta.ogTitulo.length).toBeGreaterThan(5);
    expect(tarjeta.ogDescripcion.length).toBeGreaterThan(10);
    expect(tarjeta.ogImagen).not.toBe('');
  });
});
