# Orden 362 — Robot, vuelta 7: el asistente pide un sí de verdad antes de agendar y los agentes no dicen "al día" sin haber leído

**Para Gemini. Va en la MISMA propuesta que la 350 y la 355 a la 361 (rama `gemini/orden-346`).** Si un bloque se traba,
entregá el resto y avisá cuál faltó. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`. El bloque 2 es de
"quién ve qué": Claude lo revisa línea por línea.

## Por qué
Séptima vuelta del robot (26/11/2026), sobre las áreas asistente y tareas automáticas (mirando el contenido de cada tarea).
Hay cosas que ya están bien: cobrar, borrar, cerrar presupuestos y tocar permisos están prohibidos en las tres puertas
(chat, voz y WhatsApp); el chat del invitado valida su enlace; los saldos usan la misma cuenta que el panel. Claude
confirmó cada punto en el código.
**La migración "Empezar 2027" ya la arregló Claude en esta tanda:** si una lectura falla, no borra nada.

## Bloque 1 — Agendar una reunión pide un "sí" de verdad
`src/app/actions/multiagent.ts` ~344-347 (y igual `preparar_mail`, ~352-355) toma como confirmado
`esUnSi(input.message) || data.confirmado`. `esUnSi` (`src/lib/multiagent/confirmacion.ts` ~5-7) encuentra "si" en
cualquier parte: "agendame con Ana el martes, **si** puede ser a las 10" o "no sé **si** puedo" ya cuentan como sí, y
`data.confirmado` lo pone el modelo (`src/ai/flows/multiagent-flow.ts` ~166). Resultado: se crea el evento en Google
Calendar y **le llega la invitación al cliente** sin que nadie haya confirmado.
Arreglo:
1. La primera vez se responde "¿Confirmo la reunión con Ana el martes a las 10?" y se guarda ese pedido pendiente en la
   conversación.
2. Recién se ejecuta si **el mensaje siguiente** es un sí solo ("sí", "dale", "confirmo", "ok", con o sin signos), no
   una frase que lo contiene.
3. `data.confirmado` que viene del modelo se ignora para esto.
4. Es la misma regla que ya usa la voz (`src/app/api/asistente/voz-en-vivo/accion/route.ts` ~104-110).
5. Que repetir el pedido no duplique el evento: usá un id armado con cliente, fecha y hora en
   `src/lib/google-workspace.ts` ~655-662.

## Bloque 2 — Las propuestas de plata no las ve cualquiera del equipo
`src/lib/asistente/propuestas-service.ts` ~537-550: para quien no es el dueño, una propuesta **sin responsable** se
muestra igual. Por eso las de cobros y boletas que entran por WhatsApp (`src/lib/asistente/por-whatsapp.ts` ~556-566), con
el nombre del cliente y el monto, las ve también quien sólo tiene INSUMOS o NOCHE (`src/app/actions/asistente-proactivo.actions.ts`
~53). Una propuesta de plata (cobro, gasto, boleta, saldo) se muestra sólo a quien tiene CONTABILIDAD o ADMINISTRACION. No
hay que tocar quién puede **aceptarla**: eso ya está cerrado.

## Bloque 3 — Los agentes no dicen "al día" si no pudieron leer
`src/lib/agentes/motor-agentes.ts` ~147-151 (vigilante), ~193-196 (perseguidor) y ~347-349 (cobrador) toman una lectura
fallida como "no hay nada", y `src/lib/automatico/al-entrar-a-la-app.ts` ~402-409 marca la corrida como buena porque `esFalla`
(~112) no mira la marca de lectura fallida. El dueño ve "Al día" y ningún aviso, aunque ese día no se revisó nada. Arreglo:
si la lectura viene marcada (`esLecturaFallida` de `src/lib/marca-de-lectura.ts`), el agente devuelve falla con el motivo y
la corrida no se marca.

## Bloque 4 — El cobrador cuenta los días en Uruguay
`src/lib/agentes/motor-agentes.ts` ~365 hace `Math.ceil((new Date(fechaStr) - ahora) / día)` con "AAAA-MM-DD", que es
medianoche de Greenwich. Entre las 21 y las 24 de Uruguay, una fiesta de mañana da "Faltan 0 días". Usá `diasHastaEnUruguay`,
la que ya usan los recordatorios.

## Bloque 5 — Chat del cliente
1. `src/app/actions/asistente-virtual.ts` ~340 manda `...history` sin tope ni control: limitalo a los últimos 20 turnos y
   aceptá sólo los roles usuario y asistente, con el texto recortado como ya hace el chat del invitado.
2. El resumen del cliente (~283-290) incluye todas las tareas sin completar. Mostrale sólo las suyas (`asignadaA` del cliente,
   `src/types/fiesta.ts` ~1172-1181), no las del equipo.

## Barrido en toda la app
- Confirmaciones por palabra suelta (pregunta 235): `grep -rn "esUnSi\|confirmado" src/app/actions src/lib/multiagent src/lib/asistente`.
  Por cada acción que sale para afuera (calendario, mail o mensaje), ¿se ejecuta sólo con un sí de verdad dado después de la
  pregunta?
- Agentes y tareas que toman una lectura fallida como "nada" (pregunta 210): `grep -rn "readData(" src/lib/agentes src/lib/automatico`
  y mirar si alguno mira `esLecturaFallida`.
- Cuentas de días con `new Date("AAAA-MM-DD")`: `grep -rn "Math.ceil((new Date" src`.
Plata, cobros y permisos: se lista y Claude lo revisa.

## Lo que NO hay que hacer
- No sacar al equipo la posibilidad de agendar desde el chat: sólo pedir el sí de verdad.
- No tocar las reglas de "nunca" del asistente (cobrar, borrar, cerrar, permisos).

## Qué tiene que comprobar la prueba
- `src/__tests__/el-asistente-pide-un-si-de-verdad.test.ts`: "agendame con Ana el martes si puede ser a las 10" no crea el
  evento y pregunta; un "sí" solo en el mensaje siguiente lo crea una vez; repetirlo no crea otro.
- `src/__tests__/las-propuestas-de-plata-no-las-ve-cualquiera.test.ts`: un perfil con INSUMOS no ve una propuesta de cobro
  sin responsable; uno con CONTABILIDAD sí.
- `src/__tests__/un-agente-que-no-leyo-no-dice-al-dia.test.ts`: con la lectura de presupuestos marcada como fallida, la
  corrida del perseguidor no se marca y devuelve el motivo.

```comprobar
usa: esLecturaFallida en src/lib/agentes/motor-agentes.ts
usa: diasHastaEnUruguay en src/lib/agentes/motor-agentes.ts
no-usa: esUnSi(input.message) || Boolean(data?.confirmado) en src/app/actions/multiagent.ts
usa: CONTABILIDAD en src/lib/asistente/propuestas-service.ts
prueba: src/__tests__/el-asistente-pide-un-si-de-verdad.test.ts
prueba: src/__tests__/las-propuestas-de-plata-no-las-ve-cualquiera.test.ts
prueba: src/__tests__/un-agente-que-no-leyo-no-dice-al-dia.test.ts
usa: slice(-20) en src/app/actions/asistente-virtual.ts
```
