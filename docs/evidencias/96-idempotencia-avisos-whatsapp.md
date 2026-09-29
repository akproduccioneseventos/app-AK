# Auditoría — idempotencia de avisos WhatsApp en PR #1240

Fecha: 2026-09-28
Revisor: Codex
Rama candidata: `feat/orden-95-a-la-par-del-rubro-en-toda-la-app`
HEAD exacto: `79dae2cd75f1ffc572f28f6ee890174c3912fff8`
Base declarada por GitHub: `main` en `b52b1f013d21bd2831b918fb04649636ce24033a`
Estado: PR abierta; este flujo nuevo no está demostrado como publicado.
Clasificación: defecto de idempotencia visible por inspección del código de la rama pendiente; no reproducido dinámicamente por Codex.

## Hallazgo P2: dos corridas o un reintento pueden dejar avisos duplicados en la bandeja

- `src/app/api/cron/avisos-al-cliente/route.ts`, consumidor real: llama directamente a `correrTareaAvisosAlCliente` en GET/POST tras autenticar con `abrirPuertaDeLaTarea`. Esa puerta verifica CRON_SECRET/rate-limit, pero esta ruta no adquiere el candado de tareas automáticas.
- `src/lib/whatsapp/avisos-al-cliente.ts`, `procesarAvisosAlClienteParaFiesta`: crea un registro nuevo vía `saveScheduledMessage` (ID aleatorio) y después marca `fiesta.avisosPreparados[reglaId]` en memoria.
- `correrTareaAvisosAlCliente` persiste `fiestas.json` únicamente después de terminar el recorrido. No hay clave idempotente/operación transaccional que vincule la creación del mensaje con esa marca.
- Por lo tanto, dos ejecuciones simultáneas pueden leer la misma fiesta sin marca y crear dos mensajes. También es posible un reintento si el mensaje se creó pero falla la escritura posterior de `fiestas.json`. La deduplicación visible en el código no cierra esas ventanas.
- Impacto acotado: estos avisos quedan como `pendiente` y `sendingMode: 'manual_click'`; no se envían solos. El equipo podría ver duplicados y enviar dos recordatorios por error.
- La prueba `src/__tests__/los-avisos-al-cliente-quedan-en-la-bandeja.test.ts` invoca dos veces secuencialmente el procesador sobre el mismo objeto mutado. No cubre dos corridas concurrentes ni el fallo entre crear el mensaje y persistir `fiestas.json`. Codex no ejecutó la prueba.

## Corrección a pedir después de cerrar la auditoría

Gemini debe hacer la creación idempotente con una clave estable por fiesta/regla (y el alcance temporal que el producto ya decidió), resistente a concurrencia y reintentos en el almacenamiento usado por producción. Mantener el envío manual: no convertirlo en envío automático. Agregar pruebas con dos corridas concurrentes y con fallo/reintento luego de crear el mensaje. Antes de implementar, confirmar el esquema Firestore usado por la bandeja y que no se borren/reemplacen mensajes existentes.

## Alcance / no comprobado

No se llamaron endpoints reales, no se enviaron WhatsApps, no se accedió a datos productivos y no se corrieron tests/builds. El finding aplica al HEAD indicado de PR #1240, no debe etiquetarse como fallo de producción. La tarea diaria/runner externa no se verificó en runtime.

