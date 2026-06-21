# Flujo de Trabajo con Inteligencia Artificial (AK Producciones)

Este documento explica cómo utilizar las herramientas de IA (Antigravity, Codex) instaladas en este proyecto para programar de forma más segura y eficiente, así como el funcionamiento de la integración con GitHub y Firebase.

---

## 1. Mapeo del Proyecto con Graphify

Para que los asistentes de IA no cometan errores al modificar código (especialmente al trabajar con dependencias en este proyecto grande de +1000 archivos), utilizamos **Graphify**.

### Cómo actualizar el Grafo de Conocimiento
Cada vez que agregues nuevas funciones, componentes o archivos importantes, debes actualizar el grafo local ejecutando en tu terminal:
```bash
npm run graphify:update
```
Esto regenerará de forma local y gratuita:
* `graphify-out/graph.json`: Estructura técnica de la base de código.
* `graphify-out/GRAPH_REPORT.md`: Reporte modular y comunidades detectadas.

*Nota: La carpeta `graphify-out/` está ignorada en `.gitignore` para no sobrecargar el repositorio de GitHub.*

---

## 2. Asistentes Configurados

* **Antigravity (Gemini)**: Utiliza `.agents/rules/graphify.md` para guiarse al resolver tareas complejas.
* **Codex**: Lee las instrucciones de `AGENTS.md` y los hooks de `.codex/hooks.json` para alinear sus propuestas al contexto de tu arquitectura.
* **Claude**: Emplea `CLAUDE.md` y `.claude/settings.json` si ejecutas Claude CLI en esta carpeta.

---

## 3. Integración Continua (CI/CD) y Despliegues en Firebase

Toda la automatización se gestiona mediante GitHub Actions:

### Validación Automática (CI)
Al subir código o abrir un Pull Request (PR) en GitHub:
1. Se ejecuta automáticamente `npm run lint` y `npm run typecheck` para asegurar que no haya errores de formato o tipado.
2. Se corren las pruebas unitarias mediante `npm test`.

### Despliegue de Vistas Previas (Preview Channels)
* **En Pull Requests**: GitHub Actions creará una URL temporal única de Firebase Hosting para el PR y dejará un comentario con el enlace. Esto te permite testear la versión modificada en vivo antes de fusionarla.
* **Al unir a Main**: El código verificado se compilará y desplegará automáticamente al canal de producción oficial (`live`).
