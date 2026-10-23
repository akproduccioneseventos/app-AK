# AK-CODEX-263-PAGO-REINTENTO-REVIERTE-APROBADO

Responsable: Claude (dinero/contabilidad). Codex solo audita/prueba/documenta.
Fuente main725e62ba2f909578628fad47402d125ed9632c70, incluye la correccion1358.
Es un intercalado NUEVO del mismo aviso, no reabrir213 (pedidos de menu/servicios).
La tanda publica deGemini1353 sigueb91, no contiene la version1358 auditada.
NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS; contrastar antes de programar.

## P1 - Un reintento acredita el pago y la llamada anterior vuelve el aviso a pendiente

Consumidor real: `approveClientPayment` en
`src/app/actions/fiesta/portal.actions.ts`. La compensacion compara estado
aprobado+approvedAt con los deA, pero Breintento conserva justamente esa marca.

263 reproduce con los cuerpos reales de aprobar/rechazar, transicion, cobro de
presupuesto, validacion, normalizador/deduplicador y transacciones FirestoreAdminSDK
demo. Resultado2criterios:1PASS/1FAIL, UNA causa, sin excepcionQA.
260 ya la habia reproducido con adaptadores (3criterios2PASS/1FAIL), no es otra causa.

1. Aviso pendiente1000, presupuesto10000 con otro cobro confirmado9500.
2. A toma el aviso y el cobro REAL devuelve success:false por saldo500. Se retiene
   SOLO la respuesta aA, antes de que la accion intente compensar.
3. Se corrige/elimina el otro cobro del fixture directamente porSDK; NOse probo
   la pantalla/accion de borrar pagos. Se libera saldo para el reintentoB.
4. B aprueba el MISMOaviso. La accion y el cobro reales responden success:true;
   Firestore persiste UNpago confirmado1000, con referencia del aviso.
5. Se entrega el rechazo aA. Su compensacion cambia el aviso a pendiente aunque
   B ya acredito1000. El SDK relee pendiente+1000confirmado. No hay doble cobro:
   la inconsistencia es el estado del aviso, no dos importes sumados.

Ese pendiente puede habilitar una revision/rechazo que no corresponde; la
secuencia posterior de rechazo no se ejecuto en263, no afirmarla como observada.

## Resultado requerido

Si el cobro del mismo aviso ya fue confirmado por otro intento, un fallo tardio
no puede devolver ese aviso a pendiente. Si NINGUN intento lo acredito y el cobro
se rechazo realmente, debe seguir pudiendo volver a pendiente como control260.
Resolver la identidad/estado de la operacion de forma consistente entre aviso
y presupuesto; una lectura adicional fuera de transaccion no elimina por si
sola la carrera. No fijar una receta de implementacion sin revisar todas las rutas.

NO volver a cobrar antes de tomar el aviso: reintroduce el rechazo simultaneo
con dinero acreditado que1358 corrigio. Preservar el guard de permiso contable,
referencia idempotente y no duplicar dinero/notificaciones. No deduplicar por
telefono/nombre/fecha ni impedir presupuestos distintos del mismo prospecto.

## Controles y limites

263 controlpositivo:1aviso aprobado/1pago1000.260 controles: rechazado primero
no acredita; rechazo unico conocido retorna a pendiente. Mantenerlos.
Actor autorizado y predicado de acceso del evento controlados, guardia de permiso
real. Notificaciones y sincronizador a fiesta controlados; no HTTP/cuentas/mails,
cobros reales, corrupcion en produccion ni todos los roles certificados.
0fiestas/0presupuestos al terminar, limpieza200, procesos propios cerrados.
262 inicial no cargo un import del harness, antes de los casos; preservado.
263 conecto el helper financiero REAL, no un sustituto que cambie resultados.
Prueba de regresion propuesta abajo PENDIENTE, no implementada/ejecutada porCodex.

```comprobar
archivo: src/app/actions/fiesta/portal.actions.ts
usa: approveClientPayment en src/app/(app)/fiestas/nueva/plan-pagos/page.tsx
usa: addPagoToPresupuesto en src/app/actions/fiesta/portal.actions.ts
prueba: docs/evidencias/260-aprobacion-reintento.mjs
prueba: docs/evidencias/263-aprobacion-sdk.mjs
prueba: src/__tests__/pago-aprobado-no-vuelve-pendiente-por-reintento.test.ts
```
