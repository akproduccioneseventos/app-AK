# Orden 215 — Devolución de la propuesta 1353 (para Gemini)

## Contraste actual Codex347-359 - 24/10

HEADactual1353:3f9460185143ef034dcd713e975d2a0af5e20f1a. El fallo de build y
los38fallos relatados abajo pertenecen a la entrega HISTORICA, no al HEADnuevo.
347 build exit0/tipos/lint/sourceDiff0.349 Jest:861suites5237tests,
5224PASS13FAIL0pending. No aprobar por buildsolo ni llamarlos13bugs de app.
Once timeouts5000ms; una asercion de ajustes (mock sin exportmutarDocumento
que ahora usa dependencia); un fixture data/blog-posts.json ausente enQA.
Causa final de esos13 no confirmada por retest:354 no ejecuto por RAM,
el artefactoTemp347 dejo de estar disponible; conservar fuentes y recibos.
NO quitar permisos, mocks/aserciones negativas o timeouts para dar verde.
Repetir SOLO esas siete suites con fixture del mismoSHA y resolver la causa;
no otra bateria completa si el codigo no cambia. Ver353/358/359.
357 cierra212A7/A8;356 mantiene214;350 pasa217original con variante nueva.
NO aceptacion global de1353 ni de sus otras propuestas relacionadas.

**Rama:** seguí en `gemini/ordenes-180-195` y **subí a la misma propuesta 1353**. Antes de empezar,
traé `claude/app-debug-stabilize-m70e6z` a tu rama. **Una sola propuesta** con todo lo de abajo. Si un
bloque se traba, entregá el resto igual y decí cuál faltó. Leé `docs/ANTES-DE-ENTREGAR.md` antes de decir
"terminé", y **corré `npx tsc --noEmit` y `npx jest --silent` en cero antes de subir**.

## Por qué vuelve

`npm run ordenes?` da las 16 órdenes como HECHAS, pero la entrega **no compila** (1 error) y fallan
**38 pruebas en 23 archivos**. Hay pruebas que importan archivos que no existen y pantallas que leen
datos que no están. No se puede publicar así.

## Bloque 1 — Que compile

`src/lib/asistente/avisos-proactivos.ts` línea ~27: `ajustes.avisosProactivosActivos` no existe en el
tipo `AsistenteSettings`. Agregá `avisosProactivosActivos?: boolean` al tipo de los ajustes del asistente
(donde está `vozEnVivoClienteActiva`, en `src/lib/asistente/avisar-al-duenio.ts`) y sacá el `.catch` que
cambia el tipo.

## Bloque 2 — La bandeja de mensajes sin permiso (urgente)

En `src/app/actions/presencia-digital.ts`, al final del archivo, `leerBandejaUnicaAction`,
`getAjustesRespuestasAction` y `setAjustesRespuestasAction` **no piden permiso**. Así como están,
cualquiera desde internet podría leer todos los mensajes de clientes y prospectos, y prender o apagar las
respuestas solas.

- Las tres arrancan con `const permiso = await requirePermiso(PERMISOS.CRM);`, igual que las demás del
  archivo (línea ~47).
- Sin permiso:
  - la bandeja devuelve `[]`;
  - los ajustes devuelven `{ success: false, error: permiso.error }`.
- Prueba en `src/__tests__/la-bandeja-pide-permiso.test.ts`:
  - con `requirePermiso` simulado en `{ ok: false }`, la bandeja da `[]`;
  - `setAjustesRespuestasAction` **no** llama a `setAjustesRespuestasComentarios`;
  - con `{ ok: true }`, las dos llegan.

## Bloque 3 — Las 23 pruebas que fallan

Cada una tiene que pasar **sin cambiar lo que comprueba**. Si una prueba vieja choca con lo que pidió la
orden, decí cuál y por qué en la propuesta; no la debilites.

1. `la-fiesta-llega-con-la-plata-de-cada-perfil.test.ts` importa `../lib/budget/sin-cobros`, **que no
   existe**. O escribís ese archivo con lo que la prueba espera, o la prueba usa la función real que ya
   recorta la plata por perfil. No borres la prueba.
2. `la-fiesta-en-cinco-pestanas.test.ts`, `el-portal-en-cinco-pasos.test.ts` y
   `el-portal-ofrece-las-estaciones.test.ts`: leen `undefined` (`PORTAL_EXTRA_DEFINITIONS`, la lista de
   módulos). Revisá qué exportan `src/lib/fiesta/fiesta-modules.ts` y `src/lib/portal/portal-modules.ts`,
   y que cada módulo tenga su paso o pestaña.
3. `la-franja-del-presupuesto-no-cambia-numeros.test.tsx`: `BudgetDocument` se rompe con un presupuesto
   sin `itemsPresupuestados` (`.filter` sobre `undefined`). Usá `?? []`.
4. `la-galeria-filtra-vogue.test.tsx`, `mi-mesa-lleva-a-la-app.test.tsx`,
   `la-trivia-usa-ia-y-no-inventa.test.ts`, `el-reel-no-dice-publicado-si-fallo.test.ts`: **tus propias
   pruebas nuevas fallan**. La pantalla no hace lo que la prueba pide (falta "Cabina Vogue", falta el
   enlace a `/evento/barra/`, la trivia arranca sin confirmar, el reel no dice "Con error"). Arreglá la
   pantalla, no la prueba.
5. `la-voz-en-vivo-ruta.test.ts`, `la-voz-en-vivo-lib.test.ts` y `devolucion-1337-permisos.test.ts`:
   cambiaste quién entra a la llamada. Que entre todo perfil interno está bien (orden 190), pero las
   respuestas tienen que seguir siendo las de antes: 403 para el personal **sin ningún permiso**, y 429,
   503 y 502 en los mismos casos. El `TypeError 'url'` sale de una función que la prueba no simula: sumala
   al simulacro.
6. `orden-169-pantallas-que-dicen-listo.test.tsx` y `tareas-no-corren-con-la-base-caida.test.ts`:
   agregaste llamadas (`getAjustesRespuestasAction`, `getAsistenteSettings`) que esas pruebas no simulan.
   Sumalas a sus simulacros, con el comportamiento real.
7. `orden-168-pantallas-avisan-la-falla.test.tsx`: Mi Día se queda esperando cuando falla una lectura.
   Cada lectura nueva que agregaste en `src/app/(app)/mi-dia/page.tsx` tiene que tener su `catch` y no
   colgar la pantalla.
8. `la-planificacion-no-pierde-lo-que-guarda.test.ts`: en `decoracion.actions.ts` cambiaste
   `guardarCostosInterno` por `updateGestionCostosInterno`, y la prueba simula el primero. **Volvé a
   `guardarCostosInterno`** y borrá el alias `updateGestionCostosInterno` de `costos-interno.ts`: no hace
   nada distinto.
9. `codex-156-158-portal-propio-y-tareas-recortadas.test.ts`: la tarea sin clave volvió a contestar algo
   que no debe (`respuestaDeLaTarea`). Es un recorte de datos: dejalo como estaba en
   `src/app/api/cron/asistente-proactivo/route.ts`.
10. `el-asistente-no-inventa-plata.test.ts`: hay un importe escrito a mano en un texto del asistente o de
    la voz. Sacalo.
11. `devolucion-1344-orden-205.test.ts`: `filtrarPorEstacion` del buzón devuelve de menos. Revisá
    `src/app/(app)/settings/feedback/page.tsx`.
12. `pwa-instalacion-respuesta-real.test.tsx`: el botón de instalar ya no respeta "se instaló aunque
    cerró el cartel". Revisá `src/components/pwa-install-button.tsx` contra esa prueba.
13. `auditoria-puertas-abiertas.test.ts`: `getCrowdSyncStateAction` es nueva y se llama desde internet.
    Si es para el celular del invitado está bien: anotala en la lista de públicas a propósito con el
    motivo ("el invitado lee el color de la pista; no devuelve datos personales").
14. `api-route-boundary.test.ts`: falta clasificar la ruta nueva `/api/asistente/voz-en-vivo/cliente`
    (es del portal del cliente).
15. `mapa-de-la-app-al-dia.test.ts`: corré `npm run mapa:generar` y subí el mapa.

## Bloque 4 — Lo que dejó marcado la puerta

- `src/app/actions/games.actions.ts` ~línea 370: `saveFiesta()` devuelve el error y nadie lo mira. Si
  falla, que la trivia diga que no se guardó.
- `src/app/actions/crowd-sync.ts`: `setCrowdSyncStateAction` lee y reescribe el archivo entero sin turno.
  Usá `mutateGenericJsonArray` o la forma con turno que ya usa la app para archivos de un solo documento.
  Sumá una prueba que la nombre: el personal sin permiso de la noche no la cambia, y el operador sí.
- `src/app/(app)/settings/agentes-autonomos/page.tsx`: necesita una prueba que mire el resultado.
- `tests/e2e/iphone-ve-como-instalar.spec.ts`: hoy sólo mira que la pantalla se vea. Que compruebe los
  pasos de instalación en iPhone (el texto de "Compartir" y "Agregar a inicio").
- `src/app/api/asistente/voz-en-vivo/cliente/route.ts`: el día se cuenta con
  `new Date().toISOString()`, que es la hora de Greenwich. Usá `hoyEnUruguay()` de `@/lib/utils`.

## Bloque 6 — El recordatorio a los invitados que no abrieron (Codex 249-250, orden 217: R2, R3 y R4)

El R1 (que se disparaba sin clave) ya lo arregló Claude. Faltan tres, todos en
`src/lib/invitaciones/recordatorio-no-abiertas.ts` (`correrTareaRecordarInvitacionNoAbierta`) y su ruta
`src/app/api/cron/recordar-invitacion-no-abierta/route.ts`. Leé el detalle en
`docs/ordenes/217-recordatorios-autorizacion-fecha-y-fallos.md`.

- **R2, la fecha reprogramada:** adentro de la reserva (el `actualizarFiesta` que anota a quién se le
  manda), volvé a calcular los días con la fecha de la fiesta de ESE momento. Usá
  `diasHastaEnUruguay` de `@/lib/utils` y una función nueva `tocaRecordarHoy(fechaEvento, ahora)`, que
  dice si cae en la ventana de 21 o de 10 días. Si ya no toca, no se reserva ni se manda.
- **R3, envío y respaldo fallidos:** si el proveedor rechazó (error conocido) y el respaldo tampoco se
  guardó, el día reservado se libera para que la próxima corrida lo reintente. Usá
  `liberarReservaDelDia`. Si el resultado es incierto (no hubo respuesta), NO se reintenta: queda
  marcado `revisarEnvio: true` para que lo mire una persona.
- **R4, la reserva fallida:** si el `actualizarFiesta` de la reserva falla, el motor devuelve
  `reservasFallidas` > 0 y `corrio: false`. La ruta no llama a `marcarCorrida` en ese caso.
- **No toques:** la puerta (`puerta-de-las-tareas.ts`), el envío afuera de la transacción, el antiduplos
  y los teléfonos guardados.
- **Prueba:** sumá los casos al archivo de Claude `src/__tests__/recordatorio-no-abiertas-origen-reserva-y-fallo.test.ts`,
  con el motor de verdad y la base de mentira que devuelve copias.
  - Fecha cambiada a 2 meses entre la lista y la reserva → 0 envíos.
  - 403 del proveedor y respaldo fallido → la segunda corrida del mismo día lo reintenta (2 intentos).
  - Sin respuesta del proveedor → 1 intento y `revisarEnvio`.
  - Reserva fallida → `marcarCorrida` no se llama.

## Qué NO tocar

Cobros, presupuestos, el ajuste anual y las reglas de personal (`personal-por-invitados.ts`).

```comprobar
usa: tocaRecordarHoy en src/lib/invitaciones/recordatorio-no-abiertas.ts
usa: liberarReservaDelDia en src/lib/invitaciones/recordatorio-no-abiertas.ts
usa: reservasFallidas en src/app/api/cron/recordar-invitacion-no-abierta/route.ts
usa: avisosProactivosActivos en src/lib/asistente/avisar-al-duenio.ts
# Bloque 3 — Las 23 pruebas que fallan
prueba: src/__tests__/la-fiesta-llega-con-la-plata-de-cada-perfil.test.ts
usa: hoyEnUruguay en src/app/api/asistente/voz-en-vivo/cliente/route.ts
usa: mutarCostosInterno en src/app/actions/fiesta/decoracion.actions.ts
no-usa: updateGestionCostosInterno en src/lib/fiesta/costos-interno.ts
prueba: src/__tests__/la-bandeja-pide-permiso.test.ts
prueba: src/__tests__/crowd-sync-quien-la-cambia.test.ts
```
