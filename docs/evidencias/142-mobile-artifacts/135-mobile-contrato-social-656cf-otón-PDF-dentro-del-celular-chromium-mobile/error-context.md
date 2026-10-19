# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 135-mobile-contrato-social.spec.ts >> 171 contrato: conserva título, firma y texto del botón PDF dentro del celular
- Location: tests\e2e\135-mobile-contrato-social.spec.ts:59:5

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: El título no debe fragmentarse en tres líneas en celular

expect(received).toBeLessThanOrEqual(expected)

Expected: <= 2
Received:    3
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - banner [ref=e5]:
      - generic [ref=e6]:
        - img [ref=e8]
        - generic [ref=e11]:
          - heading "Contrato de Servicio" [level=1] [ref=e12]
          - paragraph [ref=e13]: Revisión y Firma Digital
      - link [ref=e14] [cursor=pointer]:
        - /url: /portal?fiestaId=e2e_qa135_contrato_responsive_30cf4a3d-0fa1-4c32-8c42-87c24eed747e
        - img
    - generic [ref=e15]:
      - img [ref=e17]
      - generic [ref=e20]:
        - paragraph [ref=e21]: Constancia de Firma
        - paragraph [ref=e22]: Firmaste el contrato el 16/10/2026. Para confirmar tu reserva falta firmar el contrato en papel con AK.
    - generic [ref=e23]:
      - generic [ref=e24]:
        - generic [ref=e25]: Términos y Condiciones
        - generic [ref=e26]: Por favor, lee atentamente el contrato antes de proceder con la firma.
      - generic [ref=e27]:
        - generic [ref=e28]: CONTRATO FICTICIO QA135 RESPONSIVE. Sin validez ni cobros.
        - generic [ref=e29]:
          - generic [ref=e30]:
            - paragraph [ref=e31]: Tec. Alexander Knuth
            - paragraph [ref=e32]: Por la Empresa
          - generic [ref=e33]:
            - generic [ref=e34]:
              - paragraph [ref=e35]: Titular Ficticio QA135
              - paragraph [ref=e36]: Firmado Digitalmente
            - paragraph [ref=e37]: EL CLIENTE
            - paragraph [ref=e38]: Firma del Titular
      - generic [ref=e40]:
        - img [ref=e41]
        - generic [ref=e43]:
          - heading "Falta el contrato en papel" [level=3] [ref=e44]
          - paragraph [ref=e45]: Imprimí el contrato, firmalo y entregáselo al organizador.
        - button "IMPRIMIR / DESCARGAR CONTRATO (PDF)" [ref=e46] [cursor=pointer]
  - region "Notifications (F8)":
    - list
  - alert [ref=e47]
```

# Test source

```ts
  4   |   borrarFiesta,
  5   |   crearFiestaDeEstaNoche,
  6   |   guardarFiesta,
  7   |   ponerSesionDelEquipo,
  8   | } from './helpers/fiesta-de-prueba';
  9   | 
  10  | test.use({ serviceWorkers: 'block' });
  11  | 
  12  | test.skip(
  13  |   process.env.AK_ENTORNO_AISLADO !== 'true'
  14  |     || process.env.AK_USE_LOCAL_JSON_ONLY !== 'true'
  15  |     || process.env.PLAYWRIGHT_BASE_URL !== 'http://127.0.0.1:3300',
  16  |   'Requires the disposable synthetic QA runner on localhost.',
  17  | );
  18  | 
  19  | test.beforeEach(async ({ context }, testInfo) => {
  20  |   await context.addInitScript(() => {
  21  |     Reflect.deleteProperty(Navigator.prototype, 'serviceWorker');
  22  |   });
  23  |   await context.route('**/*', async (route) => {
  24  |     const url = new URL(route.request().url());
  25  |     if (/^https?:$/.test(url.protocol) && !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
  26  |       await testInfo.attach('blocked-external-url', {
  27  |         contentType: 'text/plain',
  28  |         body: `${url.origin}${url.pathname}`,
  29  |       });
  30  |       await route.abort('blockedbyclient');
  31  |       return;
  32  |     }
  33  |     await route.continue();
  34  |   });
  35  | });
  36  | 
  37  | const ids: string[] = [];
  38  | const clavePortal = 'clave-ficticia-qa135-responsive';
  39  | 
  40  | function sembrarFiesta() {
  41  |   if (process.env.AK_ENTORNO_AISLADO !== 'true') throw new Error('Synthetic isolated QA only');
  42  |   const id = `e2e_qa135_contrato_responsive_${crypto.randomUUID()}`;
  43  |   ids.push(id);
  44  |   const fiesta: any = crearFiestaDeEstaNoche({ id, clavePortal });
  45  |   fiesta.estado = 'Presupuestada';
  46  |   fiesta.configuracion.fechaEvento = '2027-08-08';
  47  |   fiesta.contratoServicioTexto = 'CONTRATO FICTICIO QA135 RESPONSIVE. Sin validez ni cobros.';
  48  |   fiesta.contratoDatos = { ...fiesta.contratoDatos, planPagos: { activo: false } };
  49  |   delete fiesta.contratoFirmaInfo;
  50  |   delete fiesta.firmaDigitalConstancia;
  51  |   guardarFiesta(fiesta);
  52  |   return id;
  53  | }
  54  | 
  55  | test.afterEach(() => {
  56  |   while (ids.length) borrarFiesta(ids.pop()!);
  57  | });
  58  | 
  59  | test('171 contrato: conserva título, firma y texto del botón PDF dentro del celular', async ({ page }, testInfo) => {
  60  |   test.skip(!testInfo.project.name.endsWith('mobile'), 'Auditoría de disposición móvil');
  61  |   const id = sembrarFiesta();
  62  |   await page.setViewportSize({ width: 390, height: 844 });
  63  |   await page.goto(`/portal-cliente/${id}`, { waitUntil: 'domcontentloaded' });
  64  |   await page.locator('input[type="password"]').fill(clavePortal);
  65  |   await page.getByRole('button', { name: /Ingresar/i }).click();
  66  |   await expect(page.locator('input[type="password"]')).toHaveCount(0);
  67  |   await page.goto(`/portal/${id}/contrato`, { waitUntil: 'domcontentloaded' });
  68  |   await page.locator('#input-nombre-firmante').fill('Titular Ficticio QA135');
  69  |   await page.locator('#acceptedTerms').check();
  70  |   await page.getByRole('button', { name: 'Dejar Constancia de Firma Digital', exact: true }).click();
  71  |   await expect(page.getByText('Constancia de Firma', { exact: true })).toBeVisible();
  72  | 
  73  |   const metrics = await page.evaluate(() => {
  74  |     const rect = (selector: string) => {
  75  |       const element = document.querySelector(selector);
  76  |       if (!element) return null;
  77  |       const box = element.getBoundingClientRect();
  78  |       return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height };
  79  |     };
  80  |     const titleElement = document.querySelector('h1');
  81  |     const titleBox = titleElement?.getBoundingClientRect();
  82  |     const lineHeight = titleElement ? Number.parseFloat(getComputedStyle(titleElement).lineHeight) : 0;
  83  |     const button = [...document.querySelectorAll('button')].find((item) => item.textContent?.includes('IMPRIMIR / DESCARGAR CONTRATO'));
  84  |     const buttonBox = button?.getBoundingClientRect();
  85  |     const range = document.createRange();
  86  |     if (button) range.selectNodeContents(button);
  87  |     const contentBox = button ? range.getBoundingClientRect() : null;
  88  |     return {
  89  |       viewportWidth: document.documentElement.clientWidth,
  90  |       documentWidth: document.documentElement.scrollWidth,
  91  |       titleText: titleElement?.textContent?.trim(),
  92  |       titleLines: titleBox && lineHeight ? Math.round(titleBox.height / lineHeight) : null,
  93  |       signatureName: rect('p.font-dancing'),
  94  |       titularLabel: [...document.querySelectorAll('p')]
  95  |         .find((p) => p.textContent?.trim() === 'Firma del Titular')?.getBoundingClientRect().toJSON() ?? null,
  96  |       button: buttonBox?.toJSON() ?? null,
  97  |       buttonText: contentBox?.toJSON() ?? null,
  98  |     };
  99  |   });
  100 |   console.log(`QA135_CONTRATO_MOBILE_LAYOUT ${JSON.stringify(metrics)}`);
  101 |   await page.screenshot({ path: testInfo.outputPath('qa135-contrato-mobile-layout.png'), fullPage: true });
  102 | 
  103 |   expect(metrics.documentWidth, 'No debe exigir desplazamiento horizontal').toBeLessThanOrEqual(metrics.viewportWidth + 2);
> 104 |   expect(metrics.titleLines, 'El título no debe fragmentarse en tres líneas en celular').toBeLessThanOrEqual(2);
      |                                                                                          ^ Error: El título no debe fragmentarse en tres líneas en celular
  105 |   const name = metrics.signatureName;
  106 |   const label = metrics.titularLabel;
  107 |   expect(name, 'La firma debe existir para medirla').not.toBeNull();
  108 |   expect(label, 'La etiqueta debe existir para medirla').not.toBeNull();
  109 |   expect(metrics.button, 'El boton PDF debe existir para medirlo').not.toBeNull();
  110 |   expect(metrics.buttonText, 'El texto PDF debe existir para medirlo').not.toBeNull();
  111 |   const overlaps = Boolean(name && label && name.right > label.left && name.left < label.right && name.bottom > label.top && name.top < label.bottom);
  112 |   expect(overlaps, 'El nombre/sello digital no debe tapar "Firma del Titular"').toBe(false);
  113 |   expect(metrics.buttonText?.left, 'El texto del botón PDF debe quedar dentro del botón').toBeGreaterThanOrEqual((metrics.button?.left ?? 0) - 1);
  114 |   expect(metrics.buttonText?.right, 'El texto del botón PDF debe quedar dentro del botón').toBeLessThanOrEqual((metrics.button?.right ?? 0) + 1);
  115 | });
  116 | 
  117 | test('172 red social: el dock no tapa el encabezado Evento al abrir en celular', async ({ page }, testInfo) => {
  118 |   test.skip(!testInfo.project.name.endsWith('mobile'), 'Auditoría de disposición móvil');
  119 |   const baseURL = testInfo.project.use.baseURL as string | undefined;
  120 |   await ponerSesionDelEquipo(page.context(), baseURL);
  121 |   await page.setViewportSize({ width: 390, height: 844 });
  122 |   await page.goto('/empresa/red-social-eventos', { waitUntil: 'domcontentloaded' });
  123 |   await expect(page.getByRole('columnheader', { name: 'Evento', exact: true })).toBeVisible();
  124 | 
  125 |   const metrics = await page.evaluate(() => {
  126 |     const header = [...document.querySelectorAll('th')].find((item) => item.textContent?.trim() === 'Evento');
  127 |     const dock = document.querySelector('[class*="fixed"][class*="bottom-"][class*="left-"]');
  128 |     const rect = (element: Element | null) => {
  129 |       if (!element) return null;
  130 |       const box = element.getBoundingClientRect();
  131 |       return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height };
  132 |     };
  133 |     return {
  134 |       viewportWidth: document.documentElement.clientWidth,
  135 |       documentWidth: document.documentElement.scrollWidth,
  136 |       header: rect(header),
  137 |       dock: rect(dock),
  138 |     };
  139 |   });
  140 |   console.log(`QA135_SOCIAL_DOCK_LAYOUT ${JSON.stringify(metrics)}`);
  141 |   await page.screenshot({ path: testInfo.outputPath('qa135-social-dock-mobile.png'), fullPage: true });
  142 | 
  143 |   expect(metrics.header, 'Debe estar presente el encabezado Evento de Feeds de Eventos').not.toBeNull();
  144 |   expect(metrics.dock, 'Debe estar presente el dock fijo de navegación del módulo').not.toBeNull();
  145 |   expect(metrics.documentWidth, 'La comparación no debe introducir desplazamiento horizontal').toBeLessThanOrEqual(metrics.viewportWidth + 2);
  146 |   const header = metrics.header!;
  147 |   const dock = metrics.dock!;
  148 |   const overlapWidth = Math.max(0, Math.min(header.right, dock.right) - Math.max(header.left, dock.left));
  149 |   const overlapHeight = Math.max(0, Math.min(header.bottom, dock.bottom) - Math.max(header.top, dock.top));
  150 |   expect(overlapWidth * overlapHeight, 'El dock no debe cubrir el encabezado Evento').toBe(0);
  151 | });
  152 | 
```