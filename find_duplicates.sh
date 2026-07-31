#!/bin/bash

# Extraer solo líneas de selectores (que empiezan con . o : o > sin indentación)
# y las propiedades que siguen hasta el siguiente selector

for file in src/app/globals.css src/app/ak-global-premium.css src/app/ak-public-experience.css src/app/ak-motion-effects.css src/app/ak-release-polish.css src/app/ak-internal-experience-polish.css src/app/ak-no-red-experience.css src/app/ak-budget-mobile-fixes.css; do
  # Solo mostrar líneas que NO están indentadas y que parecen ser selectores o propiedades
  grep -n "^[^[:space:]]" "$file" | head -40
done | sort | uniq -d
