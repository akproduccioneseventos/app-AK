# Estado actual - 11/10/2026 (Codex102-104)

Rama codex/auditoria-97-ia-contexto-20261011; PR1288 ABIERTA, no fusionar.
Base contrastada main99faf4eb; fuente correctiva congelada a6d20861.
El dueno autoriza correccion directa; no autoriza fusion ni cambiar datos reales.

## Correcciones realizadas
- 151: el fallo real de lectura de fiestas no se convierte en falso vacio/local.
  Lector compartido optativo; modos local/sinSDK/build y vacio real conservados.
- 147: reintentos QR de archivo a90/180/270 SOLO tras fallo del original.
  Sin cambiar PNG/token/camara/checkIn; instalacion idempotente.
- Mural: foto primaria pinta sin esperar chat, guardas contra respuestas viejas;
  peticiones no se solapan mientras las anteriores sigan pendientes.
- Cupones: fin de dia en Uruguay; selector/etiquetas comparten la regla;
  Nuevo calcula hoy al abrir. No cambios en dinero/descuentos/usos/permisos.
- Portal: Reintentar recarga el mismo enlace para pedir lectura nueva.

## Evidencia vigente (aceptaciones acotadas, no app entera)
- 103 fuente4c: QR8pass, fechas2pass, mural4pass PC/movil, SDK/medidas reales.
  Portal4c recuperacion2fail historicos, NO ocultarlos.
- 104 fuentea6: portal4pass, clave ausente vs fallo y recuperacion con SDK intacto.
  Health confirma fuente compilada. Build completo exit0, tipos/lint habilitados.
- Jest4c:686suites/4122tests pasan. Final104 sobrea6:688suites/4129tests pasan.
- Reporte102 conserva historial y limites; matrix84/YA prevalecen sobre notas viejas.
  Aceptaciones88-101 vigentes solo donde no hubo cambio; no repetirlas por rutina.

## Pendientes reales
- Salon3D: WebGLtrue/canvas0 PC/movil, errorReactCurrentBatchConfig.
  CandidatoReact19/Fiber9/Drei10 NO paso tipos/lock; no integrado ni forzado.
  Geometria/foto fallback NO acreditan escena. No declarar 14areas limpias.
- 19 presupuestos manuales requieren export+originales, NO reconstruir ni borrar.
  Robert/Lorena/Soraya sin tocar; ausencia JSONlocal/gRPC7 no prueba ausencia real.
- Cuentas/proveedores/modelos pagos reales, Hosting mismoSHA y ensayo de hardware
  no certificados por demo. No existe prueba de cada boton/variante de toda la app.

## Traspaso
- Entorno103/104 detenido; fixtures propios eliminados por tests; agregados demo
  automaticos preservados. No datos reales. No confundir shutdown con fallo app.
- Una sola PR1288 para registro y correcciones; no crear duplicadas ni fusionar.
- Consultar102-recuento-correcciones-directas.md para SHAs/sondas y errores de QA.
- Graphify:update local sin API pasa:13603nodos/42342relaciones/838comunidades.
