# Orden209 - Dos consumidores con resultado reproducido

## Retest posterior - Codex191/196, 21/10/2026

PERSONAL-ROL-ATENCION CORREGIDO:1913PASS en56c4a425, ya incorporado a main.
PROVEEDOR-LECTURA-RECHAZADA CORREGIDO por208:19613PASS en mainfa3b492b8,
incluido transporte rechazado, error visible/sin spinner y Reintentar recupera.
Alcance DOM/acciones controladas, no HTTP/SDK. No reencargar estos dos casos.
La redaccion inicial se conserva abajo como evidencia historica, no fallo actual.

NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS.
Claude publico16e197cc3591bf0812c1e8910c880d83f04eb94b; main9b7ee982.
Gemini1346 d95c35ba27c6ff5a3c1a8adac28e29c3ff02ae09. Contrastar HEAD antes
de programar. Numeracion209 libre en ambas entregas al emitir esta orden.
Una sola tanda con el trabajo activo, nunca otra propuesta por bloque.
Codex solo audita/documenta. No modificar cantidades, salarios ni permisos.

## Claude - PERSONAL-ROL-ATENCION, P1

Fuente178 c3e8f59221dcaca158bd6ec280264b541b4f50d0; sin cambios src hasta16e.
Se ejecuta syncFiestaFromBudget de src/app/actions/fiesta/fiesta.actions.ts
con presupuesto100invitados y catering. Catalogo de roles, en este orden:
Mozo de Cocina, Mozo de Atencion, Chef, Ayudante de Cocina, Utilero, Barman.
No hay rol con nombre exacto Mozo. Resultado guardado por la accion:4vacantes
en Mozo de Cocina y0en Mozo de Atencion; esperado4en atencion y0en cocina.
buscarRol(...,'Mozo') usa la primera coincidencia parcial, y el consumidor
addVacantes('Mozo',...) no excluye cocina. No es un cambio de las reglas
que acaba de decidir el dueno: es seleccionar el rol correcto para aplicarlas.

La pantalla src/app/(app)/fiestas/nueva/configuracion/page.tsx llama al wrapper
syncFiestaFromBudget de src/app/actions/fiesta-actual.ts, que llama a esa accion;
CRM y presupuestos tambien la consumen. Verificar los consumidores existentes,
no suponer que probar solo personal-por-invitados prueba la sincronizacion.

Sonda178: accion y helpers reales; lecturas, guardado y otras sincronizaciones
controlados. NO se cambio una fiesta real ni se probo persistencia completa.
85controles pasan; solo ese caso falla. No tocar sueldos/25/30/umbrales de barra,
el permiso del sincronizador ni personal manual ya asignado. Regresion propuesta
PENDIENTE de crear/ejecutar en src/__tests__/sincronizar-personal-rol-atencion.test.ts.

## Gemini - PROVEEDOR-LECTURA-RECHAZADA, P2

Fuente16e, src/app/proveedor/acceso/[token]/page.tsx, loadAccess.
183 monta la pagina y sus controles React reales. getProveedorByToken rechaza
su Promise simulando transporte perdido antes de recibir resultado. Tras resolver
el rechazo: pantalla sin texto, spinner activo y unhandledRejection; no aparece
Acceso no disponible. El mismo consumidor SI muestra error cuando recibe
{success:false,error}. Se necesita controlar tambien el rechazo y liberar loading
en todos los caminos; permitir recuperar sin afirmar acceso correcto ni borrar
datos por interpretar un fallo como vacio. Conservar validacion de token existente.

Los otros11controles DOM de183 pasan: confirmar, camino, llegada, finalizar,
tarea, nota, remontaje/relectura del almacen controlado, guardado false/throw y
acceso revocado. No afirmar HTTP, Firestore, geometria o proveedor real por183.
No rehacer204: sus transacciones ya pasan con SDK en173. Regresion propuesta
PENDIENTE de crear/ejecutar en src/__tests__/portal-proveedor-error-inicial.test.tsx.

## Entrega

Conservar los recibos iniciales y adjuntar resultado rojo/verde del consumidor,
SHA de fuente y QA. No marcar tarea hecha solo por grep o existencia de archivo.
Una validacion amplia final corresponde a Claude sobre la fuente congelada conjunta.
El trabajo manual del dueno no forma parte de esta orden ni de pendientes de Codex.

```comprobar
archivo: src/lib/fiesta/personal-por-invitados.ts
usa: buscarRol en src/app/actions/fiesta/fiesta.actions.ts
usa: syncFiestaFromBudget en src/app/(app)/fiestas/nueva/configuracion/page.tsx
archivo: src/app/proveedor/acceso/[token]/page.tsx
usa: getProveedorByToken en src/app/proveedor/acceso/[token]/page.tsx
prueba: docs/evidencias/178-claude-delta-contratos.mjs
prueba: docs/evidencias/183-proveedor-consumidor-dom.mjs
```
