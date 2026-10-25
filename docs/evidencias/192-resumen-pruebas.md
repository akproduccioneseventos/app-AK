# Resumen consolidado de pruebas

Consolidación de los recibos 188–191, sin ampliar la auditoría. Los conteos son por recibo, no una certificación global.

| Recibo | Resultado | Cuentas observadas |
|---|---:|---|
| 188 consumidores | 10/15 PASS, 5 FAIL | Tres cuentas ficticias QA188, todas visibles en DOM: `qa188-bank-1` / `CUENTA-QA188-1`, `qa188-bank-2` / `CUENTA-QA188-2`, `qa188-bank-3` / `CUENTA-QA188-3`. |
| 189 controles | 13/16 PASS, 3 FAIL | No se registran cuentas bancarias en las observaciones del recibo. |
| 190 pago informado SDK | 9/11 PASS, 2 FAIL | No se registran cuentas bancarias en las observaciones del recibo. |
| 191 retest rol atención | 3/3 PASS, 0 FAIL | No se registran cuentas bancarias en las observaciones del recibo. |

**FAIL 188:** `client-report-payment-button-opens-form`, `budget-read-failure-not-shown-as-missing`, `valid-public-link-with-client-app-session-keeps-own-budget`, `concurrent-same-payment-report-one-pending`, `failed-receipt-upload-retry-can-recover-or-reports-error`.

**Entrega oficial 189: un defecto, dos señales.** `official-delivery-survives-active-page-mapper` y `official-delivery-link-reachable-in-active-client-ui` muestran que la entrega no atraviesa el mapper activo y no queda accesible en la UI. No contarlos como dos defectos. `payment-shortcut-keeps-open-section-open` es fricción separada: el atajo cierra una sección que ya estaba abierta.

**Pago 190 confirma dos señales de 188.** `same-report-concurrent-one-notification-sdk` confirma la duplicación concurrente; `failed-attachment-retry-not-silently-lost-sdk` confirma el caso de subida/reintento. Son confirmaciones SDK, no nuevos hallazgos independientes. 190 además registra reintento secuencial con una notificación y controles de monto inválido aprobados.

**Retest 191:** pasan las tres variantes de “Mozo de Atención”. Cierra `staff209`; no es evidencia sobre `portalproveedor`.

**Límites:** 188/189 usan ReactDOM real y acciones/mappers reales, con adapters controlados para dependencias descritas en los recibos. 190 usa Firestore SDK en demo/emulador; no prueba Next HTTP, producción, Storage real ni carga efectiva al bucket. No concluir “cero errores” ni “todas las áreas”.
