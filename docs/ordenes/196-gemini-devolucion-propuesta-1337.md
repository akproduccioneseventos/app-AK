# PARA GEMINI - Orden 196: devolución de la propuesta 1337 (órdenes 188 a 192)

**Seguí en la MISMA rama `feat/ordenes-188-a-192-gemini` y la misma propuesta 1337.**

- Primero traé lo último de `claude/app-debug-stabilize-m70e6z`. Ahí están las órdenes 193, 194, 195 y
  esta, que **no** venían en tu entrega.
- Hacé las cuatro (193, 194, 195 y 196) en la misma propuesta.
- Si un bloque se traba, entregá el resto y avisá cuál faltó.
- Antes de decir "terminé", pasá `docs/ANTES-DE-ENTREGAR.md` entero.

**Lo que está bien y NO hay que rehacer:**

- `costos-interno.ts` con `server-only`;
- el webhook de Meta con firma y sin repetir mensajes;
- la bandeja única;
- los filtros que siguen la cara;
- el tope de voz del cliente;
- `getMisPermisos`;
- borrar facturas y presupuestos con `ADMINISTRACION`.

## Bloque 1 — un permiso que se saltea desde el navegador (plata)

`updateFiestaPartial` (`src/app/actions/fiesta/fiesta.actions.ts` ~319) es una acción de servidor
exportada de un archivo `'use server'`. Le agregaste la opción `internalSync`, que **se saltea el control
de ganancias y de sueldos**. Cualquiera con sesión puede llamarla desde el navegador con
`{ internalSync: true }` y cambiar costos y sueldos sin permiso. Es la pregunta 69 exacta.

- Sacá `internalSync` de las opciones de la acción exportada.
- La sincronización interna va por una función de `src/lib/fiesta/costos-interno.ts` (que ya tiene
  `server-only`) que guarda **sin pasar por la acción exportada**: con `actualizarFiesta`, adentro del
  turno.
- En `syncDecoGastosToModule` (`decoracion.actions.ts` ~178), el "si falla con permiso, probá sin
  permiso" (`updateGestionCostos(...).catch(() => null)` y después `updateGestionCostosInterno`) **se
  saca**. Si no tiene permiso, no tiene permiso.
- La decoración desde el portal (orden 194, hallazgo 35) se arregla como dice esa orden.
- En `saveFiesta` (~301), cuando hay contabilidad pero no sueldos o ganancias, lo guardado se repone
  **adentro de `actualizarFiesta`**, no con una lectura de antes (pregunta 22).

## Bloque 2 — la voz que dice que hizo lo que no hizo (pregunta 82)

Archivo: `src/app/api/asistente/voz-en-vivo/accion/route.ts`.

- Perfil `personal` (sesión sin ningún permiso): hoy crea tareas y recordatorios. Pedí `usuarioDelEquipo()`
  (`src/lib/auth/equipo-de-la-fiesta.ts`). Para `crear_tarea` y `anotar_recordatorio`, `ORGANIZACION`.
- `preparar_borrador_whatsapp` contesta "Dejé listo el borrador… desde Mi Día" y **no guarda nada**.
  Guardalo en la bandeja de salida que ya usa Mi Día (buscá `outbox` / `scheduled-messages`), o no lo
  digas.
- El caso `default` contesta "Acción X recibida y registrada" con `success: true` para cualquier
  nombre. Una acción que no existe devuelve `success: false`, "Eso todavía no lo sé hacer".
- `crear_tarea` y `anotar_recordatorio` leen la lista entera y la reescriben con `writeData`.
  Usá `mutateGenericJsonArray` o el guardado con turno que ya usa la app (pregunta 22).
- La pantalla que confirma "pregunta" tiene que mandar `confirmado: true` sólo después del "sí" de la
  persona. Mirá que la prueba lo compruebe.

## Bloque 3 — los dots de AK no inventan (pregunta 82)

Archivo: `src/lib/agentes/motor-agentes.ts`.

- `consultarAsistenteAK` (~519) contesta "Este mes se cobraron $240.000 y restan por cobrar $85.000" y
  "cobros pendientes por $180.000" **siempre**. Además registra consumo de IA sin llamar a la IA.
  - Los números salen de lo que ya calcula la app: el cobrador (`ejecutarCobrador` ~204) o
    `getBudgetCollectibleTotal`.
  - El texto lo arma la IA sólo si se la llama de verdad. Sin IA, va el texto con los números reales.
  - "Organización de fiestas al día" fijo también se saca: decí lo que falta con
    `calculateFiestaPreparationScore`.
- `ejecutarAccionDeAgenteConReglas` (~575) dice "Acción X ejecutada automáticamente" **sin ejecutar
  nada**. Que llame de verdad a la acción (las mismas que la voz, bloque 2), o que diga "preparada".
- El control nuevo `src/__tests__/el-asistente-no-inventa-plata.test.ts` ya está en la rama de Claude:
  con tu entrega se pone en rojo. **No lo toques**: arreglá lo que marca.

## Bloque 4 — realidad aumentada de verdad (orden 189)

`src/app/evento/ar/[fiestaId]/page.tsx` importa `mind-ar`, que **no está instalado** (no figura en
`package.json`). El `catch` lo deja en `null` y la pantalla no hace nada. Además le pasa
`coverUrl` o un ícono como `imageTargetSrc`, y MindAR necesita el archivo compilado `.mind`.

- Instalá `mind-ar`.
- Hacé lo que pide la orden 189: al guardar la invitación impresa, la app compila el `.mind` en el
  navegador con el compilador de MindAR y lo sube. La pantalla AR usa ese archivo.
- Sin `.mind`, el cartel dice "Esta invitación todavía no tiene realidad aumentada"; no queda una
  cámara negra.
- Prueba de navegador: con un `.mind` de ejemplo en `tests/fixtures/`, la pantalla carga MindAR y no
  muestra el cartel de error.

## Bloque 5 — el webhook de Meta tiene que poder recibir (pregunta 74)

- `/api/meta/webhook` no figura en `src/lib/auth/public-paths.ts`: la puerta general lo manda a
  `/login` y **Meta no puede entregar nada**. Agregalo a `PUBLIC_EXACT_PATHS` (la orden 194, bloque 1,
  trae la prueba que lo exige).
- `obtenerSecretoMeta` (~12) cae en `'meta_ak_secret'` si no hay clave configurada. Ese texto está en
  el repositorio: cualquiera puede firmar mensajes falsos. **Sin clave configurada, se rechaza todo.**
- El guardado de `social-mensajes-directos.json` (~81) lee y reescribe la lista entera: usá el guardado
  con turno (pregunta 22).

## Qué NO tocar

- Lo que ya anda de la lista de arriba.
- `correspondeContestarSolo`.
- Precios, el reloj y los textos de venta.

## Pruebas (que miren el resultado)

- `src/__tests__/devolucion-1337-permisos.test.ts`:
  - `updateFiestaPartial(id, { gestionCostos }, { internalSync: true } as any)` con sesión de
    `secretaria` (sin ganancias) **no** cambia los costos;
  - la voz con sesión de `personal` no crea tareas;
  - una acción inexistente devuelve `success: false`;
  - el borrador de WhatsApp aparece en la bandeja de salida.
- `src/__tests__/el-asistente-no-inventa-plata.test.ts` en verde, sin tocarlo.
- `src/__tests__/el-webhook-de-meta-no-acepta-firmas-falsas.test.ts`: sin `META_APP_SECRET`, una firma
  hecha con `'meta_ak_secret'` se rechaza.
- `tests/e2e/la-realidad-aumentada-carga-mindar.spec.ts`.

```comprobar
no-usa: internalSync en src/app/actions/fiesta/fiesta.actions.ts
no-usa: $240.000 en src/lib/agentes/motor-agentes.ts
no-usa: meta_ak_secret en src/app/api/meta/webhook/route.ts
usa: /api/meta/webhook en src/lib/auth/public-paths.ts
usa: mind-ar en package.json
usa: .mind en src/app/evento/ar/[fiestaId]/page.tsx
usa: actualizarFiesta en src/lib/fiesta/costos-interno.ts
no-usa: updateGestionCostos(fiestaId, updatedCostos).catch en src/app/actions/fiesta/decoracion.actions.ts
usa: usuarioDelEquipo en src/app/api/asistente/voz-en-vivo/accion/route.ts
prueba: src/__tests__/devolucion-1337-permisos.test.ts
prueba: src/__tests__/el-asistente-no-inventa-plata.test.ts
prueba: tests/e2e/la-realidad-aumentada-carga-mindar.spec.ts
```
