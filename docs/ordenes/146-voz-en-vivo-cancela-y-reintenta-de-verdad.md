# Orden146 - Voz en vivo: Cortar y Reintentar tienen que funcionar

NO CONTRASTADO CON LA TANDA DE PROGRAMACION LOCAL NO SUBIDA.

Gemini corrige el ciclo de la interfaz; Claude revisa permisos/costos y compila.
Codex audita, no modifica producto ni fusiona. Fuente ejecutada y main remoto:
9a054620718673f00e10b52f0811cc1af729ba4e, 10/10/2026. PR1286 abierta contiene
documentacion/QA, NO estos arreglos. Antes de programar, contrastar el HEAD de
la entrega real; no reimplementar una correccion que ya haya entrado.

## VOZ94-CORTAR P1 - Cortar antes de recibir la ficha no cancela el inicio

Sonda de navegador en docs/evidencias/94-live-widget.spec.ts, segundo caso.
Respuesta HTTP de la ficha retenida SOLO en QA; camara/microfono falsos NATIVOS
de Chromium. Socket controlado, no Google ni minutos pagos.

1. Equipo abre el asistente en Tareas y pulsa Hablar.
2. POST queda esperando, boton ofrece Cortar; se pulsa Cortar.
3. El panel desaparece. Se entrega despues la respuesta controlada pendiente.
4. Resultado: solicita el microfono, abre un socket, vuelve a mostrar panel;
   el track de audio esta live y no se habia cerrado el socket.

Raw definitivo94-live-final.json: falla micro1 != esperado0, 10.7s.
Adjunto94-artifactos/94-live-final-14-0.json: micro1, sockets1, closes0,
track audio live, panelReopened1. La propia sonda luego detiene los recursos.
No es evidencia de una conexion real con Google: SI del ciclo real de la UI.

Causa: MultiAgentWidget/alternarVozEnVivo aguarda iniciarVozEnVivo; no dispone
de un identificador cancelable mientras espera. cortarVozEnVivo solo detiene
vozEnVivoRef.current, que aun es null. La respuesta tardia puede adquirir el
microfono, crear la sesion y reasignarla despues del corte.

Corregir cancelacion desde ANTES del primer await, con identidad de intento.
Al cortar/cerrar/desmontar/cambiar de contexto, invalidar el intento pendiente;
si llega una ficha o un stream tarde, descartarlo y detener sus tracks. No
reactivar panel ni aceptar callbacks de un intento viejo. La misma garantia
para permiso de microfono demorado, dos inicios y respuesta fuera de orden.
No abrir otro socket/microfono para comprobar que se corto.

## VOZ94-REINTENTO P2 - El segundo toque no reintenta aunque dice Hablar

Primer caso de la misma sonda. POST controlado503 y mensaje de error visible.
Tras el error, titulo del boton vuelve a Hablar. El siguiente toque NO hace
otro POST; el tercero SI. Dos reproducciones, ultima14.349s
(el raw es la autoridad del tiempo). Adjunto94-artifactos/94-live-final-13-0.json:
first1, afterRetry1, afterThirdClick2. No es un error de Google ni la clave.

Causa: iniciarVozEnVivo emite estado cerrada y devuelve objeto detener vacio
en el error. El callback limpia la referencia, pero el await del widget vuelve
a asignar ese objeto a vozEnVivoRef.current. El siguiente clic solo lo limpia.

El estado visual y la referencia deben representar el mismo intento vigente.
Si el inicio fallo/cerro, no guardar una sesion activa. El siguiente toque
debe iniciar UN nuevo intento; no exigir un toque invisible de limpieza.
Conservar mensaje claro y no anunciar una conversacion iniciada si fallo.

## Limites y comprobacion de la correccion

Las 143 pruebas focalizadas94 PASAN, incluidas las unitarias de voz; ninguna
ejercitaba el consumidor del widget en estas dos secuencias. No alterarlas para
exigir el comportamiento defectuoso, ni aceptar un stub que se aprueba solo.
Repetir la sonda real del widget en el SHA corregido, escritorio/celular;
guardar estados, pedidos, tracks y sockets despues del corte y del reintento.
Agregar error de servidor, microfono denegado, cierre mientras conecta y
respuesta tardia. CERO cuentas, fichas, audio, dinero o envios reales como sonda.

Preservar requirePermiso de la ruta, contexto financiero acotado, fichas efimeras,
tope diario/corte duro e interrupcion del audio. No cambiar la politica de
reservas/devolucion de minutos ni aumentar presupuestos de uso sin el dueno.

Compatibilidad EXTERNA, no fallo de conexion demostrado: la guia oficial actual
https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens (15/09/2026)
documenta v1beta; la app usa v1alpha por defecto. El modelo gemini-3.8-live SI
existe en la documentacion. Contrastar la version configurada en Hosting y una
sesion autorizada con Google; no concluir que funciona por los mocks ni cambiar
un modelo valido por suposicion. Provision y socket deben usar la misma version.

Prueba permanente propuesta PENDIENTE de existir/ejecutarse:
tests/e2e/voz-en-vivo-reintento-y-cancelacion.spec.ts. La sonda documental abajo
YA existe y fue ejecutada negativamente, no es una aprobacion ni build.

```comprobar
archivo: src/lib/asistente/sesion-voz-en-vivo.ts
usa: iniciarVozEnVivo en src/components/multiagent/multiagent-widget.tsx
prueba: docs/evidencias/94-live-widget.spec.ts
prueba: src/__tests__/la-voz-en-vivo-cliente.test.ts
prueba: src/__tests__/la-voz-en-vivo-cancela-y-reintenta.test.ts
prueba: tests/e2e/voz-en-vivo-reintento-y-cancelacion.spec.ts
usa: crearControlVozEnVivo en src/components/multiagent/multiagent-widget.tsx
```
