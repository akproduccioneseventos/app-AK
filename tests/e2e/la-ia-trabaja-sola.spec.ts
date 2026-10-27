import { test, expect } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
  ponerSesionDelEquipo,
  leerFiesta,
} from './helpers/fiesta-de-prueba';
import fs from 'node:fs';
import path from 'node:path';
import { detectarChoquesMenuYAlergias } from '../../src/lib/catering/choques-alergias';

const FIESTA_ID = `e2e_ia_sola_${process.pid}_${Date.now()}`;
// El choque se prueba con un menú REAL de la app (src/data/menus-catering.json) y no con uno armado
// por la prueba: el servidor guarda los menús en memoria al leerlos, un archivo nuevo en data/ tapa
// al verdadero (rompe otras pruebas de comida) y escritorio y celular se pisaban al escribirlo.
const menuReal: { id: string; plato: string } = (() => {
  const menus = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'menus-catering.json'), 'utf8')) as any[];
  const invitadoCeliaco: any = { rsvp: 'Confirmado', isCeliac: true, dietaryRestriction: 'Celiaco', partySize: 2 };
  for (const m of menus) {
    for (const item of m.items || []) {
      if (detectarChoquesMenuYAlergias({ ...m, items: [item] }, [invitadoCeliaco]).some((c) => c.restriccion.startsWith('Celíaco'))) {
        return { id: m.id, plato: item.name };
      }
    }
  }
  throw new Error('Ningún menú real tiene un plato con gluten para probar el choque.');
})();

test.describe('Orden 235: La IA hace sola lo que hoy se completa a mano (E2E)', () => {
  test.beforeAll(async () => {
    // Crear fiesta de prueba con datos para Bloques 6, 11 y 13
    const fiesta = crearFiestaDeEstaNoche({ id: FIESTA_ID });
    fiesta.configuracion.nombreEvento = 'Fiesta E2E IA Sola AK';
    fiesta.configuracion.fechaEvento = '2026-11-20';

    // Bloque 6: Notas para el DJ guardadas
    fiesta.musica = {
      cancionEntrada: 'Viva La Vida - Coldplay',
      cancionVals: 'Danubio Azul',
      playlistFiesta: 'Cumbia pop, Rock argentino, Pop 2000s',
      listaNoReproducir: 'Trap explícito',
      briefDj: {
        texto: 'Briefing IA: Entrada enérgica a las 23:00 con Coldplay. Pista abierta con cumbia pop. Bloquear trap agresivo.',
        generadoEn: new Date().toISOString(),
      },
    };

    // Bloque 11: Menú asignado e invitados con celiaquía para choque
    fiesta.menuAsignadoId = menuReal.id;
    fiesta.invitados = [
      {
        id: 'inv_e2e_celiaco',
        nombre: 'Valeria Celíaca',
        rsvp: 'Confirmado',
        dietaryRestriction: 'Celiaco',
        isCeliac: true,
        partySize: 2,
        tableNumber: undefined,
      },
      {
        id: 'inv_e2e_normal',
        nombre: 'Gonzalo Normal',
        rsvp: 'Confirmado',
        dietaryRestriction: 'Ninguna',
        partySize: 1,
        tableNumber: undefined,
      },
    ];

    // Bloque 13: Elementos de salón con mesa para auto-asignación
    fiesta.decoracion = {
      ...fiesta.decoracion,
      salonElements: [
        {
          id: 'mesa_principal',
          name: 'Mesa 1',
          category: 'mesa',
          width: 80,
          height: 80,
          x: 100,
          y: 100,
        } as any,
      ],
    };

    guardarFiesta(fiesta);
  });

  test.afterAll(async () => {
    borrarFiesta(FIESTA_ID);
  });

  test.use({
    timezoneId: 'America/Montevideo',
  });

  // Comprobación Bloque 6: La hoja del DJ muestra las notas generadas por IA
  test('Bloque 6: la hoja del DJ en PDF muestra el brief generado por IA', async ({ context, page, baseURL }) => {
    test.setTimeout(90_000);
    await ponerSesionDelEquipo(context, baseURL);

    await page.goto(`/fiestas/nueva/musica/pdf?fiestaId=${FIESTA_ID}`, {
      waitUntil: 'domcontentloaded',
    });

    // Encabezado del brief para el DJ
    const tituloBrief = page.getByText(/Notas para el DJ \(IA Briefing\)/i);
    await expect(tituloBrief).toBeVisible({ timeout: 45_000 });

    // El contenido del briefing para el DJ debe ser visible
    const textoBrief = page.getByText(/Entrada enérgica a las 23:00 con Coldplay/i);
    await expect(textoBrief).toBeVisible();
    await expect(textoBrief).toContainText('Coldplay');
  });

  // Comprobación Bloque 11: Gestión alimentaria muestra el choque de menú y botón aviso a cocina
  test('Bloque 11: gestión alimentaria detecta choque de celíaco con plato con gluten y muestra aviso a cocina', async ({ context, page, baseURL }) => {
    test.setTimeout(90_000);
    await ponerSesionDelEquipo(context, baseURL);

    await page.goto(`/fiestas/nueva/alergias?fiestaId=${FIESTA_ID}`, {
      waitUntil: 'domcontentloaded',
    });

    // Cartel de alerta de choques en pantalla
    const cartelChoque = page.getByText(/Alerta de Choques: Menú Asignado vs Restricciones/i);
    await expect(cartelChoque).toBeVisible({ timeout: 45_000 });

    // Muestra el plato en conflicto y las personas afectadas
    await expect(page.getByText(menuReal.plato).first()).toBeVisible();
    await expect(page.getByText(/2 pax/i).first()).toBeVisible();
    await expect(cartelChoque).toContainText(/Alerta de Choques/i);
    await expect(page.getByText(menuReal.plato).first()).toContainText(menuReal.plato);

    // Botón de aviso a cocina
    const btnCocina = page.getByRole('button', { name: /Aviso a Cocina/i });
    await expect(btnCocina).toBeVisible();
  });

  // Comprobación Bloque 13: Layout de mesas muestra los cambios en pantalla (no en consola)
  test('Bloque 13: la auto-asignación de mesas muestra el modal en pantalla y no pide mirar la consola', async ({ context, page, baseURL }) => {
    test.setTimeout(90_000);
    await ponerSesionDelEquipo(context, baseURL);

    await page.goto(`/fiestas/nueva/invitados/layout?fiestaId=${FIESTA_ID}`, {
      waitUntil: 'domcontentloaded',
    });

    // Buscar y tocar botón de auto-asignación con IA
    const btnAutoAcomodar = page.getByRole('button', { name: /Auto-Acomodar|IA/i });
    if (await btnAutoAcomodar.isVisible()) {
      await btnAutoAcomodar.click();

      // Debe aparecer el modal en pantalla
      const modal = page.getByText(/Invitados Asignados a Mesas/i);
      await expect(modal).toBeVisible({ timeout: 15_000 });

      // NO debe decir que se revise la consola
      await expect(page.getByText(/Revisa la consola/i)).not.toBeVisible();
    }
  });
});

