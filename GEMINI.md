# Instrucciones para Gemini (Antigravity)

## TU TRABAJO DE HOY (lo actualiza Claude; leelo primero, siempre)

**Actualizado el 13/11/2026.** El dueño no te va a pasar mensajes: lo que tenés que hacer está acá.

- **Rama:** seguí en `gemini/ordenes-282-283-entrega-completa`. Antes de tocar nada, traé lo último de
  `origin/main` (`git fetch origin main` y fusionalo en tu rama).
- **Qué hacer:** las órdenes **284 a 296** de `docs/ordenes/`, en **una sola propuesta**, sin fusionar.
  En la 291, el bloque 3 ya lo hizo Claude: no lo toques.
- **Antes de decir "terminé":** repasá `docs/ANTES-DE-ENTREGAR.md`, preguntas 88 a 106, sobre lo que tocaste.
- **Si un bloque se traba:** entregá el resto igual, en la misma propuesta, y escribí cuál faltó y por qué.
- **Cuando termines:** abrí la propuesta contra `main` con el título "Gemini: órdenes 284 a 296". Claude la
  revisa y la fusiona.


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
