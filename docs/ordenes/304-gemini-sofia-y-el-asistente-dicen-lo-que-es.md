# Orden 304 — Sofía y el asistente del equipo dicen lo que es (13/11/2026)

**Para Gemini.** Va **en la misma propuesta que la 297 a 303** (la 1393). Antes de "terminé": `docs/ANTES-DE-ENTREGAR.md`.
Sale de la evaluación de Sofía y del multiagente como agente (13/11/2026). Sólo lo roto; las mejoras las decide el dueño.

## Lo que NO se toca

- El reloj y la promoción del simulador; Sofía sin audio para el público (decisión del 19/10: el invitado y el público, sólo texto).
- Que los mensajes a clientes no salgan solos.
- El pedido de teléfono como paso del simulador (sólo cambia cuándo se muestra el error).

## Barrido en toda la app (Claude, 13/11/2026)

- **Respuestas ocultas:** `visibleMessages` en `src/components/multiagent/multiagent-widget.tsx` ~538 descarta todo mensaje con
  `agentType` distinto del agente activo. Cuando el enrutador deriva a un especialista, la respuesta queda guardada y no se ve.
- **Sofía improvisa los paquetes:** `src/app/actions/simulador-copilot.ts` arma el contexto, pero la composición de cada paquete la
  redacta el modelo. Historia recortada a 12 mensajes de 600 caracteres (~137).
- **Disponibilidad:** sólo hay chequeo con fecha exacta (~391); con un mes entero Sofía igual afirma "tenemos disponibilidad".
- **Promesa sin función:** "te avisamos al instante si alguien consulta por tu fecha" no existe en el código.
- **Error de teléfono repetido:** `src/app/simulador-ak/page.tsx` muestra "Por favor, ingresá un número de teléfono móvil…" debajo de
  cada respuesta una vez que el paso quedó esperando el celular.

## Bloque 1 — Toda respuesta se ve (P1)

En `multiagent-widget.tsx`, la respuesta de un especialista se muestra en el chat activo con el nombre del agente que contestó
("Agente de esta Fiesta"). No filtrar por `agentType` los mensajes de la conversación en curso. Prueba (Jest del componente o de la
función de filtro): una pregunta en "General" contestada por el agente `fiesta` aparece en pantalla.

## Bloque 2 — Los paquetes salen de una ficha fija (P1, lo ve el prospecto)

Pasarle a Sofía, en el contexto, la lista exacta de servicios de cada paquete tal como está en el catálogo, con la instrucción de
**copiarla y no completarla**. Si pregunta otra vez, la misma lista. Prueba: el texto armado para el contexto contiene los servicios
del catálogo del paquete Intermedio y no suma los del Premium.

## Bloque 3 — Disponibilidad y promesas (P1)

- Sin fecha exacta verificada, Sofía dice "lo confirmamos con la fecha exacta" y no afirma que hay lugar.
- Sacar del prompt y de cualquier texto la promesa de "avisarte si otro consulta por tu fecha".

## Bloque 4 — El teléfono se pide una vez (P2)

El aviso de teléfono inválido sale cuando la persona escribe un teléfono mal, no debajo de cada respuesta de Sofía.

## Pruebas

```comprobar
archivo: src/components/multiagent/multiagent-widget.tsx
prueba: src/__tests__/el-asistente-muestra-la-respuesta-del-especialista.test.ts
prueba: src/__tests__/sofia-no-improvisa-paquetes-ni-fechas.test.ts
```
