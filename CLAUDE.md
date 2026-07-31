## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- Follow the shared quality commands and testing rules in `AGENTS.md`.

## Delegación de trabajo (preferencia del dueño del proyecto)

Ahorrar tokens siempre. El modelo principal actúa como **director**, no como peón:

- Delegá las tareas mecánicas y de sólo lectura a agentes con modelos económicos
  (`model: haiku`): auditorías, inventarios, conteos, búsquedas amplias, verificación
  de enlaces, lectura de archivos largos para extraer datos.
- Lanzalos en paralelo y en segundo plano (`run_in_background: true`) cuando no
  dependan entre sí.
- El modelo principal se reserva para: decidir qué se toca y qué no, editar código,
  resolver ambigüedad, evaluar riesgo de regresión y redactar el reporte final.
- Pedile a cada agente hechos verificables con `archivo:línea`, y que NO modifique
  archivos salvo que se le indique explícitamente.

### Presupuesto de tokens

El dueño trabaja con plan Pro y necesita que el consumo rinda. Administrar siempre:

- Leer sólo los rangos de línea necesarios, no archivos enteros.
- No re-leer un archivo ya editado para verificarlo: si `Edit` no falló, el cambio se aplicó.
- Agrupar comandos de shell independientes en una sola llamada.
- Filtrar la salida de comandos largos (`| tail -15`) en vez de volcarla completa.
- Respuestas al usuario: directas y sin relleno.
