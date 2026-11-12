# Orden 277 — La web no pierde lo que eligió el prospecto (auditoría pública, 11/11/2026)

**Para Gemini, en la computadora del dueño.** Sobre `claude/app-debug-stabilize-m70e6z` actualizada (`git pull`), rama
nueva `gemini/orden-277-la-web-no-pierde-lo-elegido`. **Una sola entrega con todos los bloques (son 13), sin fusionar.** Si un
bloque se traba, entregá el resto y avisá cuál faltó. Repasá `docs/ANTES-DE-ENTREGAR.md`.

Sale de una auditoría externa de la web pública. Claude verificó cada punto en el código. **El WhatsApp de ejemplo en
los catálogos ya lo arregló Claude** (`AK_WHATSAPP_NUMBER`): no lo toques.

**Lo que NO se toca, porque son decisiones del dueño:** el reloj del simulador, la promoción de 30 días, el ajuste
anual, los regalos y la lista de presupuestos que aparece al poner el celular. Los únicos textos comerciales que cambian
son los de los bloques 8, 9 y 10, que el dueño definió el 11/11/2026.

## Bloque 1 — Del catálogo al simulador, con el evento y el paquete

**Hoy:** en `src/app/catalogo/[tipo]/page.tsx` (~700-735), "Crear presupuesto manual" guarda la elección en
`sessionStorage` (`presupuestoEnProgreso_v3` y `catalogo_seleccion`) y después hace
`router.push('/simulador-de-presupuesto')` **sin nada en la dirección**. El simulador público no lee esas claves (las lee
`src/app/(app)/presupuestos/nuevo/crear/page.tsx`, que es del equipo). Resultado: el prospecto eligió XV e Intermedio y
el simulador arranca en Cumpleaños, 50 invitados y sin paquete.

**Qué se hace:**

- El `router.push` lleva `?tipo=<nombre del catálogo>&paquete=<Básico|Intermedio|Premium>&entry=catalogo-<slug>`. El
  nombre del paquete sale de `selectedPackage.title` sin la palabra "Paquete" (los títulos están en
  `src/data/event-catalogs/shared.ts` ~17, ~36, ~52). Si no eligió paquete, no va `paquete`.
- En `src/app/simulador-de-presupuesto/page.tsx`, junto a los otros `searchParams.get` (~290-297), leé `paquete`.
  Cuando `config?.paquetes` ya cargó, buscá el que tenga el mismo `nombre` (sin acentos ni mayúsculas) y llamá **una
  sola vez** a `selectPackage(id)` (~695), la misma función que usa el botón del paquete. No escribas otra.
- El tipo ya lo entiende `normalizePrefillEventType` (~258). No la cambies.
- **No dejes de escribir** las claves de `sessionStorage`: las usa la pantalla del equipo.

## Bloque 2 — Bodas y Cumpleaños no arrancan como 15 Años

**Hoy:** el selector de la cabecera, en `src/components/landing/HeroSection.tsx:51`, es `useState("15 Años")` fijo. En
`/bodas` y `/cumpleanos` "Consultar disponibilidad de fecha" (~300) manda `tipo=15 Años`.

**Qué se hace:** una prop nueva `tipoEventoInicial?: string` en `HeroSection`, que inicializa `tipoEvento` (si no viene,
sigue "15 Años" como en la portada). `EventLandingPage` (`src/components/landing/EventLandingPage.tsx` ~151) la recibe y
la pasa. `src/app/bodas/page.tsx` manda `"Bodas"` y `src/app/cumpleanos/page.tsx` manda `"Sociales"`, que son valores de
las opciones del selector (~261). Revisá las demás páginas que usan `EventLandingPage` y mandá el que corresponda.

## Bloque 3 — El contador de la galería dice lo que se ve

**Hoy:** `src/components/landing/GallerySection.tsx:418` muestra
`({Math.min(visibleCount + BATCH_STEP, filtered.length)} de {filtered.length})`: con 12 en pantalla dice "21 de 21".

**Qué se hace:** que diga cuántas hay en pantalla: `({displayedImages.length} de {filtered.length})`.

## Bloque 4 — El botón de /experiencia-ak se lee

**Hoy:** `src/app/experiencia-ak/page.tsx:121`, el botón "Calcular Presupuesto Online" es `variant="outline"` con
`text-white`, y el fondo de la variante es claro: texto blanco sobre blanco.

**Qué se hace:** sumale `bg-transparent` a las clases, como los demás botones de contorno sobre fondo oscuro.

## Bloque 5 — Sofía no se traga las preguntas en el paso del teléfono

**Hoy:** en `src/app/simulador-ak/page.tsx` ~441-448, cuando se pide el teléfono, todo lo que no sea un número de 9
dígitos recibe "Por favor, ingresá un número…" y no se le contesta nada. La auditoría preguntó si Intermedio trae
filmación y la respuesta fue pedirle el teléfono.

**Qué se hace:** si el texto no es un teléfono **y tiene letras**, se le pasa al asistente como cualquier otra pregunta
(el mismo camino que usa el resto del chat), se muestra la respuesta y después se vuelve a pedir el teléfono en otro
mensaje. Si son sólo números mal escritos, sigue el aviso de siempre.

## Bloque 6 — El PDF de Sofía dice por qué no se puede todavía

**Hoy:** en `src/app/simulador-ak/page.tsx` ~1324-1329, "Descargar PDF" está deshabilitado mientras no hay `generatedId`,
sin ninguna explicación.

**Qué se hace:** mientras esté deshabilitado por falta de `generatedId`, debajo del botón va "Se habilita cuando
confirmás tu presupuesto". No cambies cuándo se habilita.

## Bloque 7 — Las acciones del resumen no se pisan

En el resumen del simulador manual, los botones de guardar y de WhatsApp se superponían en una computadora de
escritorio. Revisalo a 320, 390 y 1280 de ancho y que ningún botón tape a otro. No cambies textos ni colores.

## Bloque 8 — La seña es el monto de Ajustes, y el 30% es la multa por cancelar (decisión del dueño, 11/11/2026)

**Hoy:** la pregunta frecuente de los catálogos (`src/data/event-catalogs/shared.ts` ~74-79, `id: 'seña'`) dice "una
seña del 30% del total". **Está mal:** la seña es un monto fijo que el dueño cambia en Ajustes → Presentación del
presupuesto (`src/app/(app)/settings/budget-display/page.tsx`, campo `bookingDepositAmount`, hoy $5.000). El 30% es la
penalidad si el cliente cancela (`src/lib/contract-template.ts` ~47). Y Sofía (`src/app/simulador-ak/page.tsx:1308`)
escribe "$5.000" a mano.

**Qué se hace:**

- La respuesta queda: "Sí. Para reservar la fecha se abona una seña de {SENIA}. El saldo se paga en cuotas según lo
  acordado. Si se cancela el evento, la penalidad es del 30% del presupuesto vigente."
- `{SENIA}` se reemplaza al mostrar la pregunta en `src/app/catalogo/[tipo]/page.tsx` con
  `formatCurrency(bookingDepositAmount)`, leído de `getPublicSimulatorBootstrap()`
  (`src/app/actions/public-simulator-bootstrap.ts` ~78, campo `budgetSettings`). Si la lectura falla, va
  `DEFAULT_BOOKING_DEPOSIT_AMOUNT` (`src/lib/budget/formal-budget.ts:4`). Si la misma pregunta se muestra en otro lado
  (las páginas `/public/<evento>`), hacé el mismo reemplazo. Que nunca se vea `{SENIA}` escrito.
- En Sofía, la línea 1308 usa `bookingDepositAmount` de `getBudgetDisplaySettings()`, que ya se llama ahí (~189). Hoy
  sólo lee el ajuste anual: guardá también la seña.

## Bloque 9 — El paquete Intermedio no incluye filmación (decisión del dueño, 11/11/2026)

**Hoy:** `src/data/event-catalogs/shared.ts:43` lista "Fotografía y video" dentro de Intermedio. El dueño confirmó que
**no incluye filmación**. Sacá esa línea de Intermedio. No toques Básico ni Premium, ni `corporativos.ts`.

## Bloque 10 — El precio tachado de Club Uruguay es el doble del precio (decisión del dueño, 11/11/2026)

**Hoy:** en `src/app/simulador-de-presupuesto/page.tsx` el precio tachado es 36000 escrito a mano (~599 y ~2364),
mientras el precio real sale de `config?.clubUruguayConfig?.precio` ($16.900): el cartel "50% OFF" no da la cuenta.

**Qué se hace:** el tachado es siempre `precio * 2`, así el "50% OFF" es cierto con cualquier precio que ponga el
dueño (si pone $20.000, tacha $40.000). El precio ya se edita en Ajustes: no hace falta otra casilla. Buscá `36000` y
`36.000` en todo `src/` (simulador, Sofía, landing de Club Uruguay, PDF) y cambialo en cada lugar donde sea ese tachado.

## Bloque 11 — La barra y el muro muestran la cuenta de Instagram de AK (barrido de Claude, 11/11/2026)

**Hoy** el invitado ve cuentas que no son la de AK (la oficial es `akproduccionesfiestasyeventos`, en
`AK_SOCIAL_LINKS.instagram` de `src/lib/public-contact.ts` ~22):

- `src/app/evento/barra/[fiestaId]/page.tsx` ~1580 (`href` a `instagram.com/akproduccioneseventos/`), ~1585 (el texto
  "@akproduccioneseventos") y ~809 (respaldo `'@akproduccioneseventos'`);
- `src/app/evento/muro-en-vivo/[fiestaId]/page.tsx` ~147, ~163 y ~1744 (respaldo `'@akproducciones'`);
- `src/app/actions/fiesta/barra-tecnologica.actions.ts` ~67 (`instagramHandle: '@akproducciones'` de fábrica);
- `src/lib/barra-tecnologica.ts` ~106 (respaldo `'akproducciones'`).

**Qué se hace:** sumá a `public-contact.ts` `export const AK_INSTAGRAM_HANDLE = '@akproduccionesfiestasyeventos'` y usalo
en todos esos respaldos; el enlace de la barra usa `AK_SOCIAL_LINKS.instagram`. Si la fiesta tiene su propio
`instagramHandle` cargado, sigue mandando ese: sólo cambian los respaldos.

## Bloque 12 — El presupuesto del equipo y el PDF del simulador dicen la seña y el precio de Ajustes (barrido de Claude)

- `src/components/presupuestos/paso-4-resumen.tsx:25`: `BUDGET_VALIDITY_NOTE_PDF` dice "debe abonar el 20% del total
  como seña". Pasa a "Para reservar la fecha se abona una seña de {monto}", con `bookingDepositAmount` de
  `getBudgetDisplaySettings()` (respaldo `DEFAULT_BOOKING_DEPOSIT_AMOUNT`). Y en ~210 el `?? 15` pasa a
  `?? DEFAULT_ANNUAL_ADJUSTMENT_PERCENTAGE`.
- `src/app/catalogo/[tipo]/page.tsx:498`: "Se requiere el 30 % del total para confirmar la fecha" → el mismo texto del
  bloque 8, con la seña de Ajustes y el 30% como penalidad por cancelar.
- `src/lib/budget/simulator-budget-pdf.ts` ~427 y ~433: "Precio Real: $36.000" y "Precio Promo: $16.900" escritos a
  mano. El precio real es `input.salonDetails.costo * 2` (bloque 10) y la promo es `input.salonDetails.costo`.

## Bloque 13 — La presentación LED no pierde las entradas elegidas (barrido de Claude)

> **DEVUELTO (12/11/2026).** La entrega de la 1385 traía el cambio, pero su prueba de navegador no llegaba nunca al botón
> "Generar Presupuesto Manual" (falló dos veces). Claude sacó el cambio y la prueba de la publicación. Rehacelo con una
> prueba que llegue a la lámina de cierre de verdad (mirá cómo se avanza en `src/app/presentacion-led/page.tsx`) y
> corrida en verde antes de entregar.

**Hoy:** `src/app/presentacion-led/page.tsx` ~538-580 manda a `/presupuestos/nuevo/crear` el cliente, los servicios y
los menús por la dirección, pero las **entradas elegidas** (`selectedEntradasIds`) sólo quedan en `sessionStorage`, y
`src/app/(app)/presupuestos/nuevo/crear/page.tsx` (~265-272) no las lee de ningún lado.

**Qué se hace:** sumá `params.append('entradas', id)` por cada una y leelas en crear (`searchParams.getAll('entradas')`,
junto a `servicios` ~266), con el mismo control de formato que `menuId`. Cargalas igual que cuando el equipo las elige a
mano en esa pantalla. No toques el resto de las claves `presentacion_*`.

## Pruebas

- `tests/e2e/el-catalogo-lleva-lo-elegido-al-simulador.spec.ts`: en `/catalogo/xv-anos` elegir Intermedio, tocar
  "Crear presupuesto manual" y comprobar que la dirección del simulador tiene `tipo` y `paquete=Intermedio` y que el
  **paso de datos muestra 15 años**, no Cumpleaños.
- `tests/e2e/las-landings-arrancan-con-su-evento.spec.ts`: en `/bodas` el enlace "Consultar disponibilidad de fecha"
  tiene `tipo=Bodas`, en `/cumpleanos` `tipo=Sociales` y en la portada sigue `tipo=15%20A`.
- `src/__tests__/la-galeria-cuenta-lo-que-se-ve.test.tsx`: con 21 fotos el botón dice "12 de 21", y después de tocarlo
  ya no hay botón.
- `tests/e2e/el-resumen-no-se-pisa.spec.ts`: a 320, 390 y 1280, las cajas de los botones del resumen no se cruzan (se
  comparan con `boundingBox()`).
- En `tests/e2e/sofia-contesta-en-el-paso-del-telefono.spec.ts`: en el paso del teléfono, escribir una pregunta con
  letras no devuelve el aviso del número como única respuesta (cortá el pedido al asistente con `page.route` y devolvé
  un texto fijo: la pantalla tiene que mostrar ese texto).

- `src/__tests__/la-sena-y-los-paquetes-dicen-lo-de-ajustes.test.ts`: la respuesta de la seña no dice "30% del total"
  y nombra la penalidad; con `bookingDepositAmount: 7000` la pregunta del catálogo muestra "$ 7.000" (o como lo
  formatee `formatCurrency`); Intermedio no tiene "video" ni "filmación"; con `precio: 20000` el tachado de Club
  Uruguay es 40000. **Cambiar el monto en la prueba tiene que cambiar lo que se ve**: si sale fijo, está mal.
- `src/__tests__/las-estaciones-muestran-el-instagram-de-ak.test.ts`: sin `instagramHandle` en la fiesta, la barra y el
  muro muestran `@akproduccionesfiestasyeventos`; con uno cargado, muestran ese; y en `src/app` y `src/lib` no queda
  `@akproduccioneseventos` ni `'@akproducciones'` como respaldo.
- En la de la seña, sumá: el PDF del simulador con `costo: 20000` dice 40.000 y 20.000, nunca 36.000; y el resumen del
  equipo no dice "20% del total".
- `tests/e2e/la-presentacion-lleva-las-entradas.spec.ts`: elegir dos entradas en `/presentacion-led`, tocar generar, y
  la dirección de crear trae las dos `entradas=`.

```comprobar
usa: paquete= en src/app/catalogo/[tipo]/page.tsx
usa: searchParams.get('paquete') en src/app/simulador-de-presupuesto/page.tsx
usa: tipoEventoInicial en src/components/landing/HeroSection.tsx
usa: tipoEventoInicial en src/app/bodas/page.tsx
usa: tipoEventoInicial en src/app/cumpleanos/page.tsx
usa: displayedImages.length en src/components/landing/GallerySection.tsx
usa: bg-transparent en src/app/experiencia-ak/page.tsx
usa: Se habilita cuando confirmás tu presupuesto en src/app/simulador-ak/page.tsx
prueba: tests/e2e/el-catalogo-lleva-lo-elegido-al-simulador.spec.ts
prueba: tests/e2e/las-landings-arrancan-con-su-evento.spec.ts
prueba: src/__tests__/la-galeria-cuenta-lo-que-se-ve.test.tsx
prueba: tests/e2e/el-resumen-no-se-pisa.spec.ts
prueba: tests/e2e/sofia-contesta-en-el-paso-del-telefono.spec.ts
no-usa: seña del 30% del total en src/data/event-catalogs/shared.ts
usa: SENIA en src/app/catalogo/[tipo]/page.tsx
usa: bookingDepositAmount en src/app/simulador-ak/page.tsx
no-usa: formatCurrency(36000) en src/app/simulador-de-presupuesto/page.tsx
no-usa: const precioReal = 36000 en src/app/simulador-de-presupuesto/page.tsx
prueba: src/__tests__/la-sena-y-los-paquetes-dicen-lo-de-ajustes.test.ts
usa: AK_INSTAGRAM_HANDLE en src/app/evento/barra/[fiestaId]/page.tsx
usa: AK_INSTAGRAM_HANDLE en src/app/evento/muro-en-vivo/[fiestaId]/page.tsx
usa: AK_INSTAGRAM_HANDLE en src/app/actions/fiesta/barra-tecnologica.actions.ts
usa: AK_INSTAGRAM_HANDLE en src/lib/barra-tecnologica.ts
no-usa: 20% del total como seña en src/components/presupuestos/paso-4-resumen.tsx
no-usa: Se requiere el 30 % del total en src/app/catalogo/[tipo]/page.tsx
no-usa: Precio Real: $36.000 en src/lib/budget/simulator-budget-pdf.ts
usa: entradas en src/app/(app)/presupuestos/nuevo/crear/page.tsx
prueba: src/__tests__/las-estaciones-muestran-el-instagram-de-ak.test.ts
prueba: tests/e2e/la-presentacion-lleva-las-entradas.spec.ts
```
