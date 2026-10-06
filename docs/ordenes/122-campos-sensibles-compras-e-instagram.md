# Orden 122: campos sensibles, compras e Instagram

Para Claude y Gemini, 6/10/2026. Tanda unica, no una PR por hallazgo. Codex proporciona evidencia; no programo la app ni compilo. El dueno conserva decisiones y fusion.

## Base comprobada

Main `e52c07839563115236652229d73ac5ebf2e4e551` (1258). Tanda pendiente 1259: `feat/orden-117-video-invitados`, `f836c128cfad861a55a2352782f18c805b55e13a`. Los archivos de los cuatro casos siguientes estan sin cambios entre esas versiones. Si el HEAD avanzara, CONTRASTAR otra vez antes de programar; no repetir arreglos ya presentes.

603 suites / 3490 unitarias verdes en main; 4 suites / 27 verdes en la tanda. Evidencia, hashes, sondas y limites: `docs/evidencias/71-auditoria-integral-y-retest.md`, `71-resultados/manifest.json`. Las sondas reproducen defectos, no certifican correcciones. Las seis regresiones de orden 120 ya pasan; no reabrirlas.

## Claude: dinero, permisos y comida

### CAMPO01/CAMPO02, P1: se salta el permiso entrando por un guardado general

Archivos verificados: `src/app/actions/fiesta/fiesta.actions.ts` (`saveFiesta`, `updateFiestaPartial`); politica `src/lib/auth/perfiles.ts`; filtro `src/lib/fiesta/recortar-para-afuera.ts`.

Reproduccion: `node docs/evidencias/71-sonda-campos-y-compras.cjs`.

- Operador asignado, sin contabilidad, guarda `planDePagos` con una cuota pagada via `updateFiestaPartial`. La accion especifica `updateCuotaEstado` lo rechazaria.
- Cliente con sesion valida de su portal, sin sesion interna, manda `allowPortal:true`, contrato fisico firmado, estado Contratada y cuota pagada: se acepta. Solo se bloquean campos de equipo, no esos campos sensibles.

Cerrar la puerta de forma central, por campos y permisos efectivos del servidor, sin confiar en opciones/payload del navegador. Contrato fisico y cobros solo por el flujo autorizado que valida la operacion; no dejar una ruta generica equivalente sin control. Contrastar tambien `saveFiesta` y sus reexportaciones en `fiesta-actual.ts`, no proteger solamente la pantalla o la accion financiera especifica.

Conservar: organizacion del operador asignado, cambios legitimos del cliente, RSVP/mural/invitado y constancia digital separada del papel. NO prohibir toda escritura de portal ni cambiar el negocio de firma/reserva. NO restringir costos por una regla nueva: `updateGestionCostos` admite ORGANIZACION actualmente, por lo que ese punto se retiro como defecto de la auditoria.

Pruebas pendientes: llamadas directas con operador asignado y cliente de portal, guardar entero y parcial, papel/cuotas/campos relacionados; comprobar que NADA sensible se persiste al rechazarse. Dueño/secretaria y flujos publicos legitimos deben seguir pasando. Extender `src/__tests__/frontera-general-de-fiestas.test.ts` o crear la regresion propuesta abajo. Validar luego con sesiones HTTP reales del backend aislado, no solo mocks.

### COMPRA01, P1: una pantalla vieja deshace un pago

Archivo: `src/app/actions/fiesta/catering.actions.ts`, `updateShoppingListStatus`; consumidor `src/app/(app)/fiestas/nueva/catering/lista-compras/page.tsx`.

La comprobacion de si cambia `pagado` usa una lectura previa a la mutacion. Despues un array viejo reemplaza los estados actuales. La sonda intercala un pago de contabilidad antes de esa mutacion: un operador autorizado para organizacion lo devuelve a pendiente sin permiso de insumos/contabilidad.

Validar cambio y permiso contra la version ACTUAL dentro de la operacion, y no aceptar un snapshot que borre un pago concurrente. Puede rechazarse el guardado viejo y pedir recargar, o aplicar solo el cambio solicitado con control de version; elegir el patron existente sin alterar el significado de pedido/pago. Conservar cambios independientes de otros proveedores, responsables y tareas; ningun guardado a medias debe decir exito.

Regresion pendiente: dos intercalaciones, pago primero y cambio de pedido primero; operador sin contabilidad no revierte el pago. Dos proveedores cambiados a la vez conservan ambos cambios. Pantalla muestra rechazo y recarga, no una casilla optimista falsa. Sonda aislada no reemplaza prueba de transaccion Firestore.

## Gemini: RED03, P2, union concurrente de videos de Instagram

Archivo: `src/app/actions/social-media.ts`, `syncInstagramPosts`; consumidor `runMarketingAutomation` en `src/lib/marketing-automation.ts`. Objeto generico de galeria: adaptador `src/lib/generic-json-store.ts`.

Reproduccion: `node docs/evidencias/71-auto-probe.cjs`. Dos llamadas reales leen una galeria vacia antes de obtener feeds distintos A/B; las dos dicen exito y solo queda el video B. El adaptador generico real reemplaza `_data`; las operaciones `.get/.set` de Firebase estan simuladas. No se alego una carrera en el proveedor real.

Fusionar los cambios sobre el objeto ACTUAL mediante el mecanismo atomico adecuado entre instancias, conservando fotos/videos ajenos, orden, etiquetas y ediciones manuales. No arreglar solo con mutex de una instancia ni nueva deduplicacion de IDs: los IDs estables ya estan corregidos. No extrapolar este fallo a las colecciones de fotos/planificador, que tienen marcas y transacciones.

Regresion pendiente: barrera que obliga a dos sincronizaciones a leer antes de guardar; A/B diferentes quedan ambos una vez; reintentos consecutivos no duplican; una edicion manual intercalada no se pierde. Error de lectura/guardado no debe devolver exito. Prueba con storage fiel al generico y luego dos instancias contra Firebase de prueba.

## No programar estos falsos positivos

- El timer de 12 segundos del totem esta en la rama SIN video; el video termina por `onEnded`. No recortar/ampliar el timer por una alarma descartada.
- AUTO03 es observacion: procesar una cola no equivale a entregar todos los posts; se retiro "no reintenta". Mejorar el indicador solo tras definir el significado, sin bloquear esta tanda ni modificar automatismos comerciales.
- No rehacer las ordenes 120, 121 ni 117. No esconder fotocabina/360/espejo en ventas. No investigar facturacion de GitHub.

## Cierre y evidencia necesaria

Claude compila la tanda y conserva logs con SHA, entorno, comandos y resultado. Aplicar regresiones que FALLEN con el codigo anterior y pasen con el nuevo; actualizar `docs/YA-RESUELTO.md` en la misma entrega. La guia 114 sigue requerida para que Codex complete los recorridos actuales con backend aislado y estable. No atribuir el bloqueo de URL de Computer Use a AK ni usar conteos unitarios para declarar 14 areas limpias.

No fusionar esta orden/documentacion sola. Incorporarla a la siguiente propuesta de codigo; dejarla disponible para todas las IA. No ejecutar cargos, publicaciones reales ni tocar las 19 fiestas al probar. Las pruebas nuevas indicadas a continuacion son PROPUESTAS, no existen ni estan ejecutadas hoy.

```comprobar
archivo: src/app/actions/fiesta/fiesta.actions.ts
usa: saveFiesta en src/app/actions/fiesta-actual.ts
archivo: src/app/actions/fiesta/catering.actions.ts
usa: updateShoppingListStatus en src/app/(app)/fiestas/nueva/catering/lista-compras/page.tsx
archivo: src/app/actions/social-media.ts
usa: syncInstagramPosts en src/lib/marketing-automation.ts
prueba: src/__tests__/auditoria-71-campos-y-compras.test.ts (PROPUESTA PENDIENTE: crear y ejecutar)
prueba: src/__tests__/instagram-sync-videos-concurrentes.test.ts (PROPUESTA PENDIENTE: crear y ejecutar)
```
