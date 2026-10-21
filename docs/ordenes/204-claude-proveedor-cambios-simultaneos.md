# Orden204 - Portal del proveedor: no pisar cambios ni reactivar un acceso

**NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS.** Responsable Claude por
permisos y guardado. ID AK-CODEX-163-PROVEEDOR-SNAPSHOT. P1. NO implementada.
Juntar con la tanda abierta; no otra propuesta de app por cada variante.

## Fuente y contraste antes de programar

Main9b7ee982c5d6ff1377fccc0490abc85a9cfd8419. Claude publico108e17b43 conserva
todos los simbolos reproducidos. Gemini1337/45a0 conserva persistProvider,
toggleTareaProveedor,confirmarLlegada,addNotaProveedor,updateDataItem ymutateDataItem;
getProveedorByToken difiere por vencimiento. No equivalencia transitiva ni
aceptacion de1337. Contrastar nuevoHEAD antes de corregir; no copiar rama vieja.

Consumidor REAL: src/app/proveedor/acceso/[token]/page.tsx, runAction llama
toggleTareaProveedor,confirmarLlegada yaddNotaProveedor. La misma pantalla limita
acciones simultaneas en UNA ventana; dos ventanas/dispositivos siguen posibles.

## Reproduccion163 y efecto para la persona

Diez casos:4PASS/6FAIL de UNA forma de guardado. Las acciones leen el acceso por
token ANTES de la transaccion. persistProvider entrega el snapshot entero a
updateDataItem. Su transaccion relee existencia pero descarta snapshot.data y
guarda item viejo. La transaccion no vuelve actual el snapshot recibido.

-Dos tareas distintas a la vez: ambas responden success:true, solo la ultima
  queda marcada. Se invirtio el orden y cambia cual se pierde.
-Llegada ynota simultaneas: se pierde la nota o vuelve Pendiente y desaparece
  llegadaConfirmadaEn. Ambas respuestas dicen success:true.
-Desactivar acceso o rotar token entre lectura y commit: guardar el snapshot
  anterior restaura activo:true o tokenviejo. Esta escritura administrativa se
  aplico DIRECTAMENTE al fixture, no se ejecuto una pantalla de administrador.

Controles pasan: secuencial conserva dos tareas, inactivo antes de leer rechaza,
documento borrado no se recrea. mutateDataItem REAL aplicado a dos cambios de
tareas conserva ambos en el mismo doble. El documentoB queda intacto en los
casos correspondientes. No se tocaron pagos/costos/sueldos.

Se ejecutaron acciones y cuerpos updateDataItem/mutateDataItem REALES contra
doble SERIALIZADO del protocolo de transaccion, con dos documentos ficticios.
NO SDK/Firestore real/emulador/HTTP/navegador. No afirmar corrupcion observada
en produccion ni tiempos reales. Recibo:163-proveedor-concurrencia.json/mjs;
incluye respuestas, estado persistido, hashes y contraste por simbolo.

## Confirmacion168 con SDK real - mismo defecto, no otra orden

Candidato Claude108e17b4387237fc921ea12e8d1eb65b20f62ac9, mismos cuerpos que9b7.
168 ejecuta esas diez variantes con Firestore Admin SDK REAL al emulador demo
propio:4PASS/6FAIL, ambas respuestas success aun cuando una tarea/nota/llegada
se pierde. Tambien restaura token/activo tras actualizar esos campos porSDK en
la intercalacion. El mutador positivo conserva ambas tareas tras retries reales.
Hay barreras coordinadas de lectura para forzar el caso, no tiempos inventados.
No cambia la causa ni se reencarga185/193. El timeout de lock del emulador se
resuelve mediante retrySDK; no produjo excepcion ni falso positivo de sonda.
Limpieza:0documentos, APIcleanup200, emulador/proceso cerrados, diffQAfuentes0.

Limites restantes: readData usa adaptador SDK de coleccion; refresh del respaldo
es doble para no generar tareas; noHTTP/navegador ni panel administrativo.
No produccion, proveedor real, cargos o cuentas. Evidencia168-proveedor-sdk.json
y168-ejecucion.json. Ahora SDK de la version defectuosa SI ejecutado; SDK del
ARREGLO y UI siguen PENDIENTES hasta que exista fuente corregida.

## Correccion y aceptacion pendiente

-Reutilizar el patron existente mutateDataItem, o equivalente del repo: validar
  token/activo/vencimiento contra el registro ACTUAL dentro del cambiador y
  cambiar solo tarea/nota/estado solicitados. No dar permisos generales.
-No restaurar token,activo,fiestaId,identidad,tareas ajenas o marcas de llegada
  desde el snapshot viejo. No convertir la respuesta en exito si se rechazo.
-Conservar la semantica actual de toggle; dos tareas DIFERENTES no se pierden.
  Reintentos/doble toggle del MISMO control requieren criterio explicito, no
  inventar deduplicacion por proveedor/nombre/telefono.
-Probar dos ordenes de escritura, llegada+nota, revocacion/rotacion en el medio,
  rechazo/expiracion y otro documento intacto con SDK al emulador aislado.
  Ese SDK y el viaje UI de dos sesiones quedan PENDIENTES, no certificados.
-No parchear updateDataItem global solo para este consumidor ni alterar pagos.
  Claude valida permisos y el conjunto; Codex retestea solo el delta entregado.

```comprobar
archivo: src/app/actions/provider-portal.ts
usa: toggleTareaProveedor en src/app/proveedor/acceso/[token]/page.tsx
usa: confirmarLlegada en src/app/proveedor/acceso/[token]/page.tsx
usa: addNotaProveedor en src/app/proveedor/acceso/[token]/page.tsx
prueba: docs/evidencias/163-proveedor-concurrencia.mjs
prueba: docs/evidencias/168-proveedor-sdk.mjs
```
