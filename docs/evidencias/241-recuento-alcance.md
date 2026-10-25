# 241 - Recuento finito de alcance y cobertura

Solo evidencia ya registrada; no es inventario nuevo, aprobación de áreas ni orden de programación. Base local `baa034fd25ab77b886e7096105a6114f0336bfdc` (main), rama `codex/240-contrato-y-cierre-20261022`. Gemini `b91bdbeff` aparece devuelta/no fusionada. El ayudante no inspeccionó contrato/dinero240 ni fixes213: el principal los documenta aparte en240-consolidado. Diferencias privadas no se presumen contrastadas.

## Brechas de aceptación que sí constan

- **Portal cliente:** las pruebas focales de claves cruzadas/DTO no demuestran cada cambio HTTP, persistencia ni concurrencia. Pendiente de aceptación por esos límites, no afirmación de fallo nuevo. Fuente: `docs/evidencias/220-recuento-y-limites.md`, tabla de áreas; `docs/evidencias/165-recuento-y-limites.md:48`.
- **Permisos:** acciones compuestas no equivalen a cada control de siete roles; OAuth real no probado. No convertirlo en ausencia total de auditoría ni en permiso defectuoso. Fuente: `docs/evidencias/220-recuento-y-limites.md`, tabla; `docs/evidencias/165-recuento-y-limites.md:46,72`.
- **Invitado:** quedan estados UI/offline y lectura física QR fuera de la evidencia focal. Fuente: `docs/evidencias/220-recuento-y-limites.md`, tabla; `docs/evidencias/165-recuento-y-limites.md:49`.
- **Redes/galería y asistente/WhatsApp:** sincronización de cuentas, medios/proveedor, voz/modelo y entrega real no certificados; es límite externo, no defecto demostrado. Fuente: `docs/evidencias/220-recuento-y-limites.md`, tabla; `docs/evidencias/165-recuento-y-limites.md:51,54,72`.
- **Entretenimiento / barra:** captura/impresión/360/modelo real y equipos/colas físicas no aceptados por evidencia; orden195 ya consta pendiente para Gemini y no se duplica. Fuente: `docs/evidencias/220-recuento-y-limites.md`, tabla; `docs/evidencias/165-recuento-y-limites.md:52-53`.
- **Tareas automáticas:** 11 respuestas comprobadas no prueban los 11 motores/proveedores/calendarios publicados. Fuente: `docs/evidencias/220-recuento-y-limites.md`, tabla; `docs/evidencias/165-recuento-y-limites.md:56`.

## Estados que no se deben mezclar

- **Historia, no estado actual inferido:** 165/169 nombran dock172, proveedor204 y entregas193-196/202-203. Sus estados antiguos NO se elevan a pendientes actuales. Consultar YA y el contraste posterior del tema antes de reabrir; este indice no hizo ese retest.
- **Fuente antigua/limitada:** 165/169 preservan resultados sobre SHA anteriores; no extenderlos automáticamente a main actual, rama privada ni áreas completas. `docs/evidencias/169-cierre-consolidado.md:13-17,33-35`.
- **No contrastado / cobertura desconocida:** hardware y OAuth/cuentas reales no tienen certificado en la cobertura disponible. No decir “nunca auditado”. Manual del dueño no es pendiente Codex; sin cuentas/datos reales.
- Las 14 áreas oficiales son agrupaciones, no 14 casos. El inventario de 421 rutas/7 perfiles/6401 ubicaciones AST no significa aprobación funcional ni permite contar controles faltantes. `docs/evidencias/165-recuento-y-limites.md:35-56,69-74`.
- Consultado `docs/YA-RESUELTO.md` por los temas anteriores: preservar cierres/órdenes existentes; en particular no reabrir órdenes 172/199/204/195 ni interpretar pruebas históricas de RSVP, cocina o OAuth fuera de sus límites. `docs/YA-RESUELTO.md:15444-15462`.

## Prioridades finitas para el handoff

1. Contrastar cambios de portal cliente contra el HEAD entregado: HTTP, persistencia y concurrencia, reutilizando pruebas previas.
2. Aceptar por acción/rol los controles de permisos relevantes; mantener OAuth real como cobertura desconocida, no simulada.
3. Mantener explícitos los límites de integraciones/hardware y estados UI/offline de invitado; elevar solo al aparecer evidencia concreta nueva.

No se inspeccionó ni ejecutó la aplicación; no hay fallos nuevos reproducidos ni pruebas nuevas. Solo queda pendiente la evidencia ya descrita arriba.
