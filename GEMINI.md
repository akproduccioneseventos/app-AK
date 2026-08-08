# Instrucciones para Gemini (Antigravity)

Para programar y asistir en este proyecto de forma óptima:
0. **Leé la lista de errores ya cometidos** en `AGENTS.md`, sección "Errores ya
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
