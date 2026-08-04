# Reglas para Git y GitHub CLI en Windows (Claude y Agentes AI)

Para que Claude o cualquier agente AI cree y suba ramas y Pull Requests (PRs) correctamente en Windows sin errores:

1. **Sintaxis de Comandos en PowerShell**:
   - NUNCA encadenar comandos con `&&` (ej. `git add . && git commit`). En PowerShell `&&` da error de sintaxis.
   - Usar punto y coma `;` o ejecutar los comandos en llamadas separadas:
     ```powershell
     git add . ; git commit -m "fix: descripcion" ; git push origin nombre-rama
     ```

2. **Creación de Ramas e Independencia de PRs**:
   - Para CADA nueva corrección o tarea, crear SIEMPRE una rama nueva basada en `main` actualizado:
     ```powershell
     git fetch origin main ; git checkout main ; git reset --hard origin/main
     git checkout -b fix/nombre-descriptivo
     ```
   - NUNCA pushear ni hacer commit directo sobre `main`.
   - NUNCA reusar ramas cuyo PR ya fue mergeado o cerrado en GitHub.

3. **Creación de Pull Requests (PR)**:
   - Crear la PR con GitHub CLI (`gh`):
     ```powershell
     gh pr create --title "fix: titulo corto" --body "descripcion de los cambios" --base main --head fix/nombre-descriptivo
     ```
   - NUNCA hacer merge (automerge) automático de la PR. Dejar la PR abierta para que el usuario la revise y fusione manualmente en GitHub.
