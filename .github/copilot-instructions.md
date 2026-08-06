# Copilot Instructions

When assisting developers in this repository:
0. **Read `ESTADO-ACTUAL.md` first.** It is the short handoff note shared by every
   AI working on this repo (Codex, Gemini, Claude): current task, current branch,
   what is unfinished. Rewrite it when you finish a batch. `ESTADO-AUDITORIA.md`
   is the long history — open it only when you need something old.
1. **Always refer to the Graphify knowledge graph** located at `graphify-out/graph.json` and `graphify-out/GRAPH_REPORT.md` to understand codebase structure and dependencies.
2. **Follow the master rules** defined in `AGENTS.md` and `AI_WORKFLOW.md`.
3. Ensure all code modifications preserve type-safety and format standards.
4. Avoid introducing breaking changes in Firebase Server Actions.
5. Use the shared commands documented in `AGENTS.md`; add Playwright or Firebase Rules coverage when changing those surfaces.
6. Treat Knip output as advisory because Next.js routes and Firebase integrations may be referenced dynamically.
