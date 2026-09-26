# 91. La captura debe sobrevivir al servidor y a una IA lenta

## Contraste antes de programar

Codex, 26/09/2026. Revisado main `63dace0c83f990b8610833a56fb825624837ad6f`,
con PR 1230 y 1231 fusionadas. GitHub no devuelve PR abiertas al consultar esta tanda.
No es evidencia de que ese SHA este desplegado. Antes de implementar, comparar cualquier
nueva rama que aparezca: no repetir trabajo. Gemini implementa; Claude compila y valida.

## Resultado comprobado

La sonda `docs/evidencias/1231-contraste.cjs` ejecuta codigo real transpilado, con transporte,
almacenamiento y reloj simulados. Resultado: **6 comprobaciones pasan, 2 no pasan**.
No es una prueba de navegador, IndexedDB real, proveedor IA ni equipo fisico.

- El helper `terminarTrabajoIA` devuelve correctamente los cuatro destinos: subida,
  guardada localmente, rechazada y no guardada. No rehacer ese arreglo.
- Con respuesta normal del servidor, `handleCapture` guarda la original y encola el trabajo.
- La cola respeta la retencion antes de que venza.

## P1. La original espera al servidor antes de guardarse

En `src/app/evento/touchpix/[fiestaId]/page.tsx`, `handleCapture` (linea 559),
la llamada a `updateEntertainmentSessionStatus` se espera en la linea 565, antes de
`guardarOriginalRetenida` (608/629). Si esa llamada queda pendiente, no hay respaldo ni
trabajo encolado. La sonda mantiene pendiente SOLO esa llamada: obtiene cero guardados y
cero trabajos; al liberarla, obtiene uno de cada uno. Recargar durante esa espera pierde
la captura aun cuando IndexedDB funcionaba. El catch solo ayuda cuando la llamada rechaza.

Guardar durablemente la captura antes de depender de esa respuesta. Conservar la proteccion
contra respuestas de otra captura; no volver a avisos tardios sin identificador ni agregar
reintentos ciegos a escrituras. La solucion debe preservar la correlacion, no quitarla.
Prueba de aceptacion pendiente: demorar el aviso de sesion, comprobar el respaldo, recargar
y recuperar la original sin esperar al servidor. Repetir con dos capturas consecutivas.

## P2. Tres minutos no demuestran que se cerro la pantalla

`RETENCION_DE_LA_ORIGINAL_MS` vale 180000. `procesarColaSinTraba` en
`src/lib/offline/offline-sync-manager.ts` solo compara esa fecha: no sabe si el trabajo
sigue pendiente/procesando. Con una cola larga (maximo dos IA simultaneas), puede vencer
antes de terminar. La sonda avanza el reloj, ejecuta la cola real y luego el final real:
se envian `original.jpg` y `ai-result.jpg`. Son dos versiones distintas; deduplicar bytes
identicos no resuelve este caso.

Mantener el rescate al cerrar/recargar, pero distinguir trabajo vivo de abandonado y
coordinar cola y finalizacion, incluso entre pestanas. No basta aumentar el plazo fijo.
No se solicita servidor de colas pago ni nuevas funciones. La politica documentada es
publicar la original como rescate, no ambas mientras la IA sigue trabajando.
Pruebas pendientes: trabajo activo por mas de tres minutos; acumulacion de capturas;
recarga real; sincronizacion simultanea con finalizacion; segunda pestana.

## Limites y entrega

La revision estatica tambien confirma el nuevo identificador por captura y el uso del
consentimiento guardado. No se volvieron a ejecutar aqui el build de Claude, todos los E2E,
ni las seis estaciones de la orden 90 en navegador. No declarar toda la app aprobada.
Conservar el ensayo fisico de `docs/ENSAYO-EN-EL-SALON.md` como pendiente externo.

Una sola entrega de correccion con estos dos puntos y evidencia sobre su SHA final.
Este documento no inicia otra IA. No fusionar esta rama de documentacion por separado.

```comprobar
archivo: src/app/evento/touchpix/[fiestaId]/page.tsx
usa: guardarOriginalRetenida en src/app/evento/touchpix/[fiestaId]/page.tsx
archivo: src/lib/offline/offline-sync-manager.ts
usa: processOfflineMediaQueue en src/components/offline/sync-status-indicator.tsx
# Ejecutada: 6 pasan y 2 fallan; sonda aislada, no E2E.
prueba: docs/evidencias/1231-contraste.cjs
# Propuesta: pendiente de crear y ejecutar.
prueba: tests/e2e/91-captura-con-servidor-e-ia-lentos.spec.ts
```
