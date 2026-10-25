# AK-CODEX-218 - Dos intercalados pendientes de aprobacion

Responsable: Claude (dinero/contrato). Codex SOLO audita/prueba/documenta.
Fuente main9d1a07f99b8d6972995ff8c2b9f1a5a1ac4a81de, incluye1352/orden211.
Contraste: portal.actions.ts tiene el MISMO blob f313edd16e619864f276fa00e0291368fb7ddb1a
en candidato1353 b91bdbeff7d3db7489fabdadd599776376c0577a. No es un fallo
reportado sobre la entrega vieja fa3b. Cambios privados posteriores NO CONTRASTADOS.

## Lo que ya pasa y NO hay que rehacer

216 ejecuta14 criterios contra las funciones nuevas, todos PASS: las cinco
causas B1-B5 de211 quedan cerradas por ese alcance controlado. Incluye rechazo
por firma existente, presupuesto ausente/escritura fallida, desglose27/1080,
dos extras200=400, reintento tras commit con ACK perdido y lectura de firma
fallida en updatePresupuesto. No certifica navegador ni todas las transacciones.

217 encontro DOS intercalados adicionales.218 los reprodujo TAMBIEN con Firebase
Admin SDK y transacciones reales contra el emulador demo.2FAIL,no excepcionQA.
Son dos causas, no cuatro por tener dos sondas. No reabrir las cinco anteriores.

## P1: firma guardada entre lectura y escritura

1. getFiestaById devuelve evento todavia sin firma.
2. Antes de la transaccion de tomarSolicitud se guarda isSigned=true por SDK.
3. La transaccion de fiesta lee ese documento actualizado, pero no vuelve a
   proteger el contrato. mutarPresupuesto agrega el extra y responde success.
Observado en218: contrato firmado=true, solicitud aprobada, presupuesto1000->1200.
Esperado: no modificar el contrato/presupuesto firmado sin la adenda prevista;
solicitud pendiente y error claro. Ninguna firma real ni cargo ejecutados.

No alcanza otro if sobre la primera fotografia del evento. Claude debe elegir
una coordinacion transaccional/estado que conserve la garantia al intercalarse
firma y aprobacion. No quitar el bloqueo de firma ni invalidar una firma ya aceptada.

## P1: compensar un fallo borra invitados aprobados por otro

1. Base25adultos/presupuesto1000. A pide+2; B pide+3, ambas pendientes.
2. A toma su solicitud; falla SU escritura del presupuesto antes del commit.
3. Se pausa A antes de devolverAPendiente. B completa aprobacion y presupuesto.
4. A compensa usando fiestaAntes.configuracion de25, pisando lo posterior.
Observado218: A=false/pendiente, B=true/aprobada; presupuesto28adultos/1120,
pero fiesta25. Esperado: fiesta28 y presupuesto28/1120, conservando B.

No restaurar la configuracion entera de una lectura vieja ni borrar marcas de
otros pedidos. La recuperacion debe revertir solo lo que corresponda al intento
fallido y preservar escrituras posteriores, cantidades y reintentos legitimos.

## Evidencia y limites

- 216-contraste-aprobaciones.json:14PASS, funciones/guardas/calculo reales,
  identidad y persistencia controladas. NO14areas aprobadas.
- 217-contraste-concurrencia.json:2FAIL con persistencia controlada.
- 218-solicitudes-portal-sdk.json:2FAIL con SDK y transacciones reales en
  fiestas y presupuestos; actualizadoActualizarFiesta/mutateDataItem reales.
- Identidad dueno, predicado de equipo, limpieza/validacion del adaptador y
  planificacion del fallo controlados. No HTTP firmado, otro perfil, endpoint
  real de firma, produccion, cobro ni equipo fisico certificados.
- SDK limpio al terminar:0fiestas/0presupuestos; DELETEemulador200; procesos cerrados.

Agregar positivos donde firma llega despues de aprobar y donde A falla sin B,
ademas de conservar los14positivos de216. Ejecutar los dos intercalados con
SDKdemo. Un check de texto/archivo existente no cierra esta orden.

```comprobar
archivo: src/app/actions/fiesta/portal.actions.ts
usa: aprobarConPresupuesto en src/app/actions/fiesta/portal.actions.ts
usa: approveClientMenuChangeRequest en src/app/(app)/fiestas/nueva/portal-cliente/page.tsx
usa: approveClientServiceChangeRequest en src/app/(app)/fiestas/nueva/portal-cliente/page.tsx
archivo: src/lib/budget/mutar-presupuesto.ts
usa: mutarPresupuesto en src/app/actions/fiesta/portal.actions.ts
prueba: docs/evidencias/216-contraste-aprobaciones.mjs
prueba: docs/evidencias/217-contraste-concurrencia.mjs
prueba: docs/evidencias/218-solicitudes-portal-sdk.mjs
```
