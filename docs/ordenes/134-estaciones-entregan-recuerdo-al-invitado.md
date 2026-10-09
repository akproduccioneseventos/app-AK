# Orden 134: terminar la entrega de 360 y Bogue

## Version y reparto

9/10/2026. Area estaciones. Main `859fd23b1175646edc0209cab114241327d302ba`;
sondas sobre build aislado `497ee725cb4d8cce6d1c97422fd674cbbe86c051`.
Pantallas evento, acciones de entretenimiento/fiesta, token de estacion, politica
offline y Storage sin cambios entre esos SHAs. PR 1275/1276 fusionadas por otra
sesion mientras se probaba; no habia PR abiertas al cierre. Nueva rama documental
`codex/auditoria-83-contrato-estaciones-20261009`, no subir a la rama cerrada.
NO CONTRASTADO CON LA TANDA DE PROGRAMACION EN CURSO que no este
subida: comprobar primero los cambios locales de Gemini/Claude, no duplicarlos.

Gemini: identificador/ciclo visual/cola de la 360. Claude: escritura autorizada
estrecha del medio de estacion y sus permisos, sin tocar el guardado general.
Claude compila. Esta orden no implementa los arreglos.

## ENT83-360 (P1): captura guardada en cola, nunca entregada

Reproduccion real en navegador PC: fiesta ficticia habilitada, QR de invitado
`ent-v2` para `plataforma360`, sin cookie del equipo. Pulsar Grabar video y dejar
terminar la captura. No se guarda el medio en el evento; aparece "1 esperando
subida". La traza de navegador contiene:

`[Plataforma360] Error al subir video, comprobando política offline... Error: El modulo de entretenimiento no es valido.`

Tambien contiene reintentos de OfflineSync rechazados con ese mismo mensaje.
No se cortaron solicitudes ni se desconecto internet en esta sonda.

En `src/app/evento/plataforma-360/[fiestaId]/page.tsx:679` la llamada real a
`uploadEntretenimientoMedia` manda `moduleId = plataforma-360`; en
`src/app/actions/fiesta/entretenimiento.actions.ts:30` `MODULE_MOMENT_TAGS` y
`isEntertainmentModuleId` aceptan `plataforma360`, no el nombre de ruta.
La politica `classifyOfflineUploadError` reconoce "invalido" pero no "no es
valido", asi que este rechazo determinista se convierte en reintentos.

Correccion: usar la identidad canonica de la estacion en captura, permiso,
guardado y cola. Recuperar las capturas antiguas que ya tengan el alias de ruta,
sin descartarlas ni duplicarlas. Distinguir rechazo definitivo de falta de red;
no esconder el error ni fingir un QR exitoso. No aceptar modulos arbitrarios.

## ENT83-GUEST (P1): Bogue autorizado para capturar, rechazado al persistir

Reproduccion: Bogue habilitado con permiso de estacion valido para invitado,
sin sesion del equipo; Grabar loop y completar procesamiento. La sonda espera
el medio persistido y recibe cero. Traza:

`[Bogue] Error al subir boomerang: Error: No autorizado para modificar este evento.`

Cadena verificada: `handleAutoUpload` en
`src/app/evento/bogue/[fiestaId]/page.tsx:737` llama `uploadEntretenimientoMedia`;
la accion verifica `hasEntertainmentGuestAccess`, sube a Storage/intenta publicar
y luego llama `saveFiesta` (`entretenimiento.actions.ts:312`). Ese guardado
exige `requireFiestaWriteAccess`: equipo o portal del cliente. Un QR de invitado
no debe tener ninguno de esos permisos generales; falla correctamente ahi.

Correccion de Claude: despues de comprobar permiso de ESTA estacion y evento,
persistir SOLO este recuerdo mediante escritura estrecha y atomica, sin entregar
al invitado permiso para editar la fiesta. Idempotencia por `clientMediaId` y
registro consistente con Storage/mural; si se pierde una respuesta, reconciliar
sin doble archivo/publicacion. No reemplazar la fiesta entera leida antes ni
pisar capturas concurrentes, cobros, contratos, personal o configuracion.

La misma accion tiene otros consumidores: comprobarlos en guest y operador.
No afirmar que fallaron todos por compartir codigo: solo Bogue fue reproducido
en este caso; la 360 encuentra antes el rechazo de identidad.

## Pruebas y evidencia

Sonda `docs/evidencias/83-recuerdos-bytes-original.spec.ts`; resultado bruto
`83-e2e-recuerdos-original.json`, capturas `83-360-pendiente.png` y
`83-bogue-fallo.png`. 360/Bogue fallaron antes de alcanzar la descarga final.
El tercer fallo original, Buzon, fue selector de la sonda (label sin htmlFor),
NO defecto confirmado de guardado; no reprogramar el Buzon por ese timeout.

Al corregir: capture real simulado -> ACK -> una fila del evento y mural -> URL
del emulador HTTP 200 -> MIME/video y bytes descargados iguales al archivo.
Verificar reproduccion real del video, sin sustituirlo por un blob de muestra.
Dos invitados concurrentes y reintento de la misma captura no pierden/duplican.
Token de otra fiesta/estacion y token vencido NO habilitan nuevas escrituras.
Reconexion conserva recuerdos y no comparte capturas entre eventos.
Prueba fisica de brazo/camara/impresora sigue pendiente, no cubierta por emulador.

Los tests productivos siguientes son PROPUESTOS/PENDIENTES, no existen por
escribir esta orden y no se consideran aprobados hasta ejecutarlos en el SHA
corregido. Usar la sonda revisada 83 como base, no aflojar sus assertions.

```comprobar
archivo: src/app/actions/fiesta/entretenimiento.actions.ts
usa: uploadEntretenimientoMedia en src/app/evento/plataforma-360/[fiestaId]/page.tsx
usa: uploadEntretenimientoMedia en handleAutoUpload de src/app/evento/bogue/[fiestaId]/page.tsx
prueba: tests/e2e/estaciones-invitado-entrega-real.spec.ts (PENDIENTE)
prueba: src/__tests__/estacion-guarda-medio-sin-editar-fiesta.test.ts (PENDIENTE)
```
