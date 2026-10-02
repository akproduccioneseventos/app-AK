# Cómo revisa Codex, para que la revisión tenga un final

Desde el 2 de octubre de 2026 la revisión se hace **por áreas** (`docs/codex/areas.json`), no
recorriendo la app al azar.

1. **Una área por vez**, sobre la versión principal de ese momento. Anotar el commit.
2. **Se revisa entera** con `docs/COMO-AUDITAR.md` y `docs/ANTES-DE-ENTREGAR.md`.
3. **Se reporta en este formato**, y nada más:
   - Área: `<id>` · Commit: `<sha>`
   - Hallazgos: ninguno — o la lista, cada uno con archivo, qué ve el usuario y cómo se reproduce.
4. **Cero hallazgos** → Claude marca el área `limpia` con ese commit.
   **Con hallazgos** → `con-hallazgos`; Claude los arregla (o los pasa a Gemini) y Codex vuelve
   a mirar **sólo esa área**.
5. Lo que **no es un error** no cuenta como hallazgo: mejoras de lo que ya anda, decisiones del
   dueño (`CLAUDE.md`, "Decisiones del dueño") y lo anotado en `docs/YA-RESUELTO.md`. Eso se
   lista aparte como "propuestas", y no impide que el área quede limpia.
6. Un área limpia **vuelve sola** a revisarse si su código cambia (`npm run "codex?"`).

El día que las catorce áreas están limpias, `npm run "codex?"` dice
**"CODEX NO ENCUENTRA ERRORES"**.
