# Codex121/orden162: presupuesto del chat, intento estable y resultado incierto

Fuente congelada `87b74b7d809f2524c2d0fcade0176749f5f5c02a`.
NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE. No fusionar PR1293.

El widget crea una identidad antes de enviar y guarda SOLO UUID+huella en
sessionStorage por contexto. Mantiene el texto al fallar, no afirma que no hubo
operaciones; pide revisar otras acciones antes de repetirlas. El mismo intento
financiero llega por API/actions/Encargado al guardado atomico existente; cada
presupuesto dentro del pedido tiene ordinal propio. El actor se verifica en el
guardado, no viene del navegador. Si cambia la carga calculada, rechaza sin
sobrescribir ni duplicar. Otra cotizacion deliberada usa identidad nueva, incluso
con datos identicos; no hay deduplicacion por telefono/nombre/fecha.

## Resultado observado

-734suites4600tests,0fallos/omitidos; build con tipos/lint, acentos2860 PASS.
-16recorridos PC/Pixel7 con interfaz real -> API real -> Firestore SDK demo.
 El proveedor de protocolo Gemini es un DOBLE LOCAL, ninguna llamada externa.
-Corte antes de enviar:0documentos, reintento visible guarda1/1000.
-Otro pedido deliberado guarda segundo presupuesto, se pierde SOLO el ACK
 completado: mensaje honesto visible. Recarga + reenvio visible conserva2,
 mismos IDs/numeros/importes y CRM, con la misma identidad del intento.
-Replay HTTP identico y dos confirmaciones simultaneas conservan esos2.
-Nueva cotizacion identica agrega tercera/1000, con telefono y nombre iguales.
-Dos primeras confirmaciones simultaneas de una identidad nueva agregan una
 sola cuarta; numero4, total1000, contador4 y documentos anteriores intactos.
-Identidad invalida:400 antes del modelo y de escribir.
-Documento /ver visible y persistente despues de recargar en ambas pantallas.
-SDK0, dos servicios propios detenidos, agente acotado cerrado, bytes originales
 restaurados. Salida1 de servicios es terminacion intencional del proceso, no
 fallo de la app. Hash del archivo de marketing ajeno intacto.

El baseline `121-chat-ack-resultados.json.gz` sigue mostrando el fallo1->2 de
fuente3a en PC/Pixel7. No se edito para hacer pasar la prueba vieja. La aceptacion
nueva es `121-chat-aceptacion-resultados.json.gz` y `121-aceptacion.json`.

## Limites

PASS_CHAT_BUDGET_ACK_ONLY no significa IA completa ni app lista. Las otras
herramientas/efectos del chat no obtienen idempotencia con este cambio; tampoco
se probo un modelo externo, voz, respuestas no deterministas, tiers/menus/
descuentos IA, otras roles, Hosting/OAuth,19documentos originales ni dispositivos.
Catalogo cambiante/fecha inferida pueden rechazar una carga distinta en reintento,
sin duplicarla. La compilacion conserva avisos previos face-api/hooks/img; no
se borraron dependencias ni se deshabilitaron pruebas para ocultarlos.

Grafo actualizado local:14621nodos/43864relaciones/931comunidades,0LLM. Sus25
avisos parciales del parser no son errores TS: build y tipos pasaron.

```comprobar
archivo: src/lib/multiagent/intento-presupuesto.ts
usa: clavePresupuestoChat en src/lib/multiagent/encargado.ts
prueba: docs/evidencias/121-chat-aceptacion-probe.mjs
```
