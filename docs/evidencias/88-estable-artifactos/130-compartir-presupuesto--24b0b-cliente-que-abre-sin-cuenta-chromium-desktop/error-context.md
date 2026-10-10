# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 130-compartir-presupuesto-publico.spec.ts >> copiar en la barra da el enlace del cliente, que abre sin cuenta
- Location: tests\e2e\130-compartir-presupuesto-publico.spec.ts:51:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Enlace copiado').first()
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for getByText('Enlace copiado').first()

```

```yaml
- main:
  - navigation "Navegacion del modulo":
    - button "Volver":
      - img
    - button "Ir al panel principal":
      - img
  - paragraph: 🗂️
  - heading "Presupuesto no encontrado" [level=2]
  - paragraph: Este presupuesto fue eliminado o archivado. Si lo archivaste, podés encontrarlo en el listado con el filtro de archivados.
  - link "Volver a Presupuestos":
    - /url: /presupuestos/nuevo
    - img
    - text: Volver a Presupuestos
- button "WhatsApp":
  - img
  - text: WhatsApp
- button "PDF":
  - img
  - text: PDF
- button "Compartir":
  - img
  - text: Compartir
- link "Editar":
  - /url: /presupuestos/e2e-compartir-presupuesto/edit
  - img
  - text: Editar
- button "Copiar enlace del presupuesto":
  - img
- button "Mover el asistente":
  - img
- button "Martin Contabilidad, pagos y contratos":
  - img
  - text: Martin Contabilidad, pagos y contratos
- link "Personalizar asistentes":
  - /url: /settings/asistentes-contextuales
  - img
- link "Ver sincronizaciones":
  - /url: /settings/sincronizaciones
  - img
- button "Minimizar el asistente":
  - img
- region "Notifications (F8)":
  - list
- alert
```

# Test source

```ts
  1  | /**
  2  |  * Codex, auditoría 80 (SHARE80): la barra flotante del presupuesto copiaba la dirección INTERNA,
  3  |  * sin token. El cliente que la abría sin cuenta caía en el ingreso. Ahora copia el enlace del
  4  |  * cliente (`cliente=1&token=...`), el mismo que arma el botón de la pantalla.
  5  |  *
  6  |  * La prueba copia el enlace con la sesión del equipo y lo abre en OTRO navegador sin cookies:
  7  |  * tiene que ver el presupuesto, no el ingreso.
  8  |  */
  9  | import fs from 'node:fs';
  10 | import path from 'node:path';
  11 | import { expect, test } from '@playwright/test';
  12 | import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';
  13 |
  14 | const ID = 'e2e-compartir-presupuesto';
  15 | const ARCHIVO = path.join(process.cwd(), 'data', 'presupuestos.json');
  16 | let anterior: Buffer | null = null;
  17 |
  18 | test.beforeAll(() => {
  19 |   anterior = fs.existsSync(ARCHIVO) ? fs.readFileSync(ARCHIVO) : null;
  20 |   let lista: any[] = [];
  21 |   try { lista = JSON.parse(fs.readFileSync(ARCHIVO, 'utf8')); } catch { lista = []; }
  22 |   if (!Array.isArray(lista)) lista = [];
  23 |   lista = lista.filter((p) => p?.id !== ID);
  24 |   lista.push({
  25 |     id: ID,
  26 |     numero: 4322,
  27 |     clienteNombre: 'Prospecto E2E Compartir',
  28 |     clienteContacto: '099000000',
  29 |     eventoTipo: 'Cumpleaños',
  30 |     eventoFecha: '2027-02-20T00:00:00.000Z',
  31 |     invitadosCantidad: 80,
  32 |     salonFiestas: 'A definir',
  33 |     itemsPresupuestados: [{
  34 |       id: 'item-1', idServicioCatalogo: 'servicio-e2e', nombreServicio: 'Servicio para compartir con el cliente',
  35 |       cantidad: 1, precioUnitario: 50_000, precioUnitarioPresupuesto: 50_000, costoTotalItem: 50_000, calculationMethod: 'fijo',
  36 |     }],
  37 |     costoTotalEstimado: 50_000,
  38 |     totalConDescuento: 50_000,
  39 |     timestamp: '2026-10-09T12:00:00.000Z',
  40 |     estado: 'Pendiente Verificación',
  41 |   });
  42 |   fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true });
  43 |   fs.writeFileSync(ARCHIVO, JSON.stringify(lista, null, 2), 'utf8');
  44 | });
  45 |
  46 | test.afterAll(() => {
  47 |   if (anterior === null) fs.rmSync(ARCHIVO, { force: true });
  48 |   else fs.writeFileSync(ARCHIVO, anterior);
  49 | });
  50 |
  51 | test('copiar en la barra da el enlace del cliente, que abre sin cuenta', async ({ page, context, baseURL, browser }) => {
  52 |   test.skip((page.viewportSize()?.width ?? 0) < 640, 'El botón de copiar se muestra desde tablet; en celular se usa Compartir.');
  53 |   await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  54 |   await ponerSesionDelEquipo(context, baseURL);
  55 |   await page.goto(`/presupuestos/${ID}/ver`);
  56 |
  57 |   await page.getByRole('button', { name: 'Copiar enlace del presupuesto' }).click();
> 58 |   await expect(page.getByText('Enlace copiado').first()).toBeVisible({ timeout: 20_000 });
     |                                                          ^ Error: expect(locator).toBeVisible() failed
  59 |   const copiado = await page.evaluate(() => navigator.clipboard.readText());
  60 |   expect(copiado).toContain(`/presupuestos/${ID}/ver?`);
  61 |   expect(copiado).toContain('cliente=1');
  62 |   expect(copiado).toMatch(/token=[0-9a-f]{20,}/);
  63 |
  64 |   const otro = await browser.newContext();
  65 |   try {
  66 |     const cliente = await otro.newPage();
  67 |     await cliente.goto(copiado.replace(/^https?:\/\/[^/]+/, baseURL || ''));
  68 |     await expect(cliente.getByText('Servicio para compartir con el cliente').first()).toBeVisible({ timeout: 30_000 });
  69 |     expect(cliente.url()).not.toMatch(/\/login/);
  70 |   } finally {
  71 |     await otro.close();
  72 |   }
  73 | });
  74 |
```
