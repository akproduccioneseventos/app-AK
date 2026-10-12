# 159 - Mantenimiento: confirmacion perdida y dos operadores

NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE.
Antes de programar, pedir su HEAD exacto y contrastar los arreglos existentes.

## Version y responsables

- Codex112, 12/10/2026. HEAD auditado
  `ead1238e9a762b06b158f5a889649231294a76d4`, PR1288 ABIERTA,
  rama `codex/auditoria-97-ia-contexto-20261011`.
- Aplicacion compilada `8fa5b56a2833938541a657dcd15ef88130d24b0e`;
  despues solo documentos y pruebas. Accion, consumidor, gastos y alertas
  sin diferencias con main `99faf4eb061fa46341cfdde6f81b93b3bfb9c73c`.
- Clasificacion: reproducido en entrega visible aislada. Coincide el codigo
  de main, pero NO se probaron estos gastos en Hosting ni en la tanda privada.
- Claude corrige dinero, persistencia y este consumidor, y compila. Codex audita.
  No borrar gastos reales ni agrupar trabajos distintos por fecha/texto/costo.

## P1: repetir despues de perder la confirmacion duplica el gasto

Ruta real `/empresa/activos-fijos/<id>/editar`.
`EditarActivoFijoPage/handleAnotarMantenimiento`, lineas140-202, en
`src/app/(app)/empresa/activos-fijos/[id]/editar/page.tsx`, pasa `registroId`
solo al reintentar una fila pendiente; un mantenimiento nuevo no conserva llave.
`registrarMantenimientoDeEquipo`, lineas134-227 de
`src/app/actions/activos-fijos.ts`, crea otra llave por cada llamada sin ID.
La idempotencia de `saveGastoGeneral` no puede reconocer esas llaves distintas.

Reproduccion de navegador, PC y Pixel7, Firestore emulado real:

1. Anotar un trabajo con costo123.45.
2. La sonda deja que la peticion llegue y termine en HTTP200; luego corta
   SOLO su respuesta al navegador. Antes de reintentar, SDK confirma un
   mantenimiento y un gasto. La pantalla muestra Error al registrar mantenimiento.
3. Pulsar Anotar mantenimiento otra vez, con el mismo borrador.
4. SDK confirma DOS filas y DOS gastos123.45: total246.90 por el mismo trabajo.

No fue un doble clic artificial, ni se simulo exito del servidor: `route.fetch`
ejecuto la accion real y se leyo su cuerpo antes de abortar la respuesta.
Evidencia: `112-mantenimiento-fallos-resultado.json`, casos `lost-confirmation-*`,
capturas `112-ack-{lost,retry}-{desktop,mobile}.png` y log comprimido.

Correccion: una identidad estable por operacion NUEVA antes del primer envio,
reutilizada ante respuesta perdida, reintento y doble toque. Solo renovar tras
confirmacion reconciliada o nuevo trabajo deliberado. El servidor debe conservar
la misma identidad y gasto; no cambiar otra vez a pendiente un registro ya completo.
No resolver ocultando el error ni bloqueando todos los futuros trabajos similares.

Aceptacion: perder respuesta despues de guardar y reintentar deja una fila/un gasto;
dos trabajos deliberadamente distintos con mismo texto/fecha/costo dejan dos;
un pendiente reintentado conserva su ID y registra su costo exactamente una vez.

## P1: dos operadores generan dos gastos pero se pierde un historial

Dos paginas reales del mismo equipo, cada una abierta antes del guardado.
Dos trabajos distintos: Operador A10.25, Operador B20.50. Ambos pulsan Anotar
mantenimiento en paralelo; ambos dialogos se cierran como exito.

- PC de esta corrida: dos gastos y dos filas; no afirmar fallo inevitable.
- Celular: DOS gastos10.25/20.50 pero UNA sola fila, la de A.
  El gasto B conserva una llave `mantenimiento:<equipo>:<registro B>` cuyo
  registro ya no esta en el historial. Ver datos e IDs exactos en el resultado.

`registrarMantenimientoDeEquipo` lee/copias/escribe todo el historial y hace
un segundo guardado despues del gasto. Ambos pasos deben conciliar el estado
actual atomicamente, no reponer una copia antigua. Revisar tambien el guardado
manual del editor para no borrar mantenimientos ingresados por otra persona.

Aceptacion: dos operaciones distintas superpuestas conservan ambas filas/gastos,
IDs cruzados correctos, sin reponer flags viejos; reintentos de la misma operacion
no duplican. Probar varias intercalaciones con barrera determinista en pruebas
del servidor, ademas de navegador. Una corrida PC aprobada no garantiza concurrencia.

## Alcance y verificacion

Recorrido base:14/14 criterios PC/celular aprobados, incluido gasto decimal,
historial tras recargar y alerta vencida visible que desaparece tras el service.
El gasto pendiente fue un fixture explicito; NO un fallo inducido a mitad del
servidor. Transporte antes del envio y despues de guardar son casos distintos.
No reabrir orden104: la accion y la alerta ya estan conectadas; estos dos
bordes financieros son nuevos. Propuesta UX aparte: indicar que equipo vence
y enlace a su ficha; no cuenta como defecto que frene aceptacion actual.

Claude debe adjuntar SHA, diff, pruebas focalizadas, compilacion y datos finales.
Regresiones formales bajo tests/e2e: PENDIENTES de crear/ejecutar por Claude;
las sondas existentes reprodujeron fallos, NO aprueban esta correccion.
No declarar solucionado hasta repetir sobre el SHA corregido. No fusionar.

```comprobar
archivo: src/app/actions/activos-fijos.ts
usa: registrarMantenimientoDeEquipo en src/app/(app)/empresa/activos-fijos/[id]/editar/page.tsx
prueba: docs/evidencias/112-mantenimiento-fallos.mjs
```
