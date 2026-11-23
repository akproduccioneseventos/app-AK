# Estado actual — 23 de noviembre de 2026

## Publicado
- **#1462** (23/11): órdenes 331 a 334 (menos pantallas, app de Play Store, auditoría del 21/11, redirecciones en un salto).

## En esta tanda (Claude, rama `claude/app-debug-stabilize-m70e6z`)
- Auditoría profunda del 23/11 (nueve hallazgos, todos ciertos). Claude: mirar no escribe (códigos de fiesta calculados con
  `codigoDeFiesta`, sin guardar; reparación de fechas de presupuestos apagada para sesiones de sólo mirar). Pregunta 207-209.
- La lista de fiestas no cargaba en producción: se sacó la escritura que entró con la 1462; la causa exacta no se midió (faltan
  registros del servidor). Si sigue fallando, la orden 335 bloque 7 hace que el error diga el motivo.

## Esperando a Gemini: orden 335 (rama `gemini/orden-335`)
- PDF del itinerario que abre Personal, los cuatro impresos de mesa borrados en `54764d6bd`, ingreso de rentabilidad (plata:
  revisar línea por línea), "al día" sin conexión, presencia digital sin datos, cuenta regresiva con hora, muro y carga.

## Ojo
- La puerta falla seguido por carga de la máquina: `npm run otravez` antes de creer una falla.
- Se llena el disco: borrar `.next` y `test-results` de las copias aparte en el scratchpad.
