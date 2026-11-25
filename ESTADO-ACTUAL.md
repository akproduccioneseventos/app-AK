# Estado actual — 24 de noviembre de 2026

## Publicado
- #1462 a #1465, #1471, y las entregas 336 a 342 de Gemini juntas con los arreglos de Claude.

## En revisión (sin fusionar)
- **PR #1472 (`gemini/orden-343`)**: abierta y pendiente de revisión/fusión (Órdenes 343, 344 y 345).

## Rama actual (`gemini/auditoria-profunda-24-11`) — Auditoría profunda 0 errores
- Suma 8 arreglos sobre finanzas, contratos, migración 2027 y seguridad del portal (Pilares 3 y 4 con 0 hallazgos P0/P1):
  - `getFiestaByAccessKey` y `cambiarClavePortal` con rate limit, sesión de portal, chequeo `enabled` y comparación en tiempo constante.
  - `empezar-2027` respeta archivados/rechazados/`Facturado`/firmados y pasa por `normalizePresupuestoFinancials`.
  - `cancelServicesOrParty` (`cancelAll`) apaga `ajusteAnualActivo`/`ajusteAnualPorcentaje` y usa `presupuesto.fechaFirmaContrato`.
  - `changeEventDate` guarda `totalConDescuento = nuevoTotal` exacto; `estadoDelContrato` y `updatePresupuesto` protegen firmas, `Facturado` y `preserveTotal`.
  - `ver/page.tsx` y `PublicPortalView.tsx` pasan el porcentaje de ajuste anual desde Ajustes.
- Pruebas de regresión agregadas en `src/__tests__/auditoria-profunda-24-11-plata-y-portal.test.ts`.
