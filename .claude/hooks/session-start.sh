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

  # El Chromium de la imagen viene con numero de version en la ruta, asi que se
  # ubica solo. Sin esto, cada sesion pierde pasos buscandolo a mano.
  CHROME_BIN=$(find /opt/pw-browsers -maxdepth 3 -name chrome -type f 2>/dev/null | head -1)
  if [ -n "$CHROME_BIN" ]; then
    echo "export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='$CHROME_BIN'" >> "$CLAUDE_ENV_FILE"
  fi
fi

echo "Entorno listo: dependencias, graphify y mapa del codigo."

# --- Traspaso entre chats ----------------------------------------------------
# La hoja corta de "aca quede". Se imprime entera para que la sesion arranque
# sabiendo en que se estaba trabajando, sin que el dueno tenga que contarlo.
if [ -f ESTADO-ACTUAL.md ]; then
  echo ""
  echo "----- ESTADO-ACTUAL.md (traspaso del ultimo chat) -----"
  head -60 ESTADO-ACTUAL.md
  echo "----- fin del traspaso -----"
  echo "Al cerrar la sesion, reescribi ESTADO-ACTUAL.md con el comando /aca-quede."
fi
