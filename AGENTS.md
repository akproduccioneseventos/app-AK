## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## AK expert skills

All Codex chats working on this project must use the AK expert skills when available.

Required skill routing:
- Use `ak-expertos-produccion` for AK Producciones product work: programming, PR review, launch readiness, marketing, sales, simulator, client/invited experiences, entertainment modules, accounting, payments, budgets, and business-quality finishing.
- Use only the expert reference needed for the task: programming, finalizacion/publicacion, marketing, ventas/simulador, experiencia clientes/invitados, or contable/negocio.
- Use `ak-codebase-navigator` for code navigation, architecture questions, PR fixes, audits, and token-efficient investigation.

Required working order for code tasks:
1. Load the relevant AK expert reference.
2. Use Graphify for the first scoped map of the module or bug.
3. Use Serena symbol/reference tools when available.
4. Use `rg` for exact text searches.
5. Read only focused file ranges.
6. Edit only the necessary files.
7. Validate with the best available tests/checks.
8. Run `graphify update .` after meaningful code changes.

These skills are local Codex production tools. They must not be imported into application runtime code, added as app dependencies, or exposed to clients, guests, or Firebase.

## Herramientas Locales de Programación (Codex)

Todos los agentes y chats de este proyecto deben utilizar las siguientes herramientas de trabajo configuradas en el entorno local para agilizar el desarrollo sin complicar el código ni el despliegue de la app:
- **Graphify**: Genera un mapa general de toda la aplicación y analiza relaciones entre archivos.
- **Serena**: Búsqueda inteligente por funciones, componentes y referencias cruzadas.
- **Repomix**: Mide qué archivos consumen más tokens para evitar procesar archivos gigantes de forma innecesaria.

Estas herramientas son de uso local exclusivo para el análisis del código. No deben agregarse al `package.json`, no deben cambiar el comportamiento del sitio web, no deben desplegarse a Firebase y son invisibles para los clientes e invitados.

## Shared quality commands

These commands are the same for Codex, Gemini, Copilot, Claude, and human contributors:

- `npm run quality:quick`: lint and TypeScript checks for normal edits.
- `npm run quality:full`: quick checks and Jest without external emulators.
- `npm run quality:security`: Firestore security rules through the local emulator.
- `npm run test:e2e`: Chromium smoke tests for desktop and mobile.
- `npm run quality:all`: full validation including browser tests.
- `npm run audit:dead-code`: advisory Knip report; do not delete reported code without verifying dynamic Next.js and Firebase usage.

Rules:
- Add or update Playwright coverage when changing a critical public workflow.
- Add or update Firebase Rules tests when changing `firestore.rules`.
- Do not make Knip findings a blocking CI check until the existing baseline has been reviewed.
- Keep test tools in devDependencies; they must not be imported by production application code.

## Directivas de Comunicación y Calidad para IAs

- **Perfil del Usuario (No Programador)**: El usuario **no es programador**. Todos los planes de implementación, explicaciones y respuestas deben estar redactados en un lenguaje sumamente sencillo, directo, claro y libre de tecnicismos complejos de bajo nivel.
- **Prohibido Alucinar**: Queda estrictamente prohibido alucinar o inventar código, variables, APIs, archivos, rutas o dependencias que no existan. Si no tenés certeza absoluta sobre algo, debés investigarlo en el código o consultarlo. Todo lo programado debe ser 100% real y funcional.
- **Uso Obligatorio de Graphify**: Antes de iniciar cualquier tarea o responder sobre la arquitectura del código, debés usar `graphify` para mapear el codebase y entender perfectamente las relaciones entre archivos para evitar roturas.
- **Verificación de PR Abierta (OBLIGATORIO)**: Antes de empezar una tarea, crear una rama o subir commits, es obligatorio verificar en GitHub qué Pull Requests están abiertas y sus estados. Si la PR de la rama actual ya fue cerrada, archivada o fusionada, **está estrictamente prohibido seguir subiendo cambios a esa rama**. En su lugar, debés sincronizarte localmente con `main` actualizado, crear una rama nueva y limpia, y generar una nueva PR abierta para la tarea actual, asegurando así un despliegue limpio sin mezclar código viejo.
- **Prohibido Fusionar PRs**: Las IA tienen estrictamente prohibido fusionar (mergear) Pull Requests por sí solas. Deben crear la PR en GitHub y dejarla abierta para que el usuario la revise y fusione a mano.
- **Honestidad Absoluta (0 Humo)**: El título y la descripción de las PRs y de los commits deben describir **únicamente los cambios reales y precisos** que hiciste. No prometas mejoras estéticas, rediseños premium ni optimizaciones que no estén implementadas concretamente. Cero promesas que no sean reales.
## Direccion multiagente obligatoria

Aplicar en todos los chats y tareas, salvo que el usuario pida expresamente otra cosa:

1. El modelo principal actua como director: define alcance, arquitectura, riesgos y criterio final.
2. Delegar por defecto las tareas separables y de bajo riesgo a `gpt-5.6-luna` con razonamiento `low`.
3. Usar agentes economicos para busquedas, lectura de diffs, inventarios, UX repetitiva, copy,
   pruebas focalizadas y revision visual. Ejecutarlos en paralelo cuando sus archivos no se solapen.
4. El modelo principal conserva autenticacion, seguridad, dinero, contabilidad, datos, Firebase,
   despliegue, conflictos, decisiones de merge y aprobacion final de PR.
5. No repetir localmente el trabajo delegado. Revisar solo el resultado, los archivos cambiados y
   los hallazgos P0/P1 antes de integrarlos.
6. Cerrar los agentes al terminar para no ocupar cupos. Reutilizar evidencia asociada al mismo SHA.
7. Si multiagente no esta disponible, seguir el flujo de bajo consumo sin inventar resultados.
8. La delegacion ahorra tiempo y tokens, pero nunca reemplaza la validacion final del modelo principal.
