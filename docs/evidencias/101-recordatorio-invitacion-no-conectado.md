# Auditoría — recordatorio automático de invitaciones, PR #1240

Fecha: 2026-09-28
HEAD candidato: `79dae2cd75f1ffc572f28f6ee890174c3912fff8`
Base GitHub: `main` en `b52b1f013d21bd2831b918fb04649636ce24033a`
Estado: PR abierta. Función nueva; no demostrado en producción.
Clasificación: implementación incompleta/riesgo de envío en la tanda pendiente. Revisión estática; Codex no ejecutó tests ni envió email/WhatsApp. La orden 95 sí aprobó expresamente el recordatorio y su interruptor prendido por defecto; respetar ese comportamiento autorizado.

## Hallazgos P2

### 1. La tarea nueva no está conectada al ejecutor automático

Existe `correrTareaRecordarInvitacionNoAbierta` en `src/lib/invitaciones/recordatorio-no-abiertas.ts`, y el test la llama directamente. En el HEAD inspeccioné los consumidores que la orden exige:
- No hay referencia a ese símbolo en `src/lib/automatico/al-entrar-a-la-app.ts`.
- `src/lib/automatico/tareas-automaticas.ts` sólo conserva la tarea previa `recordatorio-a-los-invitados`; no registra `recordar-invitacion-no-abierta`.
- `src/lib/automatico/puerta-de-las-tareas.ts` no reconoce la nueva tarea.
- El único endpoint cron añadido por esta PR es `src/app/api/cron/avisos-al-cliente/route.ts`; no se agregó ruta para el recordatorio de invitación. El endpoint existente `recordatorio-a-los-invitados` importa y ejecuta su propio flujo anterior, no la función nueva.
Por ello, la prueba directa de la función no demuestra que el recordatorio diario se ejecute solo.

### 2. La integración Gmail no coincide con la función real y la prueba lo oculta

El flujo en `recordatorio-no-abiertas.ts` llama `sendGoogleGmailMessage` con un solo objeto `{to, subject, text, html}`, usando cast a `any`. En `src/lib/google-workspace.ts` del mismo HEAD la firma real requiere `(account, to, subject, html, attachment?)`; usa `account.accessToken`. Además, la implementación real devuelve la respuesta de Gmail (con `id`), pero el nuevo caller sólo considera éxito si existe `resGmail.enviado`. Aunque el envío lograra completarse, no se registraría como éxito ni se agregaría `recordatoriosApertura`.
La prueba `la-invitacion-no-abierta-se-recuerda-sola.test.ts` mockea Gmail para aceptar un único objeto y devolver `{ enviado: true }`, incompatible con la firma y respuesta reales. Por eso pasa sin comprobar la integración.

### 3. Fallos y reintentos pueden quedar ocultos o crear borradores repetidos

- La rama Gmail que cae en `catch` no incrementa `fallados`; una corrida puede reportar cero fallos aunque el email haya fallado.
- Si WhatsApp falla, se crea un borrador `manual_click`, pero no se anota `recordatoriosApertura`; una repetición de la tarea el mismo día vuelve a intentar/enqueue y no hay idempotency key para evitar otro borrador.
- La marca de envío se escribe al final en `fiestas.json`; si Gmail/Meta acepta el envío y luego falla esa escritura, un reintento puede volver a enviar.

La prueba “no le escribe dos veces” cubre el camino exitoso con estado mutado; no simula falla, repetición del mismo día tras fallo ni éxito externo seguido de fallo de persistencia.

## Qué se verificó

La función sí filtra a quien abrió, respondió RSVP o no tiene contacto; limita fechas a 21/10 días y usa `recordatoriosApertura` tras éxito. El test cubre token válido/inválido y un caso de WhatsApp/Gmail mockeados. No se corrió. No se verificó runtime de Gmail, credenciales ni cron.

## Instrucción para Gemini, al cerrar la auditoría

Conectar la función nueva a los mismos puntos documentados en la orden 95 (registro de tarea, puerta, runner y ruta protegida). Integrar Gmail con la cuenta OAuth real y la respuesta real; probar la firma y resultado con un mock fiel. Registrar fallos por canal y hacer idempotente la creación/registro para reintentos sin duplicar envíos/borradores. Mantener la regla de 21/10 días en calendario de Uruguay y los filtros de apertura/RSVP/contacto. Claude compila e informa SHA/entorno/salida. No cambiar el default-on elegido por el dueño sin consultarlo.

