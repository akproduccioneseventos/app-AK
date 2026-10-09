# 131. Automatizaciones: permisos internos, reintentos y resultados reales

## ACTUALIZACION PRIORITARIA - No reprogramar los siete bloques originales

Claude fusiono los arreglos durante esta auditoria. Destino contrastado actualizado:
`1b57abbec5162402cc30269cc276398707b28d55` (main, PR 1271/1272), sin PR abierta al
volver a consultar. **22 pruebas / 7 suites aprobaron en ese SHA**; resultado
`docs/evidencias/81-retest-claude.json`. Los bloques originales de abajo son HISTORICO
con criterios, no siete ordenes nuevas. Cuotas, permisos de invitados, parte, reintento
de invitacion y revision web tienen correccion y pruebas focalizadas presentes.

Orden vigente, solo lo que queda:

1. **Gemini, P1, publicacion MANUAL concurrente:** el reclamo protege
   `procesarPosteosProgramados`, pero NO `publishPostInternal`, consumidor directo
   `publicarPosteoAhoraAction` en `src/app/actions/social-media.ts`. Dos solicitudes manuales
   siguen llamando dos veces a Facebook. Sonda real ejecutada en main actualizado:
   `81-publicacion-retest.json`, 1 pasa (TikTok), 1 falla (manual). Reservar en el
   camino comun sin doble reclamo entre cron y accion; no aflojar permisos.
2. **Claude, P1, recordatorio de invitados repetido:** el token y el informe de error
   estan corregidos, pero dos corridas autorizadas del mismo dia crean dos mensajes
   diferentes. `81-invitados-reintento.test.ts` ejecuta GET real + guardado real con
   persistencia simulada: 2 creaciones, esperado 1. `81-invitados-retest.json`.
   Agregar clave duradera por fiesta/invitado/momento y prueba de dos corridas / dos
   instancias; conservar el nuevo permiso y los avisos de fallo.
3. **Gemini, cobertura de cierre:** el mapa sigue omitiendo dependencias compartidas
   indicadas abajo. No dar 14 areas limpias por un inventario incompleto.

TikTok ya NO reinicializa el post con publishId (sonda aprobada). Consultar el estado
final de ese ID queda pendiente de comprobacion: ahora se omite de cron y el publicador
solo consulta al iniciar. Es el resto del ciclo, NO repetir el arreglo antiduplicado.
No afirmar comprobada la integracion externa real. Ampliacion de sonda propuesta pendiente.

Mural/captura/subida se comprobaron con emuladores en la base anterior, sin cambios en
esos consumidores entre ambos SHA. Ver `81-mural-captura-y-entrega.md`; no rehacer la app
para arreglar las semillas antiguas de los tests.

## Historico de la primera base (no orden vigente de reimplementacion)

Area, commit y hallazgos: ver `docs/evidencias/81-automatizaciones-y-cobertura.md`.
Base exacta: main `497ee725cb4d8cce6d1c97422fd674cbbe86c051`, 9/10/2026.
No habia PR abierta al contrastar; verificar la tanda vigente ANTES de programar.
Codex aporta evidencia. Claude: cobros, permisos, cache contable y compilacion.
Gemini: publicador, posicionamiento y cobertura del contador.
No cambiar negocio, credenciales, datos reales ni fusionar automaticamente.

## Claude - AUTO81-CUOTAS (P1)

`ejecutarEscaneoDeRecordatorios` en `src/app/actions/invoices.ts` acepta el token interno,
pero llama `getInvoices`, que vuelve a exigir sesion de CONTABILIDAD.
Consumidor: `src/app/api/cron/recordatorios-de-pago/route.ts` sin cookie del equipo.
Usar lectura interna existente SOLO despues de validar puerta/token. No debilitar la
accion publica. Prueba nueva propuesta PENDIENTE: ruta con clave valida, sin cookie,
facturas ficticias y proveedor simulado; clave invalida rechazada, fallo de lectura visible.

## Claude - AUTO81-INVITACION-RETRY (P1)

`src/lib/invitaciones/recordatorio-no-abiertas.ts` envia Gmail/Meta y crea mensajes
aleatorios dentro del callback de `actualizarFiesta`. En Firestore ese callback se ejecuta
dentro de una transaccion que puede reintentarse: el envio externo no se deshace.
Consumidor: `src/app/api/cron/recordar-invitacion-no-abierta/route.ts`.
Reservar atomicamente, enviar fuera del callback reintentable, guardar estado duradero.
No reintentar a ciegas cuando el proveedor acepto pero se perdio la respuesta.
Revisar tambien `src/lib/whatsapp/avisos-al-cliente.ts` por el mismo patron.
Conservar la via publica angosta de RSVP, ya corregida; no reportarla de nuevo.
Prueba nueva PENDIENTE: primer commit aborta, segundo callback reintenta y dos ejecutores
simultaneos; exactamente una entrega y un item de bandeja. Proveedor falso, nunca real.
Revisar la puerta: esta tarea no es inocua si envia mensajes. No se conocen las variables
del servidor publicado; no afirmar que una puerta sin clave este abierta en produccion.

## Claude - AUTO81-INVITADOS-AUTH (P1)

`src/app/api/cron/recordatorio-a-los-invitados/route.ts` llama `saveScheduledMessage`
sin token interno; esa accion en `src/app/actions/scheduled-messages.ts` exige CRM.
Sin sesion, devuelve fallo que la ruta ignora, y contesta `ok:true` con cero mensajes.
Transmitir autorizacion interna despues de puerta valida, reflejar errores reales y
deduplicar por fiesta/invitado/momento. NO eliminar el permiso publico de CRM.
Prueba nueva PENDIENTE: cron sin cookie, dos corridas y fallo de escritura. Un unico
recordatorio por momento; una escritura fallida no se anuncia como completada.

## Claude - AUTO81-PARTE-MANANA (P1)

`getParteDeLaManana` en `src/lib/automatico/parte-manana.ts`, consumidor
`src/app/api/cron/asistente-proactivo/route.ts`: sin cache ni cookie, lecturas protegidas
fallan, `.catch(() => [])` las convierte en vacias y se cachea el parte durante el dia.
Ademas el saldo resta pagos pendientes con `estadoPago !== 'rechazado'`.
Lectura interna autorizada, no cachear lectura fallida como lista vacia; conservar ultima
version valida y distinguir desconocido de sin pendientes. Usar calculo comun de pagos
confirmados (y compatibilidad de estados antiguos segun reglas ya aprobadas).
Pruebas nuevas PENDIENTES: cron sin cookie seguido por lectura del organizador; fallo de
lectura conserva cache valida; pendientes/rechazados no reducen saldo confirmado.

## Gemini - AUTO81-TIKTOK-PROCESSING (P1, reproducido)

`procesarPosteosProgramados` -> `publishPostInternal` en
`src/lib/presencia-digital/publicador.ts`, consumidor cron `publicar-programados`.
Primera corrida guarda `publishId` y deja Programado si PROCESSING. Segunda corrida
vuelve a inicializar publicacion, sin consultar ese ID. La sonda ejecutada obtiene dos
envios donde deberia haber uno. La correccion anterior de no cantar Publicado YA EXISTE.
Consultar el ID pendiente, no repetir init; declarar Publicado solo tras confirmacion.
Prueba aportada: `docs/evidencias/81-publicacion-sondas.test.ts` (FALLA con esta base).
Ampliacion propuesta PENDIENTE: tres corridas, un init, consultas del mismo ID y cierre real.

## Gemini - AUTO81-PUBLICACION-CONCURRENTE (P1, reproducido)

Dos llamadas a `publishPostInternal` leen Programado y envian el mismo post a Facebook.
La sonda ejecutada obtiene dos entregas. El bloqueo del despachador no protege la ruta
directa ni la accion manual. Reservar por post/plataforma atomicamente ANTES del envio;
no meter proveedor dentro de una transaccion reintentable. Conservar ediciones concurrentes
y resultado incierto para evitar repetir una entrega sin confirmacion.
Consumidores: `src/app/api/cron/publicar-programados/route.ts` y
`src/app/actions/tareas-automaticas.actions.ts`.
Prueba aportada: segunda sonda del archivo anterior, FALLA en esta base.
Pruebas adicionales propuestas PENDIENTES: aceptado pero ACK perdido, reserva abandonada,
edicion simultanea, dos instancias independientes con persistencia real del emulador.

## Gemini - AUTO81-SEO-APROBACION-FICTICIA (P2)

`ejecutarRevisionPosicionamiento` en `src/lib/automatico/posicionamiento-diario.ts`
recorre una lista estatica y asigna canonical/metadatos/activa OK sin leer las paginas.
Consumidor: `src/app/api/cron/posicionamiento-diario/route.ts`.
Separar inventario configurado de comprobacion real; no afirmar optimo ante 404,
canonical ausente o red inaccesible. No prometer indexacion ni posicion de Google.
Prueba nueva propuesta PENDIENTE: paginas 200, 404, canonical ausente y red fallida.

## Gemini - Cierre de auditoria: dependencias fuera del contador

En `docs/codex/areas.json` faltan, entre otros, `publicador.ts`, `data-service.ts` y
`budget-share-dock.tsx`. `scripts/codex-limpio.mjs` solo invalida prefijos inventariados.
Una modificacion de esas dependencias puede dejar area limpia sin volver a revisarla.
Completar mapa de dependencias o invalidar conservadoramente las areas afectadas por
archivos compartidos/desconocidos. Nunca convertir ausencia de hallazgos en cobertura total.
Prueba nueva PENDIENTE: cambiar cada archivo omitido invalida el area correcta; misma
version conserva evidencia. No marcar limpias las areas con pruebas pendientes de esta orden.

```comprobar
archivo: src/app/actions/invoices.ts
usa: ejecutarEscaneoDeRecordatorios en src/app/api/cron/recordatorios-de-pago/route.ts
prueba: PENDIENTE prueba de cron sin cookie y con autorizacion valida
archivo: src/lib/invitaciones/recordatorio-no-abiertas.ts
usa: correrTareaRecordarInvitacionNoAbierta en src/app/api/cron/recordar-invitacion-no-abierta/route.ts
prueba: PENDIENTE transaccion reintentada con entrega unica
archivo: src/lib/presencia-digital/publicador.ts
usa: publishPostInternal en src/app/actions/social-media.ts
prueba: docs/evidencias/81-publicacion-sondas.test.ts (retest: manual falla, TikTok pasa)
archivo: src/app/api/cron/recordatorio-a-los-invitados/route.ts
usa: saveScheduledMessage en src/app/api/cron/recordatorio-a-los-invitados/route.ts
prueba: docs/evidencias/81-invitados-reintento.test.ts (retest: dos mensajes, falla)
archivo: src/lib/automatico/parte-manana.ts
usa: getParteDeLaManana en src/app/api/cron/asistente-proactivo/route.ts
prueba: PENDIENTE cache y saldos con autorizacion interna
archivo: src/lib/automatico/posicionamiento-diario.ts
usa: ejecutarRevisionPosicionamiento en src/app/api/cron/posicionamiento-diario/route.ts
prueba: PENDIENTE paginas no comprobadas no dan optimo
```
