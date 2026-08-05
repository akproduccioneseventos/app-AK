#!/bin/bash
# Deja la sesion lista para trabajar: dependencias del proyecto, graphify y el
# mapa del codigo. Sin esto, cada sesion nueva arranca con la maquina vacia y
# se pierden los primeros minutos preparando la mesa.
set -euo pipefail

# Solo en las sesiones remotas (Claude Code en la web). En una maquina local el
# entorno ya esta armado y no hace falta tocar nada.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"

# --- Dependencias de la aplicacion -----------------------------------------
# `npm install` en vez de `npm ci`: reutiliza lo ya bajado cuando el contenedor
# viene cacheado, en vez de borrar node_modules y empezar de cero.
if [ ! -d node_modules ] || [ ! -f node_modules/.package-lock.json ]; then
  npm install --no-audit --no-fund
fi

# --- graphify ---------------------------------------------------------------
# El mapa del codigo. `uv` ya viene en el contenedor.
export PATH="$HOME/.local/bin:$PATH"
if ! command -v graphify >/dev/null 2>&1; then
  uv tool install graphifyy >/dev/null 2>&1 || true
fi

# graphify-out/ esta en .gitignore, asi que el mapa no viaja con el repo y hay
# que rearmarlo en cada contenedor nuevo. Es extraccion AST, no gasta API.
if command -v graphify >/dev/null 2>&1 && [ ! -f graphify-out/graph.json ]; then
  graphify update . >/dev/null 2>&1 || true
fi

# --- Variables para el resto de la sesion -----------------------------------
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$CLAUDE_ENV_FILE"
  # Playwright: el binario ya esta en la imagen. Nunca correr `playwright install`.
  echo 'export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1' >> "$CLAUDE_ENV_FILE"
fi

echo "Entorno listo: dependencias, graphify y mapa del codigo."
