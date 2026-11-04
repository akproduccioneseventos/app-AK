# Estado actual — 2 de noviembre de 2026

Rama de trabajo: `claude/app-debug-stabilize-m70e6z`. Versión publicada: la 1378 (órdenes 242 a 248 de Gemini).

## Publicado
- **1375:** asistente de AK (memoria, voz, planes, vigilancia, cierre posfiesta).
- **1377:** número de factura de la carga histórica sin choques (Codex 743/C6).
- **1378 (Gemini, órdenes 242-248 con devoluciones 257-261):** barra con o sin alcohol (menores sólo sin alcohol; sin receta sin alcohol cargada no descuenta alcohol), textos del simulador con lista de respaldo, blog que no anuncia lo que no publicó, portada nueva, sección "La app de tu fiesta" y Club Uruguay. Claude arregló pruebas que buscaban mal y la del control de llegada (tocaba antes de que la página respondiera; el interruptor anda).

## Pendiente
- Nada encargado. Gemini no puede subir solo: el dueño pega en PowerShell `git add -A`, `git reset -q -- data src/data`, `git commit`, `git push`.
- Decisión del dueño pendiente: al prospecto de anuncio con datos completos, ¿el bot le contesta con el enlace al simulador (A, recomendado) o queda sin respuesta hasta que alguien mande el presupuesto (B, como está)?

## Para el dueño (abogado)
- Revisión legal del contrato de Codex: `docs/evidencias/738-legal-contratos-dictamen.md` en la rama de Codex.

## Errores de plata y permisos abiertos
- Ninguno conocido.
