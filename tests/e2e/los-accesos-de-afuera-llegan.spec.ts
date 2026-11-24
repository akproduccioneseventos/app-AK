import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import {
  borrarFiesta,
  crearFiestaDeEstaNoche,
  guardarFiesta,
} from './helpers/fiesta-de-prueba';
import { defaultClientPortalSettings } from '@/lib/fiesta-defaults';
import { defaultZonaDigitalAdolescentesSettings } from '@/lib/zona-digital-adolescentes';

const ACCESOS_RUTAS = [
  path.join(process.cwd(), 'data', 'accesos-personal.json'),
  path.join(process.cwd(), 'src', 'data', 'accesos-personal.json'),
];

function respaldoDeAccesos(): Map<string, string | null> {
  const mapa = new Map<string, string | null>();
  for (const archivo of ACCESOS_RUTAS) {
    mapa.set(archivo, fs.existsSync(archivo) ? fs.readFileSync(archivo, 'utf8') : null);
  }
  return mapa;
}

function restaurarAccesos(respaldo: Map<string, string | null>) {
  for (const [archivo, contenido] of respaldo.entries()) {
    if (contenido === null) {
      if (fs.existsSync(archivo)) fs.unlinkSync(archivo);
    } else {
      fs.mkdirSync(path.dirname(archivo), { recursive: true });
      fs.writeFileSync(archivo, contenido, 'utf8');
    }
  }
}

function sembrarAccesoColaborador(acceso: {
  id: string;
  fiestaId: string;
  nombreAcceso: string;
  permisos: string[];
  fechaCreacion: string;
}) {
  for (const archivo of ACCESOS_RUTAS) {
    let lista: any[] = [];
    if (fs.existsSync(archivo)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(archivo, 'utf8'));
        if (Array.isArray(parsed)) lista = parsed;
      } catch {
        lista = [];
      }
    }
    const filtrada = lista.filter((item) => item?.id !== acceso.id);
    filtrada.push(acceso);
    fs.mkdirSync(path.dirname(archivo), { recursive: true });
    fs.writeFileSync(archivo, `${JSON.stringify(filtrada, null, 2)}\n`, 'utf8');
  }
}

test.describe('Orden 337 — Bloque 1: los accesos de afuera llegan sin rebotar al login', () => {
  const fiestaIdConClave = `e2e_afuera_con_clave_${Date.now()}`;
  const fiestaIdSinClave = `e2e_afuera_sin_clave_${Date.now()}`;
  const tokenColaborador = `e2e_tok_colab_${Date.now()}`;
  let backupAccesos: Map<string, string | null>;

  test.beforeAll(async () => {
    backupAccesos = respaldoDeAccesos();

    const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const fiestaConClave = crearFiestaDeEstaNoche({
      id: fiestaIdConClave,
      clavePortal: 'clave-portal-e2e-337',
      fechaEvento: ayer,
    });
    fiestaConClave.configuracion = {
      ...fiestaConClave.configuracion,
      nombreEvento: 'Fiesta E2E Accesos 337',
    };
    fiestaConClave.zonaDigitalAdolescentes = {
      ...defaultZonaDigitalAdolescentesSettings,
      ...(fiestaConClave.zonaDigitalAdolescentes ?? {}),
      enabled: true,
      recapEnabled: true,
      features: fiestaConClave.zonaDigitalAdolescentes?.features ?? [],
    };
    fiestaConClave.invitados = [
      {
        id: 'inv_recap_337',
        guestAccessToken: 'tok-recap-valido-337',
        nombre: 'Invitada Recap',
        rsvp: 'Confirmado',
        categoria: 'Adulto',
        contacto: '099111222',
        partySize: 1,
        tableNumber: '1',
        dietaryRestriction: 'Ninguna',
        cancionesDJ: [],
      },
    ];
    guardarFiesta(fiestaConClave);

    const fiestaSinClave = crearFiestaDeEstaNoche({
      id: fiestaIdSinClave,
      fechaEvento: ayer,
    });
    fiestaSinClave.clientPortalSettings = {
      ...defaultClientPortalSettings,
      ...(fiestaSinClave.clientPortalSettings ?? {}),
      enabled: true,
      accessKey: '',
    };
    guardarFiesta(fiestaSinClave);

    sembrarAccesoColaborador({
      id: tokenColaborador,
      fiestaId: fiestaIdConClave,
      nombreAcceso: 'Proveedor Externo 337',
      permisos: ['reposteria', 'fotografia'],
      fechaCreacion: new Date().toISOString(),
    });
  });

  test.afterAll(async () => {
    borrarFiesta(fiestaIdConClave);
    borrarFiesta(fiestaIdSinClave);
    restaurarAccesos(backupAccesos);
  });

  test('/buscar carga 200 sin sesión, no redirige a /login y busca contenido público', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    const response = await page.goto('/buscar', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/buscar$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/qué estás buscando/i);

    const input = page.getByPlaceholder(/15 años, bodas/i);
    await input.fill('fotocabina');
    await expect(input).toHaveValue('fotocabina');
    await expect(page.getByText(/resultado(s)? encontrado/i)).toContainText(/resultado/i);
  });

  test('/recap permite entrar al invitado con token válido y devuelve 404 con token inválido', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    const okRes = await page.goto(
      `/invitacion/${fiestaIdConClave}/recap?guestId=inv_recap_337&token=tok-recap-valido-337`,
      { waitUntil: 'domcontentloaded' },
    );
    expect(okRes?.status()).toBe(200);
    await expect(page).toHaveURL(new RegExp(`/invitacion/${fiestaIdConClave}/recap`));
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Fiesta E2E Accesos 337');

    const badRes = await page.goto(
      `/invitacion/${fiestaIdConClave}/recap?guestId=inv_recap_337&token=token-falso`,
      { waitUntil: 'domcontentloaded' },
    );
    expect(badRes?.status()).toBe(404);
  });

  test('enlace de colaborador Repostería y Fotografía entra sin caer en /login', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');
    test.setTimeout(120_000);

    // 1. Portal del colaborador
    await page.goto(`/acceso-personal/${tokenColaborador}`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(new RegExp(`/acceso-personal/${tokenColaborador}`));
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Proveedor Externo 337', { timeout: 30_000 });

    const linkReposteria = page.getByRole('link', { name: /detalles de repostería/i });
    const linkFotografia = page.getByRole('link', { name: /seguimiento de material/i });

    await expect(linkReposteria).toHaveAttribute('href', new RegExp(`/fiestas/nueva/comida\\?tab=catering&fiestaId=${fiestaIdConClave}&token=${tokenColaborador}`));
    await expect(linkFotografia).toHaveAttribute('href', new RegExp(`/fiestas/nueva/show\\?tab=fotografia&fiestaId=${fiestaIdConClave}&token=${tokenColaborador}`));

    // 2. Navegar a Repostería sin sesión
    await linkReposteria.click();
    await expect(page).toHaveURL(new RegExp(`/fiestas/nueva/comida\\?tab=catering.*token=${tokenColaborador}`), { timeout: 30_000 });
    await expect(page.getByTestId('catering-page')).toContainText('Gastronomía del Evento', { timeout: 30_000 });
    await expect(page.getByText('Acceso No Autorizado')).toHaveCount(0);

    // 3. Navegar directamente a Fotografía sin sesión
    await page.goto(
      `/fiestas/nueva/show?tab=fotografia&fiestaId=${fiestaIdConClave}&token=${tokenColaborador}`,
      { waitUntil: 'domcontentloaded' },
    );
    await expect(page).toHaveURL(new RegExp(`/fiestas/nueva/show\\?tab=fotografia.*token=${tokenColaborador}`));
    await expect(page.getByRole('heading', { name: 'Seguimiento de Material' })).toContainText('Seguimiento de Material', { timeout: 30_000 });
    await expect(page.getByText('Acceso No Autorizado')).toHaveCount(0);
  });

  test('/q/[fiestaId] apunta el botón Cliente al portal del cliente y nunca al planificador interno', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    // Con accessKey -> /portal/c/...
    await page.goto(`/q/${fiestaIdConClave}`, { waitUntil: 'domcontentloaded' });
    const linkClienteConClave = page.locator('a', { hasText: /^Cliente/ }).first();
    await expect(linkClienteConClave).toHaveAttribute('href', '/portal/c/clave-portal-e2e-337');
    await expect(page.locator('a[href*="/fiestas/nueva/portal-cliente"]')).toHaveCount(0);

    // Sin accessKey -> /portal?fiestaId=...
    await page.goto(`/q/${fiestaIdSinClave}`, { waitUntil: 'domcontentloaded' });
    const linkClienteSinClave = page.locator('a', { hasText: /^Cliente/ }).first();
    await expect(linkClienteSinClave).toHaveAttribute('href', `/portal?fiestaId=${fiestaIdSinClave}`);
    await expect(page.locator('a[href*="/fiestas/nueva/portal-cliente"]')).toHaveCount(0);
  });
});
