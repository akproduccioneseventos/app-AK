# Instrucciones para Gemini (Antigravity)

## TU TRABAJO DE HOY (lo actualiza Claude; leelo primero, siempre)

**Actualizado el 13/11/2026 (tarde).** El dueño no te va a pasar mensajes: lo que tenés que hacer está acá.

- **Primero, lo urgente:** tu entrega 1393 **no se publicó**: rompe la ficha de la fiesta (orden 298, bloque 9).
  Seguí en tu rama `gemini/ordenes-282-283-entrega-completa`, fusioná `origin/claude/app-debug-stabilize-m70e6z`
  (trae los arreglos de Claude sobre tu entrega) y `origin/main`.
- **Qué hacer, en esa misma propuesta (la 1393):** arreglar la ficha, y las órdenes **297** (textos de la web), **298**
  (la edición sola, con los bloques 7 a 9 de pruebas devueltas) **299** (el auditor prueba cada papel) y **300** (textos de la app por dentro) y **301** (la contabilidad dice lo que cuenta) y **302** (entretenimiento y pantallas de la noche; el bloque 1 es de permisos, primero) y **303** (catálogo, fiestas pasadas y portal sin sesión; bloques 1 y 2 primero) y **304** (Sofía y el asistente del equipo: las respuestas que no se ven, primero).
- **Antes de decir "terminé":** `docs/ANTES-DE-ENTREGAR.md`, preguntas 88 a 107.
- **Cuando termines:** subí a tu rama; la propuesta 1393 ya está abierta. Cambiale el título a "Gemini: órdenes 284 a 304".
- **Cuando aparezca una orden nueva acá**, arrancá una rama nueva desde `origin/main` actualizado.
- Lo que Claude corrigió de tu entrega, para no repetirlo: el guardado de a un registro tiene que **borrar en la base**
  los campos que el cambio saca del registro, no sólo los que pone en `undefined`. Está en `docs/YA-RESUELTO.md` (13/11).

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
