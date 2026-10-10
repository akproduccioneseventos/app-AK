# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 88-compartir-publico-firestore.spec.ts >> copiar en la barra da el enlace del cliente, que abre sin cuenta
- Location: tests\e2e\88-compartir-publico-firestore.spec.ts:61:5

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
  - img
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
  - /url: /presupuestos/e2e-compartir-presupuesto-88-2696/edit
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
  9  | // @ts-nocheck -- Adaptacion de la semilla JSON a SDK emulado, sin cambios de producto.
  10 | import fs from 'node:fs';
  11 | import path from 'node:path';
  12 | import os from 'node:os';
  13 | import admin from 'firebase-admin';
  14 | import { expect, test } from '@playwright/test';
  15 | import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';
  16 |
  17 | if(process.env.AK_ENTORNO_AISLADO!=='true'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085'
  18 |   ||path.dirname(process.cwd())!==path.join(os.tmpdir(),'ak-codex88')) throw new Error('Solo entorno demo reservado');
  19 | const app=admin.initializeApp({projectId:'demo-ak-producciones'},'share88-'+process.pid);
  20 | const db=app.firestore();
  21 | const ID = 'e2e-compartir-presupuesto-88-'+process.pid;
  22 | const ARCHIVO = path.join(process.cwd(), 'data', 'presupuestos.json');
  23 | let anterior: Buffer | null = null;
  24 |
  25 | test.beforeAll(async () => {
  26 |   anterior = fs.existsSync(ARCHIVO) ? fs.readFileSync(ARCHIVO) : null;
  27 |   let lista: any[] = [];
  28 |   try { lista = JSON.parse(fs.readFileSync(ARCHIVO, 'utf8')); } catch { lista = []; }
  29 |   if (!Array.isArray(lista)) lista = [];
  30 |   lista = lista.filter((p) => p?.id !== ID);
  31 |   lista.push({
  32 |     id: ID,
  33 |     numero: 4322,
  34 |     clienteNombre: 'Prospecto E2E Compartir',
  35 |     clienteContacto: '099000000',
  36 |     eventoTipo: 'Cumpleaños',
  37 |     eventoFecha: '2027-02-20T00:00:00.000Z',
  38 |     invitadosCantidad: 80,
  39 |     salonFiestas: 'A definir',
  40 |     itemsPresupuestados: [{
  41 |       id: 'item-1', idServicioCatalogo: 'servicio-e2e', nombreServicio: 'Servicio para compartir con el cliente',
  42 |       cantidad: 1, precioUnitario: 50_000, precioUnitarioPresupuesto: 50_000, costoTotalItem: 50_000, calculationMethod: 'fijo',
  43 |     }],
  44 |     costoTotalEstimado: 50_000,
  45 |     totalConDescuento: 50_000,
  46 |     timestamp: '2026-10-09T12:00:00.000Z',
  47 |     estado: 'Pendiente Verificación',
  48 |   });
  49 |   fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true });
  50 |   fs.writeFileSync(ARCHIVO, JSON.stringify(lista, null, 2), 'utf8');
  51 |   await db.collection('presupuestos').doc(ID).set(lista.find(p=>p.id===ID));
  52 | });
  53 |
  54 | test.afterAll(async () => {
  55 |   await db.collection('presupuestos').doc(ID).delete();
  56 |   await app.delete();
  57 |   if (anterior === null) fs.rmSync(ARCHIVO, { force: true });
  58 |   else fs.writeFileSync(ARCHIVO, anterior);
  59 | });
  60 |
  61 | test('copiar en la barra da el enlace del cliente, que abre sin cuenta', async ({ page, context, baseURL, browser }) => {
  62 |   test.skip((page.viewportSize()?.width ?? 0) < 640, 'El botón de copiar se muestra desde tablet; en celular se usa Compartir.');
  63 |   await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  64 |   await ponerSesionDelEquipo(context, baseURL);
  65 |   await page.goto(`/presupuestos/${ID}/ver`);
  66 |
  67 |   await page.getByRole('button', { name: 'Copiar enlace del presupuesto' }).click();
> 68 |   await expect(page.getByText('Enlace copiado').first()).toBeVisible({ timeout: 20_000 });
     |                                                          ^ Error: expect(locator).toBeVisible() failed
  69 |   const copiado = await page.evaluate(() => navigator.clipboard.readText());
  70 |   expect(copiado).toContain(`/presupuestos/${ID}/ver?`);
  71 |   expect(copiado).toContain('cliente=1');
  72 |   expect(copiado).toMatch(/token=[0-9a-f]{20,}/);
  73 |
  74 |   const otro = await browser.newContext();
  75 |   try {
  76 |     const cliente = await otro.newPage();
  77 |     await cliente.goto(copiado.replace(/^https?:\/\/[^/]+/, baseURL || ''));
  78 |     await expect(cliente.getByText('Servicio para compartir con el cliente').first()).toBeVisible({ timeout: 30_000 });
  79 |     expect(cliente.url()).not.toMatch(/\/login/);
  80 |   } finally {
  81 |     await otro.close();
  82 |   }
  83 | });
  84 |
```
