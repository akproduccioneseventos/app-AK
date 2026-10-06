# Orden 125: foto de Glitter bar, categoría y WhatsApp público

## Destino y responsable

6/10/2026. Fuente contrastada: main
`368988bb64e823d31c9d5c4b2fb9adc114b207ef`, fusión #1260.
Nueva consulta a GitHub: ninguna propuesta abierta; no hay HEAD de una tanda
pendiente que permita afirmar que estos arreglos ya existen. Si aparece una
rama antes de programar, contrastar allí los tres casos y no reimplementarlos.

**Gemini programa estos cambios de medios/contacto; Claude compila el conjunto.**
Codex revisa y registra. Esta orden escrita no inicia ninguna otra IA.
Reunir con los pendientes 122/123/124 en UNA propuesta de código; no una PR por
hallazgo ni una fusión separada sólo por estos documentos. El dueño fusiona.

## A. GAL74-MEDIA, P2: Glitter bar muestra un toro mecánico

**Área: web/redes. Commit: `368988bb64e823d31c9d5c4b2fb9adc114b207ef`.**

Recorrido público real: Inicio → galería → Ver más fotos y videos →
**Abrir foto: Glitter bar**. El modal muestra un toro mecánico dentro de un
inflable, pero título/alternativa/descripción lo venden como mesa de glitter.
Captura `docs/evidencias/74-foto-glitter-toro.png`; el SHA publicado sigue
sin identificarse. Se inspeccionó además el archivo LOCAL del mismo SHA:
`public/media/catalogo-servicios/glitter-bar-01.jpeg`, también es ese toro.
El hash del archivo local coincide con el blob de Git: no es sólo caché del visor.

Rutas y consumidor verificados:
- `src/data/galeria-publica.json:186`, registro `ak-serv-glitter-bar-01`.
- `AsyncGallerySection`, `src/app/page.tsx:388`, entrega `GallerySection`
  y aparece en la portada en la línea 746.
- `src/app/presentacion-led/slides/categoria-servicios-slide.tsx:27`,
  `getFallbackServicePhoto` devuelve el mismo JPEG para glitter/maquillaje;
  consumidor `fotoUrl` en esa pantalla, línea 536. Es alcance comprobado en
  fuente, NO un recorrido LED aceptado en navegador.

Corregir la asociación con el catálogo ORIGINAL aprobado, no sólo el nombre,
el texto alternativo o la categoría. La foto de toro no debe representar
glitter ni maquillaje. Conservarla como toro mecánico si corresponde al catálogo,
sin perder material real. Para glitter usar una foto real aprobada del servicio;
si falta ese original, declarar esa parte pendiente, no inventar una imagen y
darla por conciliada. Revisar ambas salidas: galería y fallback LED.

Aceptación: misma ficha y modal muestran el servicio correcto; LED sin foto
explícita tampoco usa un toro para glitter. Comprobar imagen visible y nombre,
no sólo existencia de JPEG/URL. Guardar referencia al original y captura.

## B. GAL74-CATEGORY, P2: la palabra «bar» lo manda a tragos

El mismo registro está configurado como `Entretenimiento`, pero el modal dice
`Barra de Tragos`. Causa separada de la foto equivocada: el clasificador real
prioriza `/\bbar\b/` del título y no reconoce Entretenimiento como categoría.
`classifyGalleryCategories`, `src/components/landing/gallery-media-utils.ts:75`;
reglas/aliases en ese archivo. Consumidor real
`src/components/landing/GallerySection.tsx:142`, enganchado en la portada anterior.

Sonda ejecutada sobre Git exacto:
`node docs/evidencias/74-media-y-contacto-probe.cjs`.
Reproduce la categoría de Glitter bar y mantiene un control Kebab → Catering.
Asserts verdes de esta sonda significan «defecto reproducido», NO app aprobada.

Resultado: glitter/maquillaje no son barra de bebidas; respetar su identificación
validada y ofrecer el filtro coherente si se usa Entretenimiento. Mantener
correctos los tragos verdaderos, Candy bar/Repostería, recepción decorada,
Kebab/Catering y foto social genérica/Eventos. No sustituirlo por una clasificación
que prometa acertar toda foto desconocida sin evidencia. No esconder fotocabina,
360 ni espejo detrás de Ver más; su prioridad comercial sigue vigente.

## C. CONTACT74, P2: el correo aparece como número de WhatsApp

**Área: web. Commit: `368988bb64e823d31c9d5c4b2fb9adc114b207ef`.**

En `/privacidad`, el párrafo Contacto dice «WhatsApp al
akproduccionessalto@gmail.com». Captura `74-privacidad-contacto.png`.
`PrivacidadPage`, `src/app/privacidad/page.tsx:23` toma `companyContact`
como teléfono cuando falta `telefono`, aunque ese campo heredado contiene un
correo. Consumidor: párrafo renderizado de la misma página, línea 51.
La sonda ejecuta la página async y el renderizador React reales con compañía
sintética `synthetic@example.invalid`, y reproduce correo bajo etiqueta WhatsApp.

Usar un teléfono explícito válido si la configuración lo ofrece, y la fuente
pública canónica `AK_WHATSAPP_NUMBER` / `buildAkWhatsAppUrl` de
`src/lib/public-contact.ts` para el fallback. No interpretar un correo como
teléfono ni inventar otro número. Mantener separado correo y WhatsApp.
No cambia contenido jurídico, consentimiento ni decisión de no tener cartel
modal de cookies. Tampoco convertir esta corrección en otra pantalla de ajustes.

Prueba existente `la-privacidad-dice-la-ley-y-la-verdad.test.ts` sólo da un
`telefono` explícito a la página; por eso no cubre el dato heredado sin teléfono.
Agregar casos de `companyContact` correo, teléfono explícito válido y ausencia
de datos; exigir un WhatsApp utilizable, no sólo cualquier texto en el párrafo.

## Entrega y retest

Evidencias/originales: informe `74-cierre-de-evidencia-y-medios.md` y
`74-resultados/manifest.json`. Las 608 suites / 3522 unitarias generales pasan
en este SHA, incluidos los 21 casos anteriores; eso NO cubre estos casos nuevos.
Inventario de 491 E2E es sólo `--list`, no 491 recorridos aprobados.

Nuevas pruebas propuestas abajo: **PENDIENTES; no existen ni se ejecutaron**.
Crear regresiones rojas sobre este SHA y verdes con el arreglo. La identidad
visual del JPEG requiere contraste con el original/captura, no una prueba que
se autocompruebe por el nombre del archivo. Retestar en PC y móvil sobre el
SHA de la entrega; Claude adjunta su puerta de compilación. No declarar «limpia»
la web entera por estos tres arreglos parciales.

```comprobar
archivo: src/data/galeria-publica.json
usa: AsyncGallerySection en src/app/page.tsx
archivo: src/components/landing/gallery-media-utils.ts
usa: classifyGalleryCategories en src/components/landing/GallerySection.tsx
archivo: src/app/presentacion-led/slides/categoria-servicios-slide.tsx
usa: getFallbackServicePhoto en src/app/presentacion-led/slides/categoria-servicios-slide.tsx
archivo: src/app/privacidad/page.tsx
usa: PrivacidadPage en src/app/privacidad/page.tsx
prueba: src/__tests__/auditoria-74-categorias-y-contacto.test.ts
prueba: tests/e2e/galeria-servicio-y-contacto-publico.spec.ts
```
