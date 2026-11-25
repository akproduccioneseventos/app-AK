import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const SECRETO = 'playwright-session-secret-with-enough-entropy';
const MUTABLE_FILES = [
  'data/presupuestos.json',
  'src/data/presupuestos.json',
  'data/crm-leads.json',
  'src/data/crm-leads.json',
  'data/notifications.json',
  'src/data/notifications.json',
];

const snapshots = new Map<string, Buffer | null>();

const tokenDelPdf = (id: string) =>
  crypto.createHmac('sha256', SECRETO).update(`budget-token:${id}`).digest('hex');

test.beforeAll(() => {
  for (const relativePath of MUTABLE_FILES) {
    const absolutePath = path.join(process.cwd(), relativePath);
    snapshots.set(
      absolutePath,
      fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath) : null,
    );
  }
});

test.afterAll(() => {
  for (const [absolutePath, snapshot] of snapshots) {
    if (snapshot === null) fs.rmSync(absolutePath, { force: true });
    else fs.writeFileSync(absolutePath, snapshot);
  }
});

test.describe('Orden 345 — El cliente ve "15% acumulativo" sin montos futuros', () => {
  test('en simulador y vista pública con evento en 2030 muestra "15% acumulativo" y no muestra "2030" junto a un monto', async ({ page, context }) => {
    test.setTimeout(240_000);

    // 1. Simulador con evento en 2030
    await page.goto('/simulador-de-presupuesto?mes=2030-11&tipo=Cumplea%C3%B1os&name=Prospecto+2030&guests=60', {
      waitUntil: 'domcontentloaded',
    });

    const btnStart = page.getByTestId('simulator-cover-start');
    if (await btnStart.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await btnStart.click();
    }

    await expect(page.getByText(/Paso 1 de 4/i)).toBeVisible({ timeout: 20_000 });
    await page.locator('#simulator-name').fill('Prospecto 2030');
    await page.locator('#simulator-phone').fill('099123456');
    await page.getByRole('button', { name: /Quiero Club Uruguay/i }).first().click();
    await expect(page.getByRole('button', { name: /de 2030/i }).first()).toBeVisible({ timeout: 15_000 });
    await page.waitForFunction(() => !document.body.innerText.includes('Verificando disponibilidad')).catch(() => undefined);
    await page.getByRole('button', { name: /Continuar/i }).click();

    await expect(page.getByText(/Paso 2 de 4/i)).toBeVisible();
    await page.getByRole('button', { name: /Continuar/i }).click();

    await expect(page.getByText(/Paso 3 de 4/i)).toBeVisible();
    await page.getByRole('button', { name: /Continuar/i }).click();

    await expect(page.getByText(/Paso 4 de 4/i)).toBeVisible();
    const keepSelection = page.getByRole('button', { name: /Mantener mi selecci[oó]n actual/i });
    await keepSelection.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => undefined);
    if (await keepSelection.isVisible().catch(() => false)) {
      await keepSelection.click();
    }

    const simulatorBody = await page.locator('body').innerText();
    expect(simulatorBody).toContain('15% acumulativo');
    expect(simulatorBody).not.toMatch(/con ajuste 2030/i);
    expect(simulatorBody).not.toMatch(/2030[^\n]{0,40}\$/);
    expect(simulatorBody).not.toMatch(/\$[^\n]{0,40}2030/);

    // 2. Vista pública /presupuestos/[id]/ver?cliente=1... con evento en 2030
    const id = 'e2e_345_2030_acumulativo';
    const dataPath = path.join(process.cwd(), 'data/presupuestos.json');
    const existing = fs.existsSync(dataPath)
      ? JSON.parse(fs.readFileSync(dataPath, 'utf8'))
      : [];
    const filtered = Array.isArray(existing) ? existing.filter((p: any) => p.id !== id) : [];
    filtered.push({
      id,
      numero: 9345,
      clienteNombre: 'Cliente 2030',
      clienteContacto: '099123456',
      eventoTipo: 'Boda',
      eventoFecha: '2030-11-20T18:00:00.000Z',
      invitadosCantidad: 80,
      invitadosAdultos: 80,
      invitadosNinos: 0,
      invitadosAdolescentes: 0,
      salonFiestas: 'Salón Propio',
      itemsPresupuestados: [
        {
          idServicioCatalogo: 'serv_dj_base',
          nombreServicio: 'DJ y Luces',
          cantidad: 1,
          precioUnitario: 50000,
          precioUnitarioPresupuesto: 50000,
          costoTotalItem: 50000,
        },
      ],
      costoTotalEstimado: 50000,
      totalConDescuento: 50000,
      timestamp: '2026-11-24T12:00:00.000Z',
      estado: 'Aceptado',
      ajusteAnualActivo: true,
      ajusteAnualPorcentaje: 15,
      versionDeEnlace: 0,
    });
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.writeFileSync(dataPath, `${JSON.stringify(filtered, null, 2)}\n`, 'utf8');

    await context.clearCookies();
    await page.goto(`/presupuestos/${id}/ver?cliente=1&token=${tokenDelPdf(id)}`, {
      waitUntil: 'domcontentloaded',
    });

    const printAreaText = await page.locator('#budget-print-area').innerText();
    expect(printAreaText).toContain('15% acumulativo');
    expect(printAreaText).not.toMatch(/2030[^\n]{0,40}\$/);
    expect(printAreaText).not.toMatch(/\$[^\n]{0,40}2030/);
  });
});
