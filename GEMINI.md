# Instrucciones para Gemini (Antigravity)

Para programar y asistir en este proyecto de forma óptima:
1. **Siempre consulta el grafo de conocimiento** en `graphify-out/graph.json` y el reporte `graphify-out/GRAPH_REPORT.md` antes de realizar cambios estructurales o responder preguntas complejas de arquitectura.
2. **Lee las directrices principales** en `AGENTS.md`.
3. **Respeta las reglas de calidad**:
   - Asegúrate de que el código compile ejecutando `npm run typecheck`.
   - Verifica el formato con `npm run lint`.
4. **Si haces cambios estructurales**, recuerda actualizar el grafo usando `npm run graphify:update`.
5. **Usa los mismos controles que el resto de las IA**:
   - `npm run quality:quick` para cambios normales.
   - `npm run quality:full` si modificas logica o datos.
   - `npm run quality:security` si modificas Firebase o sus reglas.
   - `npm run test:e2e` si cambias flujos visibles o navegacion.
   - `npm run audit:dead-code` solo como auditoria; nunca borres codigo automaticamente por un reporte de Knip.
