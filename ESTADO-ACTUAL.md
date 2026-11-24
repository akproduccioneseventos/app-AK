# Estado actual — 23 de noviembre de 2026

## Publicado hoy
- **#1462** (órdenes 331-334), **#1463** (mirar no escribe, orden 336), **#1464** (orden 335 + escaneos 211, 212, 214).

## En esta tanda (Claude, rama `claude/app-debug-stabilize-m70e6z`)
- Auditoría general maestra: la lista de fiestas daba error en producción en nueve pantallas. Arreglado lo que un documento
  raro rompía (objeto plano con `aObjetoPlano`, número del documento, 15 s, historial sin `configuracion`) y el tablero sin
  invitados. **La causa exacta no se midió** (sin registros del servidor): si el dueño ve que sigue, la orden 337 bloque 5.
- Orden 337 para Gemini, preguntas 215-217 (216 y 217 con escaneo).
- Auditoría funcional (PDF de 40 páginas, 15 hallazgos) → orden 338, preguntas 218-226 (218 y 220-224 con escaneo). H14
  (10% del manual) es la promoción del dueño: queda.

## Para Gemini, en orden
- **339 primero** (el auditor robot, pedido del dueño: que cada auditoría no traiga una tanda nueva).
- **336** (`gemini/orden-336`): su auditoría de 99 avisos. **337** (`gemini/orden-337`): la general maestra. **338**
  (`gemini/orden-338`): la funcional.

## Ojo
- La puerta falla seguido por carga de la máquina: `npm run otravez`, y si la app no cambió la puerta repite sólo lo fallado.
- La corrida en segundo plano se corta a los 30 min si se lanza con el tiempo por defecto: lanzar con el máximo.
- Se llena el disco: borrar `.next` y `test-results` de las copias aparte en el scratchpad.
