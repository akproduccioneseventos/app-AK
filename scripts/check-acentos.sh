#!/bin/bash
# Detecta acentos rotos ("mojibake") en el codigo.
#
# Por que existe: una propuesta de cambio reescribio 45 archivos con la
# codificacion equivocada y metio 902 acentos rotos de una. Ademas de verse mal
# en pantalla ("MenÃº", "PresentaciÃ³n"), rompe comparaciones silenciosas: el
# codigo que buscaba la palabra 'nino' con enie dejaba de encontrarla, y los
# platos de chicos pasaban a contarse como adultos.
#
# Uso:
#   scripts/check-acentos.sh              -> revisa todo el codigo versionado
#   scripts/check-acentos.sh <rama-base>  -> revisa solo lo que cambio contra esa rama
set -uo pipefail

cd "$(git rev-parse --show-toplevel)"

# Secuencias tipicas de UTF-8 leido como Latin-1. Son practicamente imposibles
# de escribir a proposito en este proyecto.
PATRON='Ã[¡©­³º±]|Â[¿¡«»°]|â€[™œ< ]'

if [ $# -ge 1 ]; then
  ARCHIVOS=$(git diff --name-only "$1"...HEAD -- '*.ts' '*.tsx' '*.js' '*.jsx' '*.json' '*.md')
  AMBITO="lo que cambio contra $1"
else
  ARCHIVOS=$(git ls-files -- '*.ts' '*.tsx' '*.js' '*.jsx')
  AMBITO="todo el codigo versionado"
fi

[ -z "$ARCHIVOS" ] && { echo "Acentos: no hay archivos para revisar ($AMBITO)."; exit 0; }

# Archivos que hablan del problema a proposito y por eso contienen los ejemplos
# rotos. No son errores: son la prueba y la pantalla que los arregla.
PERMITIDOS='src/__tests__/acentos-rotos.test.ts|src/app/\(app\)/settings/datos/page.tsx|scripts/check-acentos.sh'
ARCHIVOS=$(echo "$ARCHIVOS" | grep -Ev "^($PERMITIDOS)$" || true)
[ -z "$ARCHIVOS" ] && { echo "Acentos: bien, nada que revisar ($AMBITO)."; exit 0; }

# shellcheck disable=SC2086
SALIDA=$(echo "$ARCHIVOS" | tr '\n' '\0' | xargs -0 -r grep -nPI "$PATRON" 2>/dev/null)

if [ -z "$SALIDA" ]; then
  echo "Acentos: bien, sin acentos rotos ($AMBITO)."
  exit 0
fi

TOTAL=$(echo "$SALIDA" | wc -l)
echo "Acentos: PROBLEMA. $TOTAL lineas con acentos rotos ($AMBITO)."
echo ""
echo "$SALIDA" | head -30
[ "$TOTAL" -gt 30 ] && echo "... y $((TOTAL - 30)) mas."
echo ""
echo "Guardar los archivos en UTF-8. No fusionar asi: se ve mal en pantalla y"
echo "rompe las comparaciones de texto con enies y acentos."
exit 1
