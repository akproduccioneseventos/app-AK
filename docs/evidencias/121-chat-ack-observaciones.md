# Codex121: respuesta perdida despues del guardado del chat

NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE.

Fuente compilada: `3a3bc1c673476b75065e8063358c48797c071700`.
Cabeza examinada: `76d0961201172b9f2fee4f2481343cac13248c7b`.
Main remoto: `4c5ef2f9ada29eb852b0ee5c5dd1e0897a651ede`.
PR1293 abierta al comenzar. Codigo de app sin cambios durante esta sonda.

## Defectos comprobados

1. P1: repetir el MISMO POST tras perder su respuesta crea otro presupuesto.
   Widget General visible, API real, Firebase SDK en emulador demo; modelo con
   doble local de protocolo, sin llamadas externas. `route.fetch` completa la
   respuesta HTTP200 y el presupuesto ya existe por1000; SOLO entonces se aborta
   la entrega al navegador. El replay envia el mismo JSON capturado, no una nueva
   solicitud del usuario. PC y Pixel7:1->2 presupuestos, esperado1. IDs diferentes
   y los dos importes1000 constan en `121-chat-ack-resultados.json`.
2. P2: el mensaje visible asegura "No marque nada como hecho" aunque ya guardo.
   Capturas `121-ack-perdido-desktop.png` y `121-ack-perdido-mobile.png`.

## Siguiente correccion, aun pendiente

- Ruta real: `src/app/api/multiagent/message/route.ts` ->
  `src/app/actions/multiagent.ts/sendPersistentMultiAgentMessage` ->
  `sendMultiAgentMessage` -> `src/lib/multiagent/encargado.ts/ejecutarEncargado` ->
  `src/lib/multiagent/assistant-crm-actions.ts/confirmAndSaveAssistantBudget`.
- La UI es `src/components/multiagent/multiagent-widget.tsx/handleSend`.
- Preparar identidad estable ANTES de enviar, conservarla si la confirmacion
  no llega y tras recarga. El mismo intento financiero usa guardado atomico
  asociado al actor verificado, nunca telefono/nombre/fecha.
- Otro presupuesto deliberado, incluso identico, debe seguir permitido.
- Revisar concurrencia real y varios presupuestos dentro de un pedido: no
  mezclar sus identidades ni confundir una confirmacion tardia con otro intento.
- Si el guardado ya sucedio, el error de transporte no puede prometer que no
  sucedio nada. Distinguir resultado incierto de rechazo confirmado.
- Guardar prueba de antes; no convertir un cambio de harness en arreglo de app.
  Para un parche nuevo, nueva fuente congelada y nuevo build, no el build120.

## Limites y limpieza

No se probo doble confirmacion simultanea ni recarga financiera del chat en esta
sonda. Ningun modelo externo, voz, otras herramientas o toda la app certificados.
No se modifico codigo de produccion. Firestore SDK0, los dos servicios propios
detenidos, el agente acotado cerrado; fixtureGuard restauro bytes. Hash de
marketing ajeno `f125e01bdf62a2c6251a4410abe37916082b820b30b105edbe9ee918e814f1e5`.

La prueba siguiente queda PENDIENTE: no hay aceptacion del arreglo121 todavia.

```comprobar
archivo: src/lib/multiagent/assistant-crm-actions.ts
usa: confirmAndSaveAssistantBudget en src/lib/multiagent/encargado.ts
prueba: docs/evidencias/121-chat-ack-probe.mjs
```
