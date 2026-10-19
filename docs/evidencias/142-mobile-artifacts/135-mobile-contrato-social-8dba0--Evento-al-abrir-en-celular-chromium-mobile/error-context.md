# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 135-mobile-contrato-social.spec.ts >> 172 red social: el dock no tapa el encabezado Evento al abrir en celular
- Location: tests\e2e\135-mobile-contrato-social.spec.ts:117:5

# Error details

```
Error: El dock no debe cubrir el encabezado Evento

expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 2247.174666168634
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - main [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - generic [ref=e6]:
            - button "Abrir menu lateral" [ref=e7] [cursor=pointer]:
              - img
              - generic [ref=e8]: Toggle Sidebar
            - heading "AK Producciones" [level=1] [ref=e9]
          - generic [ref=e10]:
            - link:
              - /url: /pagos-rapidos
            - link [ref=e11] [cursor=pointer]:
              - /url: /pagos-rapidos
              - button [ref=e12]:
                - img
            - button "Abrir notificaciones" [ref=e13] [cursor=pointer]:
              - img
              - generic [ref=e14]: Abrir notificaciones
            - button "Logo de la Empresa" [ref=e15] [cursor=pointer]:
              - img "Logo de la Empresa" [ref=e17]
        - main [ref=e18]:
          - generic [ref=e19]:
            - generic [ref=e20]:
              - generic [ref=e21]:
                - heading "Muro Social General" [level=1] [ref=e22]
                - paragraph [ref=e23]: Gestión de feeds de eventos y parametrización de publicidad de AK Producciones.
              - generic [ref=e24]:
                - button "Actualizar Lista" [ref=e25] [cursor=pointer]
                - button "Guardar Configuración Global" [ref=e26] [cursor=pointer]:
                  - img
                  - text: Guardar Configuración Global
            - generic [ref=e27]:
              - generic [ref=e29]:
                - paragraph [ref=e30]: "0"
                - paragraph [ref=e31]: Feeds Totales
              - generic [ref=e33]:
                - paragraph [ref=e34]: "0"
                - paragraph [ref=e35]: Feeds Activos Hoy
              - generic [ref=e37]:
                - paragraph [ref=e38]: "0"
                - paragraph [ref=e39]: Habilitados Manual
              - generic [ref=e41]:
                - paragraph [ref=e42]: "0"
                - paragraph [ref=e43]: Deshabilitados Manual
            - generic [ref=e44]:
              - generic [ref=e45]:
                - generic [ref=e46]:
                  - generic [ref=e47]: Feeds de Eventos
                  - generic [ref=e48]: Ciclo de vida automático (activación 30 días antes y desactivación 30 días después).
                - table [ref=e50]:
                  - rowgroup [ref=e51]:
                    - row "Evento Fecha Ciclo de Vida Anulación Manual Acceso" [ref=e52]:
                      - columnheader "Evento" [ref=e53]
                      - columnheader "Fecha" [ref=e54]
                      - columnheader "Ciclo de Vida" [ref=e55]
                      - columnheader "Anulación Manual" [ref=e56]
                      - columnheader "Acceso" [ref=e57]
                  - rowgroup [ref=e58]:
                    - row "No hay eventos registrados." [ref=e59]:
                      - cell "No hay eventos registrados." [ref=e60]
              - generic [ref=e62]:
                - generic [ref=e63]:
                  - generic [ref=e64]:
                    - img [ref=e65]
                    - text: Monetización e Inserción
                  - generic [ref=e68]: Configuración global de banners y frecuencia de inyección de anuncios.
                - generic [ref=e70]:
                  - text: Frecuencia de Publicidad
                  - generic [ref=e71]:
                    - spinbutton "Frecuencia de Publicidad" [ref=e72]: "4"
                    - generic [ref=e73]: posts de invitados
                  - paragraph [ref=e74]: "Configura cuántas publicaciones de los invitados deben mostrarse antes de inyectar una tarjeta publicitaria de la empresa. (Recomendado: 4)."
                - generic [ref=e75]:
                  - heading "Anuncios de Catálogo (4)" [level=3] [ref=e76]
                  - button "Nuevo Banner" [ref=e77] [cursor=pointer]:
                    - img
                    - text: Nuevo Banner
                - generic [ref=e78]:
                  - generic [ref=e79]:
                    - generic [ref=e80]:
                      - generic [ref=e81]: "Anuncio #1"
                      - generic [ref=e82]:
                        - switch [checked] [ref=e83] [cursor=pointer]
                        - button [ref=e84] [cursor=pointer]:
                          - img
                    - generic [ref=e85]:
                      - textbox "Título Comercial" [ref=e86]: Plataforma 360° Premium
                      - textbox "Descripción corta del servicio" [ref=e87]: ¡Hacé que tus invitados se lleven un video espectacular en cámara lenta! Reservá la plataforma 360 de AK Producciones para tu fiesta.
                      - textbox "URL de la imagen representativa" [ref=e88]: https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80
                      - generic [ref=e89]:
                        - textbox "Texto del Botón" [ref=e90]: Cotizar en mi Simulador
                        - textbox "URL de Destino" [ref=e91]: /simulador-ak
                  - generic [ref=e92]:
                    - generic [ref=e93]:
                      - generic [ref=e94]: "Anuncio #2"
                      - generic [ref=e95]:
                        - switch [checked] [ref=e96] [cursor=pointer]
                        - button [ref=e97] [cursor=pointer]:
                          - img
                    - generic [ref=e98]:
                      - textbox "Título Comercial" [ref=e99]: Robot LED Show
                      - textbox "Descripción corta del servicio" [ref=e100]: Megatron y show de luces LED robotizado para hacer explotar la tanda de baile de tu evento.
                      - textbox "URL de la imagen representativa" [ref=e101]: https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80
                      - generic [ref=e102]:
                        - textbox "Texto del Botón" [ref=e103]: Ver Servicios en Simulador
                        - textbox "URL de Destino" [ref=e104]: /simulador-ak
                  - generic [ref=e105]:
                    - generic [ref=e106]:
                      - generic [ref=e107]: "Anuncio #3"
                      - generic [ref=e108]:
                        - switch [checked] [ref=e109] [cursor=pointer]
                        - button [ref=e110] [cursor=pointer]:
                          - img
                    - generic [ref=e111]:
                      - textbox "Título Comercial" [ref=e112]: Espejo Mágico de Fotos
                      - textbox "Descripción corta del servicio" [ref=e113]: Un espejo táctil interactivo que saca fotos de cuerpo entero y las imprime al instante como souvenir premium para tus invitados.
                      - textbox "URL de la imagen representativa" [ref=e114]: https://images.unsplash.com/photo-1541140111813-8222e9d90981?auto=format&fit=crop&w=600&q=80
                      - generic [ref=e115]:
                        - textbox "Texto del Botón" [ref=e116]: Cotizar Souvenirs
                        - textbox "URL de Destino" [ref=e117]: /simulador-ak
                  - generic [ref=e118]:
                    - generic [ref=e119]:
                      - generic [ref=e120]: "Anuncio #4"
                      - generic [ref=e121]:
                        - switch [checked] [ref=e122] [cursor=pointer]
                        - button [ref=e123] [cursor=pointer]:
                          - img
                    - generic [ref=e124]:
                      - textbox "Título Comercial" [ref=e125]: Pistas LED de Baile
                      - textbox "Descripción corta del servicio" [ref=e126]: Pistas de baile iluminadas que cambian de color al ritmo de la música. Elevá la estética visual de tu evento al máximo.
                      - textbox "URL de la imagen representativa" [ref=e127]: https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80
                      - generic [ref=e128]:
                        - textbox "Texto del Botón" [ref=e129]: Diseñar mi Pista
                        - textbox "URL de Destino" [ref=e130]: /simulador-ak
    - navigation "Navegacion del modulo" [ref=e131]:
      - button "Volver" [ref=e132] [cursor=pointer]:
        - img
      - button "Ir al panel principal" [ref=e133] [cursor=pointer]:
        - img
    - button "Abrir Asistente IA AK" [ref=e134] [cursor=pointer]:
      - img [ref=e135]
  - region "Notifications (F8)":
    - list
  - alert [ref=e138]
```

# Test source

```ts
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
  104 |   expect(metrics.titleLines, 'El título no debe fragmentarse en tres líneas en celular').toBeLessThanOrEqual(2);
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
> 150 |   expect(overlapWidth * overlapHeight, 'El dock no debe cubrir el encabezado Evento').toBe(0);
      |                                                                                       ^ Error: El dock no debe cubrir el encabezado Evento
  151 | });
  152 | 
```