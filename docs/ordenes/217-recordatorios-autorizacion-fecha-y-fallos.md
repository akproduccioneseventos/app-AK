# AK-CODEX-249/250 - Recordatorios que realmente se ejecutan

Responsables: Claude controla autorizacion/puerta; Gemini motor del recordatorio.
Codex solo audita/prueba/documenta. Una entrega conjunta, no una PR por causa.
Fuente mainbaa034fd25ab77b886e7096105a6114f0336bfdc; los cuatro archivos efectivos
de249 coinciden con candidato1353b91bdbeff7d3db7489fabdadd599776376c0577a.
NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS.

## Prueba, no nueva lista de rutas

249 ejecuta motor+GET+puerta+fechasUruguay reales:8criterios4PASS4FAIL.
Almacen/transaccion, Gmail, contingencia, rate-limit y marcador de corrida son
adaptadores controlados; Request/Response dentro del proceso, NO servidorHTTP.
250 confirma R2/R3 ademas con actualizador/transaccion/AdminSDK reales al
emulador demo:2FAIL, mismas causas, no dos errores adicionales.0docs/cleanup200.
No mensajes/cuentas/proveedores reales. Ver249/250 JSON y251-consolidado.

## R1 - Sin CRON_SECRET la tarea publica puede llegar al envio

GET `src/app/api/cron/recordar-invitacion-no-abierta/route.ts` pasa por
`abrirPuertaDeLaTarea`; la lista de `src/lib/automatico/puerta-de-las-tareas.ts`
la admite sin clave. Su motor `correrTareaRecordarInvitacionNoAbierta`, en
`src/lib/invitaciones/recordatorio-no-abiertas.ts`, llama al remitente Gmail.
Con cuenta ficticia conectada, GET anonimo sin CRON_SECRET produce200recortado,
pero llama1vez al remitente y marca la corrida. La respuesta recortada SIesta
bien por201; no evita el efecto. Con clave configurada, anonimo401 y0envios PASS.
No afirmar que produccion carece de CRON_SECRET: configuracion real no leida.
Mantener la decision existente: lo publico puede PREPARAR, no escribir a personas;
el envio requiere origen autorizado. No deshacer201 ni abrir la respuesta con datos.

## R2 - Reprogramar entre lista y reserva no cambia la decision de enviar

Lista inicial:01/10, fiesta11/10 (10dias). Antes de la transaccion, el equipo
guarda01/12. La reserva lee el evento NUEVO, pero solo reevalua los invitados:
manda igual y registra01/10 en `recordatoriosApertura`.250 lo confirma conSDK.
Reevaluar dentro de la reserva la fecha civil vigente y la ventana21/10dias;
no cambiar datos guardados ni zona global. Si cambia otra vez despues de reservar,
definir invalidacion del intento sin destruir los envios ya aceptados.

## R3 - Fallan envio y respaldo y el dia queda consumido

Se reserva el dia ANTES del envio. El proveedor controlado rechaza403 SIN
aceptar mensaje; la contingencia devuelve success:false. El motor registra1fallo,
pero conserva la fecha reservada. Corrida posterior del mismo dia omite al invitado
y dice0fallos: no hubo envio ni respaldo guardado, tampoco queda reintento elegible.
250 confirma fecha persistida y solo1intento de remitente/contingencia en2corridas.
Guardar un estado recuperable cuando NOse acepto ni guardo nada; no perder el
recordatorio. NUNCA reenviar a ciegas cuando el resultado del proveedor sea incierto:
ese caso requiere conciliacion/revision, no confundir rechazo conocido con ACK perdido.
248 usaba respuesta vacia, que puede ser incierta: esa primera sonda NO demuestra
rechazo conocido.249/250 usan403 explicito; conservar ambos recibos sin ocultarlo.

## R4 - La reserva falla y la ruta lo anota completado

Inyectando `actualizarFiesta -> {success:false,error:...}`, el motor hacecontinue
y devuelve corrio:true/fallados0; GET devuelve200ok:true y llama `marcarCorrida`.
No fue una corrida completa: nadie fue reservado ni enviado. Propagar el fallo
para no marcar exito. Es otra variante del criterioAUTO02, no reapertura de201
(recorte de respuestas) ni de los motores de avisos ya corregidos.

## Controles que se conservan

Sin clave cuando esta configurada:401sin remitente. Con clave en dia permitido:
1envio controlado. Si abre su invitacion entre lista/reserva, NOse le escribe.
Fuera de21/10dias, NOse le escribe. No mover el envio dentro del callback de
transaccion: la base puede repetirlo; el arreglo historico antiduplos se conserva.
Sin nuevos servicios/dependencias/pagos ni cambios a los telefonos almacenados.
Prueba de regresion propuesta PENDIENTE abajo; no existe/ejecuto porCodex.

```comprobar
archivo: src/lib/invitaciones/recordatorio-no-abiertas.ts
usa: correrTareaRecordarInvitacionNoAbierta en src/app/api/cron/recordar-invitacion-no-abierta/route.ts
archivo: src/lib/automatico/puerta-de-las-tareas.ts
usa: abrirPuertaDeLaTarea en src/app/api/cron/recordar-invitacion-no-abierta/route.ts
prueba: docs/evidencias/249-recordatorios-motor.mjs
prueba: docs/evidencias/250-recordatorios-sdk.mjs
prueba: src/__tests__/recordatorio-no-abiertas-origen-reserva-y-fallo.test.ts
```
