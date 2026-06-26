## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

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

## Pull Requests y Despliegues

- **Prohibido Fusionar PRs**: Las IA tienen estrictamente prohibido fusionar (mergear) Pull Requests por sí solas. Deben limitarse a crear la Pull Request en GitHub y dejarla abierta para que sea el usuario o el flujo de despliegue quien la revise, la fusione y la despliegue.
- **Control de Pull Requests**: Siempre revisá si la PR de la rama en la que estás trabajando sigue abierta en GitHub. Si la PR ya fue cerrada o fusionada (merged), **nunca** subas cambios nuevos a esa rama. Creá una rama nueva desde main y abrí una PR nueva para evitar mezclar cambios en PRs cerradas.
