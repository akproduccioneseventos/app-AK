# Auditorías 78 y 79 de Codex atendidas; base de prueba para estaciones (orden 114.3)

**8 de octubre de 2026.** Rama `claude/app-debug-stabilize-m70e6z`, sobre main `7be1c05` (PR 1268).

## Fusionado

- 1266 (orden 128), 1267 (fotos de ejemplo), 1268 (pendiente del portal en invitaciones y
  personas; prueba de la fotocabina que mira la tira).

## En esta rama (sin fusionar todavía)

- **114.3:** `npm run entorno:pruebas` prende la base y el depósito de PRUEBA (emuladores 8085 y
  9195). Estaciones, mural y fotos andan ahí. `modo-local.ts` sólo acepta un emulador local.
  Probado en navegador: la Plataforma 360 inicia la captura y queda en el emulador.
- El enlace del presupuesto ya no le muestra al cliente botones del equipo.

## Sigue

- Puerta completa → fusión con `expectedHeadSha`.
- Codex: con el entorno nuevo, probar mural, captura y entrega (lo que quedó sin evidencia en 79).
- Integraciones reales y ensayo en el salón: al final, cuando Codex no encuentre más (decisión del
  dueño).
- Fotos: si no hay, va una de ejemplo. No se le piden al dueño.
