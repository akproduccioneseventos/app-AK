import { expect, test } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

test.describe('Orden 337 — Bloque 3: Ajustes abre cada sub-panel, datos legales y backup', () => {
  test('cada uno de los 5 sub-paneles por enlace directo muestra contenido real (sin pantalla en blanco)', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');
    test.setTimeout(180_000);

    const baseURL = testInfo.project.use.baseURL as string;
    await ponerSesionDelEquipo(context, baseURL);

    const casos: Array<{
      url: string;
      tabLabel: string;
      textoEsperado: string | RegExp;
    }> = [
      {
        url: '/settings?seccion=ventas&sub=budget-display',
        tabLabel: 'Señas y reserva',
        textoEsperado: /Configuración del Simulador|Monto de la seña/i,
      },
      {
        url: '/settings?seccion=contratos&sub=contratos',
        tabLabel: 'Plantilla de contrato',
        textoEsperado: /Plantillas de Contratos/i,
      },
      {
        url: '/settings?seccion=contratos&sub=contratos--clausulas',
        tabLabel: 'Cláusulas legales',
        textoEsperado: /Cláusulas del Contrato/i,
      },
      {
        url: '/settings?seccion=conexiones&sub=whatsapp-business',
        tabLabel: 'WhatsApp Business',
        textoEsperado: /WhatsApp Business Bot/i,
      },
      {
        url: '/settings?seccion=sistema&sub=feature-flags',
        tabLabel: 'Opciones avanzadas',
        textoEsperado: /Feature Flags|Tier por Defecto/i,
      },
    ];

    for (const caso of casos) {
      await page.goto(caso.url, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(new RegExp(caso.url.replace(/[?]/g, '\\?')));

      const pestana = page.getByRole('button', { name: caso.tabLabel, exact: true });
      await expect(pestana).toHaveText(caso.tabLabel, { timeout: 30_000 });

      const contenedor = page.locator('div.min-w-0.rounded-2xl.border');
      await expect(contenedor).toContainText(caso.textoEsperado, { timeout: 45_000 });
      await expect(contenedor).not.toContainText(/No se pudo mostrar esta sección de Ajustes/i);
    }
  });

  test('en /settings?seccion=empresa&sub=company, "Datos legales y cobro" abre datos legales y NO Administración de Datos', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');
    test.setTimeout(120_000);

    const baseURL = testInfo.project.use.baseURL as string;
    await ponerSesionDelEquipo(context, baseURL);

    await page.goto('/settings?seccion=empresa&sub=company', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Información de la Empresa' })).toContainText('Información de la Empresa', { timeout: 30_000 });

    const btnDatosLegales = page.getByRole('button', { name: 'Datos legales y cobro', exact: true });
    await btnDatosLegales.click();

    await expect(page).toHaveURL(/\/settings\?seccion=empresa&sub=datos-legales/);

    const contenedor = page.locator('div.min-w-0.rounded-2xl.border');
    await expect(contenedor).toContainText('Datos fiscales y facturación', { timeout: 30_000 });
    await expect(contenedor).toContainText('Cuentas Bancarias para Portal del Cliente');

    // No debe abrir Administración de Datos ni mostrar botones destructivos de CRM/fiestas
    await expect(page.getByRole('button', { name: /eliminar todo permanentemente/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /reiniciar crm/i })).toHaveCount(0);
    await expect(contenedor).not.toContainText('Administración de Datos');
  });

  test('/settings?seccion=sistema&sub=backup no queda colgado en "AVERIGUANDO ESTADO..." y muestra un estado final real', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');
    test.setTimeout(120_000);

    const baseURL = testInfo.project.use.baseURL as string;
    await ponerSesionDelEquipo(context, baseURL);

    await page.goto('/settings?seccion=sistema&sub=backup', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Backup y Protección' })).toContainText('Backup y Protección', { timeout: 30_000 });

    // El timeout interno de BackupPage es de 12s: esperamos que resuelva y salga de "cargando"
    await expect(page.getByTestId('card-backup-cargando')).toHaveCount(0, { timeout: 25_000 });

    const cardFinal = page.locator(
      '[data-testid="card-backup-desconocido"], [data-testid="card-backup-activo"], [data-testid="card-backup-stale"]',
    );
    await expect(cardFinal).toHaveCount(1);
    await expect(cardFinal).toContainText('Estado de Respaldo');
    await expect(page.getByText('Historial de Respaldos')).toContainText('Historial de Respaldos');
  });
});
