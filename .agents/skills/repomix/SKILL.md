---
name: repomix
description: Use when analyzing file sizes, measuring token counts, or deciding which large files to read or exclude to optimize token consumption.
---
# Repomix: Medición y Optimización de Tokens

Esta guía te ayuda a optimizar el uso de tokens al analizar archivos de la aplicación.

## Instrucciones de uso
- Repomix mide qué archivos de la aplicación consumen la mayor cantidad de tokens.
- Antes de leer archivos gigantes, verificá su tamaño en bytes y cantidad de líneas usando herramientas de exploración de directorios.
- Evitá leer archivos grandes completos (como archivos de traducción, bundle, o JSON grandes). Usá `view_file` con rangos de línea acotados.
