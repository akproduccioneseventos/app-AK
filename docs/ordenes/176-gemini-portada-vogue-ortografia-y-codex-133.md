# PARA GEMINI - Orden 176: una sola entrega para las órdenes 171, 172, 173 y 175, más textos rotos, Vogue y ortografía de toda la app

**Una sola propuesta con todos los bloques.** Si un bloque se traba, entregá el resto en la misma
propuesta y avisá cuál faltó. Antes de decir "terminé", pasá `docs/ANTES-DE-ENTREGAR.md` sobre lo que
tocaste. Arrancá de la versión principal de hoy (`git fetch origin main`).

Las órdenes 171, 172, 173 y 175 son de Codex y describen el problema. **El camino exacto está acá**:
seguí éste.

## Qué NO tocar (decisiones del dueño, no se discuten)

- Las cifras de trayectoria: **"+200" eventos, "+7" años y "Clientes satisfechos" sin porcentaje**
  (`DEFAULT_STATS` en `src/components/landing/StatsSection.tsx` línea ~8). No van "+250", "+10" ni "100%".
- **Los identificadores `bogue`** (la ruta `/evento/bogue/`, las claves `bogue:` de los mapas, los
  `id: 'bogue'`): **no se cambian**. Hay QR impresos y fiestas guardadas que apuntan a ellos. Lo que
  cambia es sólo el nombre que se lee (bloque 6).
- Los textos de los botones, el orden de las secciones de la portada, las promociones y el reloj del
  simulador. **No se reorganiza la portada ni se unifican botones**: eso lo decide el dueño.
- Las palabras de los clientes en `src/data/testimonials.json` (`testimonialText` y `clientName`):
  son reseñas reales importadas tal como las escribieron. No se corrigen.

## Bloque 1 - Contrato del portal en celular (orden 171)

`src/app/portal/[fiestaId]/contrato/page.tsx`:

- Título (línea ~161, `text-2xl ... uppercase`, "Contrato de Servicio"): `text-xl sm:text-2xl` y
  `leading-tight`, para que en 390 px ocupe como máximo dos líneas.
- Sello de firma digital (línea ~266, `absolute -top-12 left-1/2 -translate-x-1/2`): hoy tapa
  "Firma del Titular" (línea ~273). Sacalo de posición absoluta: que quede **en el flujo, arriba de
  "EL CLIENTE"**, centrado, con `mb-2`. Conservá el texto "Firmado Digitalmente" y el nombre.
- Los dos botones "IMPRIMIR / DESCARGAR CONTRATO (PDF)" (líneas ~434 y ~451): `h-auto min-h-14 py-3
  whitespace-normal text-center leading-tight text-sm sm:text-base`, así el texto entra en el botón
  en dos líneas. **No cambies el texto ni lo que hace** (`window.print()`).
- No toques la lógica de firma, el estado legal ni nada de pagos.

## Bloque 2 - La barra flotante no tapa la tabla en celular (orden 172)

`ModuleNavigationDock` (`src/components/module-navigation-dock.tsx` línea ~39, `fixed ... bottom-4`
en las pantallas internas) tapa lo último de la pantalla. Es la pregunta 56. Arreglalo **para todas
las pantallas internas a la vez, no sólo para la red social**: en `src/components/app-shell.tsx`, al
contenedor que envuelve `{children}` en el armazón normal (el que no es `isSpecialRender`), agregale
`pb-24 md:pb-0` (o el equivalente que ya use el `<main>` ahí), para que en el celular siempre quede
lugar abajo para la barra. No cambies la posición de la barra ni sus botones Volver y Panel.

## Bloque 3 - Prueba del simulador desactualizada (orden 173)

`tests/e2e/simulador-contacto-oficial.spec.ts`: actualizala para el recorrido de hoy, tal como lo
describe la orden 173 (llegar al Paso 5 de 5, resolver la oferta opcional conservando la selección,
tocar "Ver Resumen y Propuesta" y comprobar el número oficial en la dirección interceptada, sin abrir
WhatsApp). Tomá como modelo `docs/evidencias/133-simulador-whatsapp-despues-de-oferta.spec.ts`, que ya
hace ese camino. **No toques el simulador**: es la prueba la que está vieja.

## Bloque 4 - Artículo del blog sobre bebidas (orden 175)

Los artículos se leen de la base, no del archivo, así que **el arreglo va en el corrector que se
aplica al leerlos**: `corregirPromesasDelBlog` en `src/lib/blog/sin-promesas.ts` (línea ~66), que ya
tiene reemplazos por `slug`. Agregá uno para `post.slug === 'como-calcular-bebida-evento-salto'`
(mismo patrón que el de `catering-tradicional-vs-islas-quinceanos`), aplicado a `title`, `excerpt`,
`sections[].body` y `checklist`:

- "exacto" / "cálculo exacto" → "estimado" / "cálculo estimado" (no promete precisión).
- La frase que dice que en Salto la gente consume "el doble de agua y refrescos" → "con calor conviene
  tener más agua y refrescos disponibles". Sin estadísticas inventadas.
- Donde dice "3 a 4 tragos (con alcohol) por adulto": dejá la cifra como **estimación de compra para
  adultos mayores de 18**, y agregá una vez, al final de esa sección: *"Es una estimación para
  calcular la compra, no una recomendación de consumo. En fiestas de 15, los menores van con barra
  sin alcohol; siempre agua disponible y servicio responsable."*
- Sumá `exacto` como palabra prohibida en `REGEX_PROMESAS` (línea ~4) para que el generador del blog
  no vuelva a escribirla.
- No cambies los otros artículos ni la estructura de la página del blog.

## Bloque 5 - Textos rotos de la portada (lo confirmó Claude)

Sólo estos, con las palabras exactas:

1. `src/lib/salon-helper.ts` línea ~15: `'Salon principal'` → `'Salón principal'`. Línea ~26:
   `'Fiesta de quince anos ...'` → `'Fiesta de quince años ...'`. Revisá el resto del archivo por
   "Salon" o "anos" sin tilde en textos que se ven o en `alt`.
2. `src/components/public-footer.tsx` línea ~245: `Oficina & Atencion` → `Oficina & Atención`.
3. `src/components/landing/ServicesSection.tsx` línea ~209: el `alt` arma
   `` `${party.title} producida por AK Producciones` ``. Cambialo a
   `` `${party.title}, producción de AK Producciones` `` (vale para todos los títulos).
4. `src/components/landing/LaAppDeTuFiestaSection.tsx` línea ~349 (y la de "Al día", línea ~402): los
   `div` con `flex items-center justify-between` que tienen título y estado necesitan `gap-3`, para
   que en el celular no queden pegados ("AprobadaConfirmado").
5. `src/data/galeria-publica.json`: **sólo los valores de `"titulo"`** que dicen "Decoracion",
   "Salon" o "Iluminacion" pasan a "Decoración", "Salón" e "Iluminación". **No toques `"categoria"`
   ni `"servicio"`**: se usan como claves (`src/components/landing/gallery-media-utils.ts` línea ~47
   ya les pone la tilde al mostrarlas).
6. `src/lib/youtube/ak-channel.ts`: los `titulo` "XV anos ..." → "XV años ...", y "Belen" → "Belén".
   El valor de `categoria: "XV Anos"` también se ve en pantalla; antes de cambiarlo a "XV Años", buscá
   **todos** los lugares que comparan contra `"XV Anos"` (`grep -rn "XV Anos" src`) y cambialos juntos,
   para que el filtro siga andando.

## Bloque 6 - "Bogue" se escribe "Vogue" (decisión del dueño, 16/10/2026)

En el rubro la estación se llama "Vogue booth" (por la revista). **Cambiá sólo el texto que se lee**,
nunca un identificador. Los lugares, verificados por Claude:

- `src/lib/entertainment/station-config.ts` ~100 (`bogue: 'Bogue'`), `src/app/actions/fiesta/entretenimiento.actions.ts` ~35,
  `src/app/api/manifest-estacion/route.ts` ~26, `src/app/actions/public-guest-portal.ts` ~46 (`label`),
  `src/lib/entretenimiento/resumen-noche.ts` ~41: el valor de texto pasa a `'Vogue'` / `'Vogue Boomerang'`;
  la clave `bogue` queda.
- `src/app/evento/bogue/layout.tsx` ~4 (`title`), `src/app/evento/bogue/[fiestaId]/page.tsx` ~546, ~776, ~796,
  ~817, ~878 y ~1078: "Bogue" → "Vogue" en textos y en `authorName`.
- `src/components/public/InteractiveTechShowcase.tsx` ~114 y ~127, `src/lib/zona-digital-adolescentes.ts` ~34,
  `src/lib/technology-ak/fiesta-technology-products.ts` ~242 y ~253, `src/lib/portfolio-experience/portfolio-experience-data.ts`
  ~329, ~453, ~513, ~514, `src/lib/commercial/portal-led-pro-visual-model.ts` ~68, `src/data/tecnologia-ak.ts` ~41,
  `src/app/(app)/fiestas/[id]/entretenimiento/control/page.tsx` ~53, `src/app/(app)/fiestas/nueva/entretenimiento/page.tsx` ~252,
  `src/app/(app)/fiestas/nueva/page.tsx` ~90.
- **Antes de cambiar `src/data/servicios-empresa.json` ~400 (`"nombre": "Bogue"`)**: buscá si algún código
  compara servicios por `nombre` (`grep -rn "nombre ===\|nombre\.includes\|\.nombre ==" src/app/actions src/lib`).
  Si se compara, cambiá el nombre igual pero también la comparación, para que los presupuestos viejos sigan
  encontrando el servicio (que acepte "Bogue" y "Vogue").
- **Lo que ya está guardado** (fiestas con `"label": "Bogue / Boomerang"`, fotos con `authorName` o
  `momentTag` "Bogue") no se reescribe en la base. Al **mostrar** esos textos, pasalos por una función
  nueva `nombreVisibleDeEstacion(texto)` en `src/lib/entertainment/station-config.ts`, que reemplaza la
  palabra "Bogue" por "Vogue", y usala donde se muestran `label`, `authorName` y `momentTag` de estaciones
  (galería, muro y resumen de la noche). Si algún filtro compara `momentTag === 'Bogue'`, que acepte los dos.
- Prueba: `src/__tests__/la-estacion-se-llama-vogue.test.ts`: (a) ningún texto visible de los archivos de
  arriba dice "Bogue" (los identificadores `bogue` en minúscula sí pueden quedar); (b)
  `nombreVisibleDeEstacion('Bogue / Boomerang')` devuelve `'Vogue / Boomerang'`; (c) la ruta
  `src/app/evento/bogue/[fiestaId]/page.tsx` sigue existiendo.

## Bloque 7 - Ortografía de toda la app

Claude barrió la app con tres ayudantes y confirmó **unos 230 textos visibles** sin tilde o sin eñe
(público ~70, invitado/estaciones/portal ~70, sistema interno ~94). La forma de cerrarlo sin perder
ninguno es con un **control que los encuentre solo**, y arreglar todo lo que marque.

**Paso 1 - El control** `src/__tests__/la-app-escribe-con-tildes.test.ts`. Recorre `src/app`,
`src/components`, `src/lib` y `src/data` (archivos `.ts`, `.tsx`, `.json`; **no** `src/data/fiestas/**`,
**no** `src/data/testimonials.json`, **no** `__tests__`). Saca los comentarios (`//`, `/* */`, `{/* */}`) y
mira **sólo el texto entre comillas y el texto JSX entre `>` y `<`**. Falla si encuentra, como palabra
entera y sin distinguir mayúsculas, alguna de éstas:

`camara, estacion, sesion, pagina, musica, cancion, decoracion, iluminacion, organizacion, informacion,
confirmacion, invitacion, configuracion, coordinacion, comunicacion, instalacion, recuperacion, ubicacion,
conexion, operacion, seccion, presentacion, recepcion, ambientacion, automatizacion, exportacion, contratacion,
telefono, codigo, numero, ultimo, unico, rapido, minimo, publico, tactil, modulo, titulo, galeria, energia,
tecnologia, salon, menu, dia, dias, anos, ninos, cumpleanos, manana, contrasena, sena, senal, tambien, aqui,
aca, ahi, despues, todavia, mas, esta listo, estan, sera, veran, ocurrio, quedo, llego, cargo, guardo, envio,
encontro, perdio, aprobo, actualizo, armo, podes, tenes, volve, elegi, abri, Atencion, Belen, Analia`

Con dos salidas a propósito: (a) **no se cuenta si la palabra está en un identificador** (antes de `:` en
un objeto, `id: '...'`, rutas que empiezan con `/`, nombres de archivo); (b) una lista corta
`PALABRAS_QUE_SON_CLAVE` con los valores que se comparan y no se ven (los marcó el barrido: `categoria`
de `galeria-publica.json`, `category: 'Organizacion'` y `'XV anos'` de `blog-posts.ts` y
`settings/contenido-publico`, ids `'galeria'`, `'camara'`, `'musica'`, `'decoracion'`, `'publico'`,
`'atencion'`). Esos se quedan como están: ya se muestran con tilde por su función de mostrar.
**Antes de agregar algo a esa lista, buscá que de verdad se compare (`grep -rn "=== 'xxx'"`)**.

**Paso 2 - Arreglar todo lo que marque.** Los archivos con más casos, para empezar:
`src/data/blog-posts.ts` (casi todo el texto de los artículos), `src/data/galeria-publica.json` (sólo
`titulo` y `descripcion`), `src/lib/salon-helper.ts`, `src/lib/youtube/ak-channel.ts` (también
`"Cumpleanos"` de la línea ~74), las estaciones `src/app/evento/{fotocabina,touchpix,espejo-magico,plataforma-360,bogue,barra,buzon}/[fiestaId]/page.tsx`
("camara", "estacion", "sesion", "esta"), `src/app/evento/dj/[fiestaId]/page.tsx` ~229 ("LA MUSICA"),
`src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx`, `src/app/invitacion/**`,
`src/components/invitacion/**`, `src/app/(app)/settings/account/page.tsx`,
`src/app/(app)/fiestas/nueva/**`, `src/components/presupuestos/BudgetPrintTemplate.tsx`,
`src/components/payments/mercadopago-result-client.tsx`, `src/components/pwa-install-button.tsx`.

**Reglas:**
- El voseo queda: "podés", "tenés", "volvé", "elegí" (con tilde). No pases nada a "tú".
- **"esta" sin tilde es correcto** cuando es "esta fiesta", "esta estación". Sólo lleva tilde cuando es el
  verbo ("está listo", "no está entregando"). Por eso en la lista va "esta listo" y no "esta" suelta:
  los otros casos del verbo arreglalos leyendo la frase.
- "solo" sin tilde es correcto. No lo cambies.
- **No cambies textos de presupuesto o contrato más allá de la tilde**: misma frase, mismas palabras.
- Las reseñas de clientes (`src/data/testimonials.json`) no se tocan.
- Lo que está en la base (artículos del blog, fiestas guardadas) no se reescribe: el control mira el código.

## Pruebas (qué tienen que comprobar)

- `tests/e2e/133-contrato-responsive.spec.ts` y `tests/e2e/133-mobile-route-latency.spec.ts`: los
  armó Codex y hoy están en `docs/evidencias/` porque fallan a propósito (reproducen el defecto).
  **Movelos a `tests/e2e/` con tu arreglo y tienen que pasar en verde**: el sello no tapa la etiqueta,
  el texto del botón entra en el botón, el título ocupa como máximo dos líneas, y la barra no se
  superpone con el encabezado "Evento" de la tabla.
- `src/__tests__/el-blog-de-bebidas-no-promete.test.ts`: con el artículo tal como está en
  `data/blog-posts.json`, pasado por `corregirPromesasDelBlog`, el resultado no contiene "exacto",
  "el doble" ni una cantidad de tragos sin la aclaración de mayores de 18; y `textoQuePromete('cálculo
  exacto')` no es `null`.
- `src/__tests__/la-portada-escribe-bien.test.ts`: lee `salon-helper.ts`, `public-footer.tsx`,
  `galeria-publica.json` (sólo los `titulo`) y `ak-channel.ts`, y falla si encuentra "Salon ",
  "Atencion", "Decoracion", "Iluminacion", " anos" o "Belen". Además comprueba que `DEFAULT_STATS`
  sigue diciendo "+200" y "+7".

```comprobar
archivo: src/app/portal/[fiestaId]/contrato/page.tsx
no-usa: absolute -top-12 left-1/2 en src/app/portal/[fiestaId]/contrato/page.tsx
usa: pb-24 en src/components/app-shell.tsx
usa: como-calcular-bebida-evento-salto en src/lib/blog/sin-promesas.ts
no-usa: Oficina & Atencion en src/components/public-footer.tsx
no-usa: Salon principal en src/lib/salon-helper.ts
usa: +200 en src/components/landing/StatsSection.tsx
prueba: LISTA tests/e2e/133-contrato-responsive.spec.ts
prueba: LISTA tests/e2e/133-mobile-route-latency.spec.ts
prueba: LISTA src/__tests__/el-blog-de-bebidas-no-promete.test.ts
prueba: LISTA src/__tests__/la-portada-escribe-bien.test.ts
usa: nombreVisibleDeEstacion en src/lib/entertainment/station-config.ts
no-usa: name: 'Bogue Boomerang en src/components/public/InteractiveTechShowcase.tsx
prueba: LISTA src/__tests__/la-estacion-se-llama-vogue.test.ts
prueba: LISTA src/__tests__/la-app-escribe-con-tildes.test.ts
no-usa: LA MUSICA DE LA FIESTA en src/app/evento/dj/[fiestaId]/page.tsx
```
