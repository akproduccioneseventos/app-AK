# Copilot Instructions

When assisting developers in this repository:
0. **Before auditing anything, read `docs/YA-RESUELTO.md`** — what is already
   fixed and the owner's settled decisions. If a finding appears there, it is a
   false positive. When you fix something new, add it to that list.
0b. **Read the "Errores ya cometidos" section in `AGENTS.md` before starting.** Ten
   things that actually went wrong in this project, each one costing time, money
   or a whole pull request thrown away.
1. **Read `ESTADO-ACTUAL.md` first.** It is the short handoff note shared by every
   AI working on this repo (Codex, Gemini, Claude): current task, current branch,
   what is unfinished. Rewrite it when you finish a batch. `ESTADO-AUDITORIA.md`
   is the long history — open it only when you need something old.
2. **Always refer to the Graphify knowledge graph** located at `graphify-out/graph.json` and `graphify-out/GRAPH_REPORT.md` to understand codebase structure and dependencies.
3. **Follow the master rules** defined in `AGENTS.md` and `AI_WORKFLOW.md`.
4. Ensure all code modifications preserve type-safety and format standards.
5. Avoid introducing breaking changes in Firebase Server Actions.
6. Use the shared commands documented in `AGENTS.md`; add Playwright or Firebase Rules coverage when changing those surfaces.
7. Treat Knip output as advisory because Next.js routes and Firebase integrations may be referenced dynamically.
