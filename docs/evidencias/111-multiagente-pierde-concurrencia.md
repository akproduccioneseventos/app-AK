# Multiagente: riesgo de perder chats y aprendizajes concurrentes

Fecha de auditoría: 2026-09-29
SHA exacto de main revisado: `975118a8d2f22868f9cdffc1fa6d8c245ba75fd0`
Clasificación: riesgo confirmado por inspección del flujo de persistencia; NO reproducido en runtime y no verificado en otro SHA. Esta área no está entre los archivos modificados por la PR #1243.

## P2 — Dos conversaciones al mismo tiempo pueden pisarse al guardar

**Chats:** `appendMultiAgentChatTurn` en `src/lib/multiagent/chat-store.ts` hace `readChatState()`, agrega los dos mensajes a la copia leída y termina en `writeChatState(state)`. Este último reescribe `multiagent/chats.json` completo mediante `writeData`. Dos solicitudes que leen antes de escribir parten de la misma copia; la última escritura puede reemplazar el turno o incluso la sesión que guardó la otra solicitud. También puede ocurrir con dos turnos concurrentes de una misma sesión, donde ambas copias parten de la misma lista de mensajes.

**Aprendizajes:** `saveAgentLearning` en `src/lib/multiagent/memory-store.ts` repite el patrón leer `multiagent/memory.json` → modificar perfiles → reescribir estado completo. Aprendizajes simultáneos de agentes pueden desaparecer. No afecta necesariamente el historial de chat y el aprendizaje por la misma operación; son dos documentos/archivos independientes.

**Consumidor:** `sendPersistentMultiAgentMessage` en `src/app/actions/multiagent.ts` llama a `appendMultiAgentChatTurn` y luego a `saveAgentLearning`. La memoria se vuelve a consumir en `runMultiAgent` (`src/ai/flows/multiagent-flow.ts`), que inserta `memory.summary` y los últimos aprendizajes en el prompt del agente. Esto hace que perder un registro también pueda impedir que ese aprendizaje llegue a futuras respuestas.

**Límite:** `writeData` delega el archivo genérico como documento JSON; el almacenamiento consultado usa `set` sin transacción para este objeto. No ejecuté una carrera controlada ni afirmo que haya ocurrido una pérdida real en producción. El código estático sí muestra el read-modify-write sin coordinación entre solicitudes/procesos.

## Corrección que debe evaluar el responsable

Guardar cada conversación/turno y aprendizaje en documentos independientes, o mutar cada archivo dentro de una transacción de Firestore con lectura fresca y reintento. Añadir una prueba con dos operaciones concurrentes que fuerce ambas lecturas antes de escribir y compruebe que sobreviven las dos sesiones/turnos y ambos aprendizajes. No basta una prueba secuencial.

## Verificación

- Código y consumidor contrastados a `975118a8d2f22868f9cdffc1fa6d8c245ba75fd0`.
- No se hicieron llamadas reales al modelo ni escrituras en Firestore.
- No encontré una prueba específica de concurrencia de estos stores en la búsqueda de tests.
- No repetí áreas de CRM, agenda, fiesta, entretenimiento ni las pantallas tocadas por la PR #1243.
- Responsable de programación: Gemini según reparto AK; Codex deja evidencia y no cambia código.
