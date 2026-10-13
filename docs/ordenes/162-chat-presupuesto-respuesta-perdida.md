# 162: no duplicar presupuesto del chat al perder la respuesta

NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE.

Responsable de dinero/seguridad: principal Codex autorizado por el dueno, o
Claude si ya trabaja en este arreglo. No pisar una entrega activa. PR1293 abierta
en76d09612 al comprobar; main4c5ef2f9; fuente compilada3a3bc1c6.

## Hecho, no suposicion

`docs/evidencias/121-chat-ack-observaciones.md` y su JSON documentan PC/Pixel7:
widget real guarda presupuesto1000, se pierde SOLO la respuesta completa, se
repite el mismo cuerpo HTTP y aparecen2 documentos en vez de1. La UI ademas
asegura que no hizo nada. No confundir replay con otra cotizacion deliberada.
El proveedor de modelo es doble local; API y Firestore SDK son reales en demo.

## Correccion requerida

1. Revisar las rutas y simbolos en el SHA nuevo antes de editar. Flujo vigente:
   `src/components/multiagent/multiagent-widget.tsx/handleSend` ->
   `src/app/api/multiagent/message/route.ts/POST` ->
   `src/app/actions/multiagent.ts/sendPersistentMultiAgentMessage` ->
   `sendMultiAgentMessage` -> `src/lib/multiagent/encargado.ts/ejecutarEncargado` ->
   `src/lib/multiagent/assistant-crm-actions.ts/confirmAndSaveAssistantBudget`.
2. Identidad estable por intento preparada antes del POST y conservada si falta
   confirmacion, incluidas recarga y doble envio. Asociar al actor verificado;
   no usar telefono, cliente o fecha como clave. Reutilizar el guardado atomico
   existente `src/lib/budget/solicitud-guardado.ts` cuando corresponda, sin crear
   otra proteccion incompatible ni modificar manual/configurador ya cerrados.
3. La misma identidad no puede sobrescribir otra carga ni devolver documentos de
   otro actor. Varias cotizaciones deliberadas siguen siendo varios documentos,
   incluso con el mismo telefono y datos identicos; varios presupuestos dentro
   de un pedido no pueden compartir indebidamente la identidad.
4. Evitar la afirmacion "No marque nada" ante resultado incierto. Mostrar que
   falta confirmar; recuperar la confirmacion sin provocar otra alta.
5. No cambiar formulas, precios, moneda, permisos, descuentos ni datos reales.

## Aceptacion pendiente, no marcar terminada por encontrar simbolos

- Conservar la evidencia anterior sin modificarla para disimular fallos.
- Pruebas focalizadas: nonce invalido, dos actores, carga distinta, doble envio,
  recarga despues de ACK perdido y nueva cotizacion identica deliberada.
- Navegador PC/Pixel7: guardar1/1000, perder ACK, reintentar conserva1, mismoID y
  numero/importe/CRM; un pedido deliberado nuevo agrega exactamente otro.
- Doble confirmacion simultanea sobre SDK real demo; lectura persistente tras
  recarga. No sustituir la prueba de la UI por invocar un helper aislado.
- Nuevo codigo exige build y validacion sobre SU SHA congelado, no build120.
  Una validacion amplia final, no una compilacion por cada edicion.
- SDK0/servicios/agentes cerrados y bytes ajenos restaurados. Registrar SHA y
  resultado observado en YA/ESTADO/evidencias, subir a propuesta abierta y
  comprobar contenido remoto. No fusionar ni declarar todaapp sin errores.

El script indicado abajo existe y reprodujo el fallo, pero la aceptacion del
arreglo y las variantes adicionales estan PENDIENTES de implementacion/ejecucion.

```comprobar
archivo: src/lib/multiagent/assistant-crm-actions.ts
usa: confirmAndSaveAssistantBudget en src/lib/multiagent/encargado.ts
prueba: docs/evidencias/121-chat-ack-probe.mjs
```
