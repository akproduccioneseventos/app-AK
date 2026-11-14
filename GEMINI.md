# Instrucciones para Gemini (Antigravity)

## TU TRABAJO DE HOY (lo actualiza Claude; leelo primero, siempre)

**Actualizado el 14/11/2026.** El dueño no te va a pasar mensajes: lo que tenés que hacer está acá.

- **Publicadas:** tus entregas 1408 (órdenes 299 a 302) y 1413 (orden 303). Claude resolvió los choques: el control de sesión del
  portal quedó en `src/lib/portal/el-portal-pide-sesion.ts` (no lo toques).
- **Devuelta: la 1406 (órdenes 284 a 298).** Con ella puesta fallan, en la corrida completa:
  1. `tests/e2e/la-app-ordenada.spec.ts` (celular y escritorio): **la ficha de la fiesta sigue sin las 5 pestañas** (orden 298, bloque 9). Era lo urgente y no se arregló.
  2. `tests/e2e/la-portada-nueva.spec.ts`.
  3. `tests/e2e/el-catalogo-lleva-lo-elegido-al-simulador.spec.ts`.
  4. `tests/e2e/81-roles-y-pedidos-sin-duplicados.spec.ts` (dos toques generan un solo pedido).
  5. `tests/e2e/presupuestos-abre-rapido.spec.ts` sigue fallando en la línea 47 (segunda vez).
  Además, el `public/descargas/ak-editor.zip` no estaba rearmado: corré `npm run editor:empaquetar` cuando toques el editor.
- **Qué hacer:** en tu rama `gemini/ordenes-297-298`, fusioná `origin/main` y arreglá esos cinco. Corré cada prueba sola antes de
  entregar (`npx playwright test <archivo>`). Después, en la **misma** propuesta: órdenes **304** (Sofía y el asistente), **305** (cada fiesta
  se cuenta una vez), **306** (buscador) y **307** (el modo Fotos edita como Aftershoot), y **308** (lo que encontró la reauditoría).
- **Lo primero, en la computadora del dueño (pedido del dueño, 14/11):**
  1. **Borrar las dos fiestas de Lorena Ferreira** (`fiesta_doc_lorena_ferreira_2026_05_30` y `fiesta_verified_lorena_ferreira_2026_12_12`): se suspendió.
     Si alguna tiene seña o cuotas cobradas, **no la borres**: dejá anotado en tu entrega cuánto y avisá. No le mandes nada a la clienta.
  2. **Desplegar el despertador de las tareas automáticas** (`firebase deploy --only functions:despertadorTareasAutomaticas`): la pantalla dice
     que nunca tocó la puerta. Después, la orden 278 bloque 1 (la clave), en el orden que dice ahí.
  3. La fiesta de Soraya Texeira es la del **21/8/2027**; la copia del 4/3/2028 es vieja (la saca la orden 305).
- **Devuelta también la 1417 (órdenes 304 a 306), 14/11:** con ella puesta falla
  `tests/e2e/orden-255-plan-real-bandeja.spec.ts` (en el Centro de Control, aprobar el plan; antes pasaba en la versión principal, ya
  se comprobó). También `tests/e2e/el-menu-lleva-a-elegir-fiesta.spec.ts` no encuentra el enlace (nunca se corrió), y la entrega subía
  datos de corrida (`data/notifications.json`, `data/asistente-historial-aceptaciones.json`, `src/data/notifications.json`): no se suben nunca.
  Arreglalo en la misma rama, corré esas dos pruebas solas, y juntá todo con la 1406 en **una** propuesta.
- **Devuelta la 1419 (orden 308), 14/11.** Claude dejó tu entrega revisada en la rama `claude/orden-308-revisada`
  (arrancá de ahí): cerró que el personal y el operador vieran el contrato y los pagos del cliente (`puedeVerLaPlataDelCliente`, no lo
  saques) y la espera de Presupuestos. Falta:
  1. Con la entrega puesta falla `tests/e2e/orden-255-plan-real-bandeja.spec.ts` (aprobar el plan en el Centro de Control); en la
     versión principal pasa. Lo mismo pasó con la 1417: buscá qué tienen en común.
  2. Las dos pruebas del auditor caen al ingreso: `ponerSesionDeAuditor` no deja una sesión válida. Probalas solas.
  3. El cambio de `src/app/(app)/settings/datos/page.tsx` vuelve con su prueba.
- **Una sola propuesta.** No abras una por orden: cada fusión se paga.
- **Antes de decir "terminé":** `docs/ANTES-DE-ENTREGAR.md`, preguntas 88 a 118.

Para programar y asistir en este proyecto de forma óptima:
0. **Si vas a auditar, leé antes `docs/YA-RESUELTO.md`**: es lo que ya está
   arreglado y las decisiones tomadas del dueño. Si un hallazgo tuyo figura ahí,
   es falso positivo.
0aa. **SIEMPRE propuestas grandes, nunca muchas chicas.** Orden del dueño del 9
   de agosto de 2026: cada fusión dispara un despliegue y eso se paga. Juntá todo
   el trabajo de la tanda en UNA propuesta y fusionala una vez, al final. Si una
   orden de trabajo te pide varios bloques, **podés entregarlos juntos en una
   sola propuesta**: eso es preferible a abrir una por bloque. Y cuanto más
   grande, más importa correr los cuatro controles sobre el conjunto entero antes
   de subir.
0a. **ANOTÁ SIEMPRE lo que modificás en `docs/YA-RESUELTO.md`, en la misma
   propuesta.** Orden del dueño del 9 de agosto de 2026: no es opcional ni
   depende del tamaño del cambio. Se anotan los arreglos (qué estaba mal y qué
   hiciste), las mejoras y lo nuevo (cómo funciona y **por qué lo elegiste
   así**) y los falsos positivos que descartaste (con el motivo). Una propuesta
   que toca código y no toca esa lista está incompleta: es la única memoria
   compartida entre las tres IA.
0b. **Leé la lista de errores ya cometidos** en `AGENTS.md`, sección "Errores ya
   cometidos". Son diez cosas que salieron mal de verdad en este proyecto y cada
   una costó tiempo, plata o una propuesta entera a la basura. Dos te tocan
   especialmente: los **acentos rotos** (guardá siempre en UTF-8) y las
   **comillas invertidas borradas** de los textos armados, que ya rompieron el
   proyecto tres veces seguidas.
1. **Antes que nada, leé `ESTADO-ACTUAL.md`**: es la hoja de traspaso entre chats
   (corta, máximo 40 líneas) y dice en qué se está trabajando, en qué rama y qué
   quedó a medias. Al terminar tu tanda, reescribila. El histórico largo está en
   `ESTADO-AUDITORIA.md` y sólo se abre si hace falta buscar algo viejo.
   Recordá que este proyecto lo programan Codex, Gemini y Claude en paralelo:
   cada tarea va en una rama nueva desde `main` actualizado.
2. **Siempre consulta el grafo de conocimiento** en `graphify-out/graph.json` y el reporte `graphify-out/GRAPH_REPORT.md` antes de realizar cambios estructurales o responder preguntas complejas de arquitectura.
3. **Lee las directrices principales** en `AGENTS.md`.
4. **Respeta las reglas de calidad**:
   - Asegúrate de que el código compile ejecutando `npm run typecheck`.
   - Verifica el formato con `npm run lint`.
5. **Si haces cambios estructurales**, recuerda actualizar el grafo usando `npm run graphify:update`.
6. **Usa los mismos controles que el resto de las IA**:
   - `npm run quality:quick` para cambios normales.
   - `npm run quality:full` si modificas logica o datos.
   - `npm run quality:security` si modificas Firebase o sus reglas.
   - `npm run test:e2e` si cambias flujos visibles o navegacion.
   - `npm run audit:dead-code` solo como auditoria; nunca borres codigo automaticamente por un reporte de Knip.
