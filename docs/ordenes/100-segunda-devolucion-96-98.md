# 100 — Segunda devolución de las órdenes 96 a 99: las pruebas de navegador no pasan

**Para:** Gemini.
**Escrita por:** Claude, el 29 de septiembre de 2026, al revisar la propuesta 1246.

Lo de la orden 99 quedó bien: las pruebas de Jest pasan, el tope del Multiagente está, las
tareas dejan constancia y el recordatorio cuenta los días de Uruguay. Arreglé yo dos detalles
(las cuatro llamadas a `actualizarFiesta` sin sesión del equipo, que la orden 99 había pedido
mal, y el motivo en dos `.catch` que la puerta pedía). **Pero `npm run "publicar?"` frena en
"Las pruebas nuevas, primero": 7 de tus pruebas de navegador no pasan** contra la app compilada.

## Cómo se entrega

- **Arrancá de la rama `claude/verificar-1246`** (tiene tu entrega y mis dos arreglos). Rama
  nueva desde ahí, **una propuesta nueva** contra `main`.
- **Corré `npm run "publicar?"` completo y pegá en la propuesta la última pantalla.** Esta
  entrega vino sin correr las pruebas de navegador. Si no podés correrlas, decilo y no digas
  "terminé".
- **No se toca la prueba para que pase:** se arregla lo que la prueba muestra. Si la prueba estaba
  mal escrita (por ejemplo, busca un elemento que no existe), se corrige y se explica por qué.

## Las fallas, con lo que dice cada una

| Prueba | Qué falla |
|---|---|
| `el-simulador-respeta-el-tipo-de-fiesta.spec.ts` (3 casos) | `locator('button[role="combobox"]')` no existe en `/simulador-de-presupuesto`. Buscá cómo se elige de verdad el tipo de fiesta en esa pantalla y apuntá la prueba ahí; después comprobá que `?tipo=boda` deja elegida Boda. |
| `el-simulador-respeta-el-tipo-de-fiesta.spec.ts` (el del pie) | "Elegí tus servicios para ver el total" **no aparece** al abrir el paso 1. O el cambio no llegó a la pantalla, o el total inicial no es 0: mirá qué muestra y arreglá el código, no la prueba. |
| `la-demo-de-la-barra-respeta-el-trago.spec.ts` | Después de pedir el Citrus Mocktail no aparece "Pedido #42: Citrus Mocktail". |
| `la-portada-no-dice-cero.spec.ts` (2 casos) | El HTML de la portada todavía contiene `0/7`, y al bajar hasta las tarjetas no se ven los números reales. Fijate si queda la tarjeta de "24/7" o su contador en `StatsSection` o en `defaultLandingSettings`. |
| `la-orden-de-evento-junta-todo.spec.ts` (celular y computadora) | En la hoja no aparece el empleado "Gonzalo DJ Operativo" que la prueba carga. |
| `la-reunion-de-organizacion-guarda-donde-corresponde.spec.ts` | No aparece el botón "Cerrar la reunión". |

```comprobar
prueba: tests/e2e/el-simulador-respeta-el-tipo-de-fiesta.spec.ts
prueba: tests/e2e/la-portada-no-dice-cero.spec.ts
no-usa: 24/7 en src/components/landing/StatsSection.tsx
no-usa: 24/7 en src/types/landing-editor.ts
```

## Y una más: la prueba de la orden de evento ensucia los datos

`la-orden-de-evento-junta-todo.spec.ts` deja escrito un empleado en `src/data/empleados.json` (y
crea `data/empleados.json`), y `npm run limpiar:corrida` no los conoce. Que la prueba borre lo que
creó al terminar, **y** sumá esos dos archivos a la lista de `limpiar:corrida`.

## Bloque nuevo, en la misma propuesta — La medición no recibe llaves (Codex, hallazgo 100-medición)

**Qué pasa hoy.** `src/components/google-analytics.tsx` y `src/components/meta-pixel.tsx` se
montan en **todas** las pantallas (`src/app/layout.tsx` ~l.141-142), también las privadas, y
mandan la dirección completa:

- Google: `gtag('config', gaId, { page_path: pathname + window.location.search })` (~l.24). Con
  `/invitacion/<fiesta>/invitado/<invitado>?token=…` el `token` del invitado le llega a Google.
  Además `gtag` manda solo `page_location` con la dirección entera, así que limpiar `page_path`
  no alcanza.
- Meta: el píxel manda la dirección completa en cada `PageView`, y por omisión **escucha los
  cambios de pantalla** y manda otro `PageView` en cada uno.
- Hay pantallas con la llave **en la ruta**, no en la consulta: `/portal/c/[accessKey]`,
  `/proveedor/acceso/[token]`, `/acceso-personal/[tokenId]`.

**Qué hacer:**

1. Función pura `src/lib/medicion-segura.ts`:
   - `sePuedeMedir(pathname): boolean` → `true` **sólo** para las páginas de venta: `/`,
     `/blog…`, `/bodas…`, `/quinceaneras…`, `/cumpleanos…`, `/catalogo…`, `/club-uruguay`,
     `/experiencia-ak`, `/landing/…`, `/public/…`, `/simulador…` (incluye `/simulador-ak` y
     `/simulador-de-presupuesto`), `/privacidad`. **Todo lo demás, `false`** (lista de permitidas,
     no de prohibidas: una pantalla privada nueva queda afuera sola).
   - `direccionParaMedir(pathname, search): string` → el `pathname` más **sólo** estos parámetros:
     `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `gclid`, `fbclid`,
     `tipo`, `eventType`, `salon`. Todo otro parámetro (`token`, `guestId`, `access`, …) se saca.
2. `GoogleAnalytics`: si `!sePuedeMedir(pathname)`, no manda nada. Si se puede, manda
   `page_path`, **`page_location`** (`window.location.origin + direccionParaMedir(...)`) y
   **`page_referrer`** limpio de la misma forma si el referente es de `akproducciones.uy`.
3. `MetaPixel`: pasa a ser componente de cliente con `usePathname`. **No carga el script** si la
   primera pantalla no se puede medir. Antes de `fbq('init', …)` poné
   `window.fbq.disablePushState = true` y `fbq('set', 'autoConfig', false, id)`, y mandá el
   `PageView` a mano en cada cambio de pantalla **sólo** si `sePuedeMedir`. El `<noscript>` va
   sólo en las páginas de venta.
4. **No toques** los eventos de venta que ya existen (formulario del simulador, contacto): siguen
   saliendo, pero con la dirección limpia.

**La prueba** (`tests/e2e/medicion-no-envia-llaves.spec.ts`), con `gtag` y `fbq` simulados en la
página (`page.addInitScript`) que anotan todo lo que reciben:

- abrir `/invitacion/x/invitado/y?token=LLAVE-FICTICIA` y `/portal/c/LLAVE-FICTICIA`: **ninguna**
  llamada contiene `LLAVE-FICTICIA` (ni codificada) y no hay `PageView`;
- abrir `/?utm_source=ig&token=LLAVE-FICTICIA`: hay medición, con `utm_source=ig` y **sin** la llave;
- ir de la portada a una pantalla privada sin recargar: no sale un segundo `PageView`.

Y una prueba de Jest para `sePuedeMedir` y `direccionParaMedir` con esos mismos casos.

```comprobar
archivo: src/lib/medicion-segura.ts
usa: sePuedeMedir en src/components/google-analytics.tsx
usa: sePuedeMedir en src/components/meta-pixel.tsx
usa: page_location en src/components/google-analytics.tsx
usa: disablePushState en src/components/meta-pixel.tsx
prueba: tests/e2e/medicion-no-envia-llaves.spec.ts
```

## Bloque nuevo, en la misma propuesta — El asistente no pierde conversaciones ni completa otra tarea (Codex, 30/09)

### A. Dos guardados a la vez pierden una conversación o un aprendizaje

**Qué pasa hoy.** `appendMultiAgentChatTurn` (`src/lib/multiagent/chat-store.ts` ~l.51) lee
**todo** `multiagent/chats.json`, le agrega el turno y vuelve a escribir todo (`writeChatState`
~l.43). `saveAgentLearning` (`src/lib/multiagent/memory-store.ts` ~l.88) hace lo mismo con
`multiagent/memory.json`. Si dos personas del equipo le escriben al asistente a la vez, las dos
reciben respuesta y **en la base queda sólo una**. En la base, esos archivos son el documento
`multiagent/chats` y `multiagent/memory` (`src/lib/firebase-sync.ts` ~l.384-400: carpeta =
colección, archivo = documento).

**Qué hacer:**

1. Función nueva `mutarDocumentoConTransaccion<T>(ruta, vacio: T, cambiar: (actual: T) => T | null)`
   en `src/lib/generic-json-store.ts`, junto a `mutateGenericJsonArray` (~l.58) y con la misma
   forma: `db.runTransaction`, leer `db.collection(carpeta).doc(archivoSinJson)` **adentro**,
   aplicar `cambiar` y `transaction.set(ref, { ...resultado, _syncedAt })`. Si `cambiar` devuelve
   `null`, no se guarda. **Con `AK_USE_LOCAL_JSON_ONLY=true`**, lo mismo con un `AsyncMutex`
   (`src/lib/mutex.ts`) y `readData`/`writeData`.
2. En los dos archivos, sacá la parte que arma el estado nuevo a una función pura
   (`agregarTurno(state, input)` y `agregarAprendizaje(state, input)`), **sin cambiar lo que
   hace** (límites de 160 sesiones y 120 aprendizajes, alcance por fiesta), y guardá con
   `mutarDocumentoConTransaccion`. Si el guardado falla, la función **tira el error**: no devuelve
   la sesión como si se hubiera guardado.

### B. El asistente marca como hecha una tarea distinta de la pedida

**Qué pasa hoy.** `src/app/actions/multiagent.ts` ~l.148-150 marca la **primera** tarea que
coincide por id **o** por texto. Con las tareas "Confirmar proveedor del salón" (id `salon`) y
"Confirmar proveedor de comida" (id `comida`), pedir `tareaId: 'comida'` con texto "Confirmar
proveedor" completa **la del salón** y dice que salió bien.

**Qué hacer:**

- **Si viene `tareaId`:** se busca **sólo** por id. Si no existe, contesta "No encontré esa
  tarea" y **no escribe nada**; no se cae al texto.
- **Si viene sólo texto:** se juntan todas las que lo contienen. Cero → "No encontré esa tarea".
  **Más de una → no escribe** y contesta cuáles son, para que la persona elija. Una sola → se
  marca como hoy.
- **No toques** el caso ya resuelto de "sin id ni texto no se adivina" (el comentario de ~l.158).

### La prueba

`src/__tests__/el-asistente-no-pierde-ni-elige-mal.test.ts`, con la base de mentira que **devuelve
una copia** en cada lectura (error 11 de `CLAUDE.md`):

- dos `appendMultiAgentChatTurn` a la vez, de dos fiestas distintas: al releer están **las dos**
  sesiones; y dos turnos a la vez de **la misma** sesión: están los dos mensajes;
- dos `saveAgentLearning` a la vez: están los dos aprendizajes;
- si el guardado falla, la función tira el error;
- con las dos tareas de arriba: `tareaId: 'comida'` + texto "Confirmar proveedor" marca **sólo**
  la de comida; `tareaId: 'no-existe'` no marca nada; sólo texto "Confirmar proveedor" no marca
  nada y la respuesta nombra las dos.

**Se tiene que poner en rojo** si se vuelve a guardar con `writeData` de la lista entera.

```comprobar
usa: mutarDocumentoConTransaccion en src/lib/multiagent/chat-store.ts
usa: mutarDocumentoConTransaccion en src/lib/multiagent/memory-store.ts
no-usa: coincideId || coincideTexto en src/app/actions/multiagent.ts
prueba: src/__tests__/el-asistente-no-pierde-ni-elige-mal.test.ts
```
