# Orden 135 - IA: conservar tareas, detener voz y control real

9/10/2026. Codex audita, no programa producto. Fuente contrastada:
`main` `1b61295ab977fd6f204ffdab0f190edbd0f0ed6b`.
Tanda abierta: PR 1277, HEAD documental `db355db361f52360c66da022fa0327bd24429bd3`.
No tiene correcciones de producto de estos puntos. Volver a contrastar antes de
programar si cambia main o aparece otra tanda. No rehacer las ordenes 133/134:
sus arreglos ya estan en main via PR 1278; cuatro retests de recorrido aprobaron.

## Fallos Reproducidos

1. **IA86-TAREAS (P1, Gemini):** `crearTareaDesdeMultiagente`,
   `src/app/actions/multiagent.ts:499`, guarda una copia entera con `saveFiesta`.
   Dos llamadas reales simultaneas dicen success, pero la lectura final conserva
   solamente B. Es otro consumidor del patron de copia vieja ya registrado,
   no un nuevo descubrimiento del patron general. Sonda con filesystem real:
   `docs/evidencias/86-multiagente-concurrencia.test.ts` y resultado homonimo JSON.
   Corregir SOLO el alta de tarea usando la mutacion estrecha existente sobre el
   estado actual. Conservar las dos tareas, terceros, dinero y resto de la fiesta.
   No tocar los permisos de Claude ni sustituir el almacen por un mock para aprobar.
   Consumidor real: `sendPersistentMultiAgentMessage` llama al alta; lo usa
   `MultiAgentWidget.handleSend` en `src/components/multiagent/multiagent-widget.tsx`.

2. **IA86-VOZ (P2, Gemini):** `reproducirVozReal`/`detenerVozReal`,
   `src/lib/asistente/reproductor-voz.ts:49/170`. Detener mientras espera POST no
   invalida la respuesta: al llegar crea Audio y llama play. Una solicitud nueva
   tampoco invalida la anterior. Dos reproducciones reales del modulo con fetch
   diferido y audio instrumentado fallan en `86-voz-detener.test.ts`.
   Invalidar solicitudes antiguas, cortar audio/dictado al cerrar/silenciar,
   liberar URLs y no reabrir manos libres por callbacks antiguos. No escuchar
   despues de cerrar. Cubrir el boton real y sus consumidores; no solo la funcion.

3. **IA86-PERMISOS (P1, Claude):** `toggleAgente` y las otras acciones en
   `src/app/actions/agentes-autonomos.ts` solo piden sesion. Con perfil `personal`,
   `puede(..., ADMINISTRACION)` es false pero el toggle llama al guardado global.
   Sonda `86-ia-rutas.test.ts`: guarda requireAppSession/perfiles reales y solo
   sustituye sesion y efectos para no tocar datos. Asegurar permisos del lado
   servidor para configurar, leer historial sensible y ejecutar; conservar
   automatizacion cron con su puerta existente. No basta esconder la pantalla.

4. **IA86-PUBLICIDAD (P2, Gemini, coordinado con Claude):** hay seis agentes en
   defaults y pantalla, pero `ejecutarAgenteManual` no tiene el case de
   `vigilante_publicidad`: el boton individual devuelve "Agente no reconocido".
   Sonda llama la accion real, devuelve success false y nunca llega a su motor.
   Enganchar SOLO el case/import faltante con la proteccion del punto 3.
   No usar esta correccion para activar Meta, cambiar gasto ni publicar.

5. **IA86-INTERVALO (P2, Gemini):** `ejecutarAgentesAutonomos` en
   `src/lib/agentes/motor-agentes.ts:463` ignora `intervaloMinutos` y
   `ultimaEjecucion`. La pantalla promete "Cada 15 min", pero el vigilante corre
   de nuevo a los 60 segundos. Sonda usa motor real, fecha fija y almacen
   controlado: obtiene un registro cuando debian ser cero. Respetar vencimiento
   en ejecucion automatica; el boton manual puede forzar conscientemente.
   Prevenir dos ejecuciones simultaneas con el mecanismo atomico existente;
   no perder historial/configuracion ni disfrazar un error como sin novedades.

6. **IA86-EXITO (P1, Gemini):** `sendPersistentMultiAgentMessage` conserva
   `action.type=create_task` cuando la tarea no pudo guardarse. La respuesta
   dice "No pude guardar la tarea", pero `MultiAgentWidget.handleSend` usa
   ese tipo para mostrar "Tarea creada al toque". Sonda de orquestacion real
   `86-ia-no-falso-exito.test.ts`: destino inexistente y proveedor/almacen
   controlados; texto de error correcto, contrato de exito incorrecto.
   Devolver estado explicito de la ejecucion y mostrar exito SOLO tras el
   guardado confirmado. Revisar consumidores de recordatorio/lead de la misma
   orquestacion sin reemplazar todos los agentes. No considerar la frase del
   modelo evidencia de una accion. El toast se verifico en fuente, no en E2E.

Resultados: `86-ia-resultados.json` (5 casos fallidos correspondientes a cuatro
defectos) y `86-multiagente-resultados.json` (un caso, tarea perdida). Los intentos
anteriores por timeout/mocking incorrecto estan separados: NO son fallos de app.
El falso exito tiene resultado separado `86-ia-no-falso-exito-resultados.json`.
Son seis defectos de IA y siete aserciones fallidas, no siete defectos distintos.
31 controles focalizados existentes aprobaron (`86-ia-controles-resultados.json`);
eso no compensa estos fallos ni certifica voz real o autonomia publicada.

## Pedido Del Dueno: Voz Y Agentes Que Trabajen Solos

Ya existen voz Gemini/fallback telefono, dictado, chat persistente, memoria,
asistentes por contexto, seis agentes y cron. NO crear otros duplicados.
NUEVO: `86-ia-widget.spec.ts` paso en PC y movil: dictado envia una vez,
respuesta real de respaldo usa el reproductor del widget, chat real se conserva
al recargar y denegacion de microfono avisa sin enviar otro mensaje. Fuente main
1b61295a, voz/dictado instrumentados; proveedor dummy, no audio fisico ni TTS
Gemini de pago. Esto NO aprueba interrupcion de voz ni tareas concurrentes.
La prueba `conversacion-en-vivo-con-voz.test.ts` simula su propio dialogo; no
demuestra dos turnos del widget real. Reemplazar/complementar esa evidencia con
widget, envio, respuesta, continuacion, rechazo de microfono, silencio y cierre.
Separar proveedor simulado, TTS real recibido, audio reproducido y escucha fisica.
Tambien `tests/e2e/el-secretario-escucha-y-hace.spec.ts` llama directamente al
speechSynthesis mock para comprobar frases largas: ese tramo evita el widget y
`truncateForSpeech`, asi que no demuestra que el asistente lea la quinta frase.

Propuesta, no funcionalidad entregada: cada trabajo autonomo debe mostrar objetivo,
fiesta/area, responsable, proxima corrida, estado, evidencia, cancelacion y resultado
persistido. Completado solo despues de comprobar la accion final, nunca por una
frase de la IA. Reintentos con identificador estable, tope y motivo de bloqueo.
Memoria con origen, fecha y correccion/aprobacion, no entrenamiento automatico del
modelo ni instrucciones de un invitado que cambien las reglas del equipo.
No abrir acciones de dinero, publicaciones, mensajeria o permisos sin aprobacion.
Alcance de nuevas acciones autonomas pendiente de respuesta expresa del dueno.

Conversacion bidireccional nativa es una opcion aparte, no sinonimo de leer texto:
[Gemini Live](https://ai.google.dev/gemini-api/docs/live-api) permite audio/uso de
herramientas; [TTS](https://ai.google.dev/gemini-api/docs/speech-generation) lee
texto. Evaluar costo, privacidad, compatibilidad e interrupciones antes de cambiar
el camino existente. No instalar ADK ni dependencias de produccion por esta orden.
Ninguna llamada a proveedor real, microfono real o gasto hecha en esta auditoria.

## Friccion Visual Observada, No Otro Fallo De Proveedor

`FR86-PRESENTACION` (P2, Gemini): captura movil del widget muestra un error
tecnico/URL larga que se sale de la burbuja. `buildFallbackResponse` en
`src/ai/flows/multiagent-flow.ts` agrega error.message al contenido; el widget
muestra ese contenido sin quiebre de palabras largas. La falla del proveedor
fue provocada por el entorno dummy, NO diagnostico de Gemini en produccion.
Mostrar aviso humano de respaldo con limitaciones, diagnostico separado para
equipo autorizado y texto contenido en PC/movil. No ocultar fallos ni transformar
respaldo en "todo funcionando". Mantener respuesta y controles accesibles.
No cambiar responsabilidades/autonomia por un redisenio ni crear otro panel.

Claude compila y registra SHA/entorno/resultados tras integrar; Codex retesta SOLO
los consumidores cambiados. No fusionar automaticamente ni prometer 0 errores.

```comprobar
archivo: src/app/actions/multiagent.ts
usa: sendPersistentMultiAgentMessage en src/components/multiagent/multiagent-widget.tsx
prueba: docs/evidencias/86-multiagente-concurrencia.test.ts
archivo: src/lib/asistente/reproductor-voz.ts
usa: reproducirVozReal en src/components/multiagent/multiagent-widget.tsx
prueba: docs/evidencias/86-voz-detener.test.ts
archivo: src/app/actions/agentes-autonomos.ts
usa: ejecutarAgenteManual en src/app/(app)/settings/agentes-autonomos/page.tsx
prueba: docs/evidencias/86-ia-rutas.test.ts
archivo: src/lib/agentes/motor-agentes.ts
usa: ejecutarAgentesAutonomos en src/app/api/cron/asistente-proactivo/route.ts
prueba: docs/evidencias/86-agentes-intervalos.test.ts
archivo: src/app/actions/multiagent.ts
usa: sendPersistentMultiAgentMessage en src/components/multiagent/multiagent-widget.tsx
prueba: docs/evidencias/86-ia-no-falso-exito.test.ts
prueba: docs/evidencias/86-ia-widget.spec.ts
archivo: src/ai/flows/multiagent-flow.ts
usa: runMultiAgent en src/app/actions/multiagent.ts
prueba: docs/evidencias/86-ia-widget.spec.ts (presentacion sin desborde: pendiente)
```
