# 153 - Google: estado real de la cuenta y del equipo

NO CONTRASTADO CON LA TANDA LOCAL DE CLAUDE.
El usuario informa que Claude trabaja en152; su rama privada no esta identificada.
Antes de programar contrastar este hallazgo con esa entrega y reutilizar si ya existe.
Destinatario: Claude, disponible para programar segun la orden actual del dueno.

## Base y evidencia

- Main remoto99faf4eb061fa46341cfdde6f81b93b3bfb9c73c.
- PR1288 abierta, rama codex/auditoria-97-ia-contexto-20261011,
  HEAD contrastado08478e71aa0e8240521526c041c1c97058d8c909.
- App compilada8fa5b56a2833938541a657dcd15ef88130d24b0e, igual en estos archivos
  a main; reproduccion AISLADA PC/Pixel7, no entrada en cuentas productivas.
- docs/evidencias/107-google-focused.json, capturas revoked/focused-failure/after-retry.
- No correos, sincronizaciones de fiestas ni OAuth reales. Credenciales ficticias.

## Un hallazgo P2 con dos efectos, no dos reimplementaciones

En /settings/google-workspace, una cuenta empresa guardada como needs_reconnect
se anuncia Conectada, con check verde, y habilita Sincronizar fiestas.
Un empleado status:error se suma al contador Personal conectado y al porcentaje
del equipo que supuestamente tiene calendario habilitado. Reproducido PC/movil.

Archivos/simbolos verificados:
- src/app/actions/google-workspace.ts:getGoogleWorkspaceDashboard conserva status,
  pero connectedEmployees filtra por kind:employee sin comprobar status.
- src/app/(app)/settings/google-workspace/page.tsx:GoogleWorkspaceSettingsPage
  usa existencia de companyAccount para label/check/bloqueo de botones; usa
  connectedEmployees.length para cobertura, aunque el badge inferior diga error.

Corregir estado visible y habilitacion segun status real, no existencia del registro.
Mostrar reconectar/error en lenguaje del encargado, sin tratar needs_reconnect
como conectada. Contar solo los empleados realmente conectados; no ocultar los
que necesitan reconexion ni perder el mensaje util de lastError.
Conservar contrato de datos/consumidores y soporte de cuenta de servicio.
No imponer que OAuth este configurado para una cuenta de servicio valida.
Una etiqueta connected guardada tampoco certifica que Google acepte el token:
no prometer chequeo remoto si no se hizo ni enviar correos como prueba.
No cambiar importes, permisos, contratos ni el reparto de tareas comerciales.

## Lo que SI pasa: no tocar por este hallazgo

- Sin cuenta: aviso de configuracion faltante y sincronizacion bloqueada.
- Corte de transporte SOLO en getGoogleWorkspaceDashboard: error visible.
  Al restablecer transporte y pulsar Reintentar, vuelve la pantalla PC/movil.
- No reabrir el arreglo previo de invitaciones/envios fallidos; este defecto es
  el estado de la pantalla, NO demuestra que hoy se manden correos falsamente.
- Reutilizar106; no recompilar por escribir esta orden. Si cambia app, Claude
  valida el conjunto final una vez y anota SHA/resultado en el registro comun.

## Aceptacion propuesta

PC/movil: sin cuenta, connected, needs_reconnect y error; empresa y empleados.
Verificar labels, contador, porcentaje, botones y que las cuentas problemáticas
sigan visibles para reconectarlas. El criterio falla hoy en estados retirados;
el resultado debe acreditarse en el consumidor real, no solo en una funcion pura.
Prueba propuesta abajo PENDIENTE: no existe ni se ejecuto.
Una sola tanda/PR; no fusionar sin permiso; no declarar0errores de toda la app.

```comprobar
archivo: src/app/actions/google-workspace.ts
usa: getGoogleWorkspaceDashboard en src/app/(app)/settings/google-workspace/page.tsx
prueba: src/__tests__/google-workspace-estado-real.test.tsx
prueba: tests/e2e/google-workspace-estado-conexion.spec.ts
```
