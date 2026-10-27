# Orden 227 — El segundo fondo claro, y "no se pudo cargar" no es "no existe" (Codex 387 y 423, 24/10/2026)

**Para Gemini. Va en la misma propuesta 1353**, rama `gemini/ordenes-180-195`, junto con la orden 226.
Primero traé y fusioná `claude/app-debug-stabilize-m70e6z`. Si un bloque se traba, entregá el resto y avisá
cuál faltó. Leé `docs/ANTES-DE-ENTREGAR.md` (preguntas 67 y 68) antes de decir "terminé".

## Qué está bien y no se toca

Codex volvió a probar `917a98e32`. Pasan: el recordatorio con 503 (orden 225), la factura `null` sin ruedita
infinita y la lectura pendiente. Sacar `main.flex-1` de `ak-global-premium.css` estuvo bien: **no lo
vuelvas a poner**.

## Bloque 1 — la barra sigue ilegible: hay otra regla que pinta el fondo

`src/app/ak-internal-experience-polish.css` (lo importa `src/app/layout.tsx:8`) usa `main.flex-1` en sus 22
selectores. La línea 2, `main.flex-1 > div:first-child`, pone un degradado casi blanco (`background`,
con `linear-gradient`) al primer hijo de **cualquier** `<main class="flex-1">`. Así también tiñe pantallas
públicas que tienen su propio `main`. Codex midió 1,39 a 1 de contraste en la barra.

La regla es para el panel interno. Acotala a ese lugar:

- En `src/components/app-shell.tsx` (~437), al `<main className="flex-1 bg-slate-50/80 ...">` agregale la
  clase `ak-panel-main`.
- En `ak-internal-experience-polish.css`, cambiá **los 22** `main.flex-1` por `main.ak-panel-main`. No
  cambies colores ni nada más del archivo.
- Así dejan de tocarse las seis pantallas con `main` propio: barra lista, buzón, en vivo, experiencia,
  tecnología y `src/app/catalogo/[tipo]/page.tsx`.

**Mirá también estas cinco pantallas del panel**, que tienen el primer contenedor oscuro y sí siguen bajo la
regla: `empresa/presencia-digital/page.tsx:22`, `fiestas/[id]/centro/page.tsx:173`,
`fiestas/nueva/en-vivo/page.tsx:172`, `fiestas/nueva/entretenimiento/page.tsx:1144` y
`empresa/presentacion-led/configuracion/page.tsx:212`. Abrilas y sacá una captura. Si el texto claro quedó
sobre fondo claro, agregá al selector de la línea 2 `:not([class*="bg-slate-950"]):not([class*="bg-[#09090b]"])`,
y lo mismo en el de la línea 1 para el `main` de `centro`. Si se leen bien, no las toques, y anotá en la
propuesta qué viste.

**La prueba.** `tests/e2e/barra-listo-contraste.spec.ts` mira `getComputedStyle(...).backgroundColor` y
dio verde con el texto ilegible, porque el degradado es `background-image`. Cambiala por la medición
de píxeles: sacá una captura del título (`locator.screenshot()`), tomá el color del fondo y el del texto, y
comprobá un contraste de al menos 4,5 a 1. El modelo está en `docs/evidencias/423-barra-pixeles.spec.ts`.
Hacelo en las seis pantallas con `main` propio y en una pantalla clara del panel, que tiene que seguir clara.

## Bloque 2 — si la lectura falla, la pantalla dice que la fiesta "no existe"

`getFiestaById` (`src/app/actions/fiesta/fiesta.actions.ts` ~462) atrapa el error de lectura con
`catch (e) {}` y devuelve `null`. La pantalla no puede saber si la fiesta no existe o si la base no contestó,
y muestra "Fiesta no encontrada… no existe o fue eliminada". **No cambies `getFiestaById`**: la llaman 159
archivos que esperan `null`.

- En el mismo archivo, separá el cuerpo en una función interna (sin `export`)
  `leerFiestaConEstado(fiestaId, lectura)`. Tiene que devolver `{ fiesta, fallo }`: `fallo` es `true`
  si `readData` tiró y tampoco apareció en los archivos locales ni en las archivadas. Deja **adentro** todo
  lo que hoy hace después: los módulos por defecto y el recorte con `quienEsElEquipo`.
- `getFiestaById` pasa a ser `return (await leerFiestaConEstado(fiestaId, lectura)).fiesta;`. Por fuera
  queda igual.
- Agregá `export async function getFiestaParaPantalla(fiestaId: string)`, que devuelve
  `leerFiestaConEstado(fiestaId)` **sin** `LECTURA_COMPLETA`. Así recorta igual que `getFiestaById`.
- **Plata y permisos:** el recorte de lo que ve quien no es del equipo tiene que pasar **por el mismo
  camino** en las dos funciones. La prueba lo comprueba.

Usala en estas pantallas de `src/app/(app)/fiestas/nueva/`: `carta-tragos`, `carteleria`, `menu-mesa`,
`invitados`, `muro-social`, `en-vivo`, `modulo-invitado`, `pantallas-totem` y `gestion-documental`. En cada
una:

- si `fallo` o el `catch` de la carga, se muestra **"No se pudo cargar la fiesta"** con un botón
  **Reintentar** que vuelve a llamar a la carga. "Fiesta no encontrada" queda sólo para `fiesta === null`
  sin falla.
- En `carta-tragos` (~279), `carteleria` (~479) y `menu-mesa` (~163), el `if (error)` va **antes** que el
  `if (!fiesta)`. Hoy el mensaje de error que ya tienen nunca se ve.
- En `pantallas-totem`, `loadData` (~148) no tiene `try/catch`: si la lectura tira, la ruedita gira para
  siempre. Ponele `try/catch/finally` con `setIsLoading(false)` en el `finally`.

**La factura.** En `src/app/(app)/invoices/[id]/page.tsx` (~59), si `getInvoiceTemplateSettings` o
`getInvoiceById` tiran, guardá el error en un estado y mostrá **"No se pudo cargar la factura"** con
Reintentar. "Factura no encontrada" queda sólo para `fetchedInvoice === null` sin error. No cambies importes,
cobros ni `getInvoiceById`.

**Las pruebas, en Jest:**

- `src/__tests__/una-falla-de-lectura-no-dice-que-no-existe.test.tsx`. Con `readData` que tira,
  `getFiestaParaPantalla` devuelve `fallo: true`. Con el archivo ausente devuelve `fallo: false` y
  `fiesta: null`. Con sesión de personal, `getFiestaParaPantalla` y `getFiestaById` devuelven la fiesta
  **sin** `clientPortalSettings`. Además, una pantalla, con la carga rechazada, muestra "No se pudo cargar" y
  no "no existe".
- La reproducción de Codex `docs/evidencias/387-factura-error-no-es-ausencia.test.tsx` pasa a
  `src/__tests__/` y tiene que dar verde.

```comprobar
usa: main.ak-panel-main en src/app/ak-internal-experience-polish.css
no-usa: main.flex-1 en src/app/ak-internal-experience-polish.css
usa: ak-panel-main en src/components/app-shell.tsx
no-usa: backgroundColor en tests/e2e/barra-listo-contraste.spec.ts
usa: screenshot en tests/e2e/barra-listo-contraste.spec.ts
usa: /catalogo/ en tests/e2e/barra-listo-contraste.spec.ts
usa: function leerFiestaConEstado en src/app/actions/fiesta/fiesta.actions.ts
usa: export async function getFiestaParaPantalla en src/app/actions/fiesta/fiesta.actions.ts
usa: getFiestaParaPantalla en src/app/(app)/fiestas/nueva/carta-tragos/page.tsx
usa: getFiestaParaPantalla en src/app/(app)/fiestas/nueva/carteleria/page.tsx
usa: getFiestaParaPantalla en src/app/(app)/fiestas/nueva/menu-mesa/page.tsx
usa: getFiestaParaPantalla en src/app/(app)/fiestas/nueva/invitados/page.tsx
usa: getFiestaParaPantalla en src/app/(app)/fiestas/nueva/muro-social/page.tsx
usa: getFiestaParaPantalla en src/app/(app)/fiestas/nueva/en-vivo/page.tsx
usa: getFiestaParaPantalla en src/app/(app)/fiestas/nueva/modulo-invitado/page.tsx
usa: getFiestaParaPantalla en src/app/(app)/fiestas/nueva/pantallas-totem/page.tsx
usa: getFiestaParaPantalla en src/app/(app)/fiestas/nueva/gestion-documental/page.tsx
usa: No se pudo cargar la factura en src/app/(app)/invoices/[id]/page.tsx
prueba: src/__tests__/una-falla-de-lectura-no-dice-que-no-existe.test.tsx
prueba: src/__tests__/387-factura-error-no-es-ausencia.test.tsx
prueba: tests/e2e/barra-listo-contraste.spec.ts
```
