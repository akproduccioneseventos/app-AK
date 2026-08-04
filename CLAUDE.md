## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Install (once per environment; `uv` is already present):

```
uv tool install graphifyy
```

That provides the `graphify` command used below. Without it every lookup falls
back to raw grep, which is slower and burns far more context.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- Follow the shared quality commands and testing rules in `AGENTS.md`.

## Entorno de Ejecución (Windows PowerShell & GitHub PRs)

- **Sistema Operativo**: Windows con **PowerShell** (NO es Linux/Bash).
- **Prohibido el uso de `&&`**: En PowerShell `&&` produce error de sintaxis (`El token '&&' no es un separador de instrucciones válido`). Usar `;` o comandos independientes.
- **Flujo de Git & GitHub CLI (`gh`)**:
  - **Sincronización antes de trabajar**: Ejecutar `git fetch origin main ; git checkout main ; git reset --hard origin/main` para asegurar base limpia.
  - **Ramas independientes**: Crear SIEMPRE una rama nueva (`git checkout -b fix/nombre-descriptivo`) para cada tarea. NUNCA trabajar sobre ramas con PRs ya mergeadas.
  - **Crear PR (Sin Automerge)**: Subir la rama (`git push origin fix/nombre-descriptivo`) e invocar `gh pr create --title "..." --body "..." --base main`. Dejar la PR abierta para revisión manual del usuario.

## Atajos del entorno (ahorran tiempo y contexto)

Verificado en este contenedor; releer antes de pelear con las herramientas:

- **Pruebas de navegador**: usar `npm run test:e2e:production`. El `webServer` por
  defecto levanta `next dev`, que recompila cada ruta al visitarla (1-2 minutos
  por corrida) y a veces se queda sin memoria. La versión compilada responde al
  instante.
- **Chromium**: la versión que espera Playwright puede no coincidir con la
  instalada. El binario disponible se ubica con
  `find /opt/pw-browsers -maxdepth 3 -name chrome` y se pasa por
  `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Nunca ejecutar `playwright install`.
- **Sesión interna en pruebas**: las rutas del staff piden cookie `ak_session`
  firmada con `AK_SESSION_SECRET`. El valor de prueba está en `playwright.config.ts`
  y el patrón para generarla, en `tests/e2e/internal-smoke.spec.ts`. Ojo: el
  middleware sólo comprueba que la cookie exista; la firma la valida `AuthGuard`
  en el cliente, así que un secreto mal configurado se manifiesta como una
  redirección a `/login` recién después de cargar la página.
- **Datos locales**: con `AK_USE_LOCAL_JSON_ONLY=true` sólo hay fiestas
  históricas (`src/data/fiestas-historicas.json`). Las fiestas activas viven en
  la base, así que las pantallas por `[id]` muestran su estado de "no encontrada".

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

### El dueño NO es programador

Regla principal: **resolver, no delegar en el usuario.**

- No le pidas que corra comandos, aplique parches, edite archivos ni configure nada.
  Si algo hay que hacer, hacelo vos. Si de verdad no se puede, decí en una linea qué
  está bloqueado y por qué, sin instrucciones técnicas.
- Escribí siempre en castellano rioplatense simple. Nada de jerga sin traducir:
  no "hydration", "cascada CSS", "rate limit", "specificity", "blob SHA".
  Decí qué le pasa AL USUARIO en pantalla y qué cambia para su negocio.
- Nada de bloques de comandos ni rutas de archivo en la respuesta salvo que los pida.
- Antes de mandar una respuesta, releerla y sacar todo lo que él no podría entender.

### No hablar de credenciales

El dueño ya decidió: los accesos se usan en produccion y los revoca el mismo
cuando termina. NO mencionar tokens, claves, permisos ni facturacion de GitHub
en las respuestas. Tampoco recordarle que los borre. Usar lo que haya y seguir.

### Presupuesto de tokens

El dueño trabaja con plan Pro y necesita que el consumo rinda. Administrar siempre:

- Leer sólo los rangos de línea necesarios, no archivos enteros.
- No re-leer un archivo ya editado para verificarlo: si `Edit` no falló, el cambio se aplicó.
- Agrupar comandos de shell independientes en una sola llamada.
- Filtrar la salida de comandos largos (`| tail -15`) en vez de volcarla completa.
- Respuestas al usuario: directas y sin relleno.
