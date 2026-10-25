# Orden201 - Respuesta publica de tareas sin detalles internos

**NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS.** Responsable Claude,
por privacidad. ID AK-CODEX-158-CRON-RESPUESTA. P1 condicional al modo sinclave.
Estado: CORREGIDA por Claude en main9b7. Retest160/164 aprobado por contrato
de acciones/handlers; no certificar configuracion real ni integraciones.

Fuente main894d01603e0e03cebc8f90a6ccf869ef86bbe1de. Las dos rutas y la puerta
son iguales en1337/45a0. motor-agentes cambia en esa rama; contrastar simbolos
y nuevo HEAD antes de programar, no copiar ramas enteras.

## Modo previsto frente a respuesta observada

puerta-de-las-tareas permite expresamente ciertas tareas sin CRON_SECRET y con
limite, porque preparan borradores, no mandan mensajes. Esa decision se conserva.
El resultado de la puerta tiene conClave:false; su comentario dice que en ese
caso la respuesta se recorta. Dos handlers ignoran esa distincion y devuelven
el RegistroEjecucionAgente completo dentro de resultado:

-src/app/api/cron/prospectos-seguimiento/route.ts -> ejecutarPerseguidorPresupuestos.
-src/app/api/cron/fiesta-proxima-revision/route.ts -> ejecutarVigilanteFiestas.

En QA, Request anonimo y sin CRON_SECRET devuelve200 con nombre ficticio del
cliente/evento, tipo de fiesta y dias sin respuesta, o detalles de pendientes.
El motor y su preparacion/registro son reales con BD en memoria; el detector
de alertas es un doble, no se acepta su exactitud por este caso.

158-tareas-respuesta-publica.json:14casos,12PASS/2FAIL deUNAforma de respuesta.
Con clave configurada: faltante/incorrecta401 sin ejecutar; correcta200 con
detalle autorizado. Sin clave,limite excedido429 yfallo del motor500 sin marca.

## Arreglo acotado y pruebas pendientes

-Cuando puerta.conClave:false, devolver solo estado/resumen operativo minimo,
  sin nombres, telefonos, eventos, presupuestos, mensajes ni alertas individuales.
-Mantener detalle autenticado por clave y funcionamiento sinclave aprobado;
  NO exigir configuracion nueva como atajo ni apagar tareas o limite.
-Probar GET yPOST con ambos modos y errores; conservar que no se marca corrida
  al fallar ni se envia nada realmente. Retest sobre SHA nuevo, otro recibo.
-Buscar otros consumidores del mismo contrato conClave y evaluar su respuesta,
  sin asumir que todos exponen datos ni cambiar la politica global.

Limites: objetos Request/Response enproceso y adaptador NextResponse.json,
no HTTP del servidor publicado. No se leyo CRON_SECRET deproduccion. No cuentas,
mensajes,cargos ni datos reales. No es un hallazgo sobre la tarea abierta en si.

## Retest160/164 - 21/10/2026

Fuente `9b7ee982c5d6ff1377fccc0490abc85a9cfd8419`. Las dos rutas originales,
puerta y motores reales pasan anonimato/clave/header/query/429/error sin marca,
con datos ficticios (incluidos en34PASS de160). Ademas164 ejecuta los11handlers
y sus21metodos GET/POST exportados:84PASS. Sin clave solo {ok,recortada}; con
clave sigue detalle. Faltante/incorrecta rechaza segun puerta y freno429 no
ejecuta motores ni marca. Solo se marcaron corridas de exito de estos casos.
164 usa motores/proveedores/locks/avisos DOBLES: acepta el envoltorio de respuesta,
NO 11integraciones, mensajes realmente preparados ni exclusividad de publicacion.
Request/Response enproceso con adaptador NextResponse.json, no servidorHTTP.
No se inspecciono CRON_SECRET real ni se llamaron proveedores. No reprogramar.

```comprobar
archivo: src/app/api/cron/prospectos-seguimiento/route.ts
usa: abrirPuertaDeLaTarea en src/app/api/cron/prospectos-seguimiento/route.ts
usa: abrirPuertaDeLaTarea en src/app/api/cron/fiesta-proxima-revision/route.ts
prueba: docs/evidencias/158-tareas-respuesta-publica.mjs
prueba: docs/evidencias/160-retest-portales-tareas.mjs
prueba: docs/evidencias/164-once-tareas-respuestas.mjs
```
