# PARA GEMINI - Orden 190: hablarle a la app como en una llamada, y que haga las cosas

**Una sola propuesta con todos los bloques.** Si un bloque se traba, entregá el resto igual en la misma
propuesta y avisá cuál faltó. Antes de decir "terminé", pasá `docs/ANTES-DE-ENTREGAR.md` entero. **Toca
permisos y plata: nombra el candado** (`src/__tests__/el-candado-de-la-plata.test.ts`), y cada acción
nueva lleva su prueba de "alguien sin permiso".

Arrancá de la rama `claude/app-debug-stabilize-m70e6z` de hoy, encima de las órdenes 188 y 189.

## Lo que pidió el dueño (19/10/2026)

Hablarle a la app como en una llamada. Que conteste, diga lo que falta y haga la tarea en el momento.
**Un solo asistente para todos**, que contesta según quién habla:

- la contadora pregunta quién falta pagar;
- la secretaria, qué reuniones tiene;
- el organizador, qué falta de la fiesta;
- el dueño, cualquier cosa.

## Lo que ya existe (no lo rehagas)

- **La llamada en vivo:**
  - `src/lib/asistente/sesion-voz-en-vivo.ts` (el socket, el micrófono y el audio);
  - `src/lib/asistente/control-voz-en-vivo.ts`;
  - `src/lib/asistente/voz-en-vivo.ts` (`armarCuerpoFicha`, `armarInstruccionesDeVoz`,
    `resumirContextoParaVoz`);
  - la ruta `src/app/api/asistente/voz-en-vivo/route.ts`, con la ficha de un solo uso y el tope de
    minutos por día;
  - el botón "Hablar" en `src/components/multiagent/multiagent-widget.tsx`.
- **Lo que el asistente puede hacer y cuánto riesgo tiene:** `src/lib/asistente/que-puede-hacer-solo.ts`.
  - `nivelDeRiesgo(accion)` devuelve `'solo' | 'pregunta' | 'nunca'`.
  - `registrarAccionAsistente(...)` deja el rastro.
- **Las acciones del secretario:** `ejecutarAccionSecretario` en `src/app/actions/multiagent.ts` (~729).
  Hace agendar reunión con confirmación, ver mi semana, preparar mail, buscar en la web y cuánto me deben.
  "Cuánto me deben" ya pide CONTABILIDAD (~910).
- **Lo que falta de una fiesta:** `calculateFiestaPreparationScore(fiesta).importantPending` en
  `src/lib/fiesta/preparation-score.ts` (~97).

## Bloque 1 — la llamada para todo el equipo, cada uno con lo suyo

Hoy la ruta (~55) deja entrar sólo a ADMINISTRACION o CONTABILIDAD, porque el contexto lleva saldos.

- **Que entre cualquier perfil interno con sesión.** Los invitados y los clientes no.
- **El contexto se arma según el perfil**, en una función nueva `contextoDeVozParaPerfil(usuario)` en
  `src/lib/asistente/voz-en-vivo.ts` (o un archivo al lado, **sin** `'use server'`):
  - **Todos:** las fiestas de los próximos 30 días (nombre, fecha, días que faltan) y la agenda de hoy y
    de la semana.
  - **ORGANIZACION:** por cada fiesta de los próximos 30 días, los 3 primeros de `importantPending`.
  - **CONTABILIDAD:** lo que debe cada cliente y las cuotas vencidas, lo mismo que hoy da
    `buildMultiAgentTeamBriefing`.
  - **CRM:** los prospectos para seguir hoy.
  - **Sin CONTABILIDAD, el texto no lleva ningún monto, saldo, seña ni cuota.** Usá `puede(usuario,
    PERMISOS.X)` de `src/lib/auth/perfiles.ts`. No preguntes por `role === 'admin'`.
- **Al empezar la llamada, el asistente saluda con lo más urgente de ESE perfil**, en una o dos frases.
  Por ejemplo: "A la fiesta de Sofía, que es en 12 días, le falta el menú y la música".

## Bloque 2 — que haga las cosas en la llamada

Hoy la instrucción dice *"No ejecuto acciones por voz"* (`voz-en-vivo.ts` ~124). Eso cambia así:

- **Herramientas en la ficha:** declarás las herramientas en `armarCuerpoFicha` (`tools` →
  `functionDeclarations`, dentro de la configuración que va en la ficha restringida). Son éstas:
  `crear_tarea`, `anotar_recordatorio`, `agendar_reunion`, `ver_mi_semana`, `cuanto_me_deben`,
  `que_falta_de_la_fiesta`, `preparar_borrador_whatsapp` y `preparar_mail`.
- **En el navegador:** en `sesion-voz-en-vivo.ts`, cuando llega un `toolCall` por el socket (~296), lo
  mandás a una ruta nueva `src/app/api/asistente/voz-en-vivo/accion/route.ts` y le devolvés al socket la
  `toolResponse` con lo que contestó.
- **En la ruta nueva**, en este orden:
  1. Pide sesión de un perfil interno.
  2. `nivelDeRiesgo(accion)`:
     - `'nunca'` → no hace nada y contesta "Eso lo tenés que hacer vos desde su pantalla".
     - `'pregunta'` → sin `confirmado: true` no hace nada y contesta qué va a hacer, para que el asistente
       pregunte "¿lo hago?". Lo que toca plata o fechas lo confirma sólo el dueño, con la misma regla de
       `aceptarPropuesta` en `src/lib/asistente/propuestas-service.ts` (~255).
     - `'solo'` → lo hace.
  3. Cada acción pide el **mismo permiso que su pantalla**. Por ejemplo, `cuanto_me_deben` pide
     CONTABILIDAD, como ya hace `ejecutarAccionSecretario`.
  4. Deja el rastro con `registrarAccionAsistente`.
  5. **Que no se haga dos veces:** cada `toolCall` trae su `id`. Si ese `id` ya se hizo, devolvés el
     resultado anterior y no repetís la acción.
- **Instrucción nueva**, en vez de la de ~124: *"Cuando te piden algo, usá la herramienta. Si la
  herramienta dice que hay que confirmar, preguntá '¿lo hago?' y sólo con un sí claro volvé a llamarla
  confirmada."*
- **Lo que nunca hace, aunque se lo pidan** (regla del dueño): mandarle un mensaje a un cliente o
  prospecto (sólo lo deja preparado), cobrar o marcar pagado, facturar, cerrar un presupuesto, tocar
  permisos o borrar.
- **Lo que se hizo queda escrito en el chat del asistente**, para verlo después.

## Bloque 3 — "¿qué falta de la fiesta de Sofía?"

`que_falta_de_la_fiesta` busca la fiesta por nombre entre las próximas. Si hay dos parecidas, pregunta
cuál. Contesta con `importantPending` en criollo y pide ORGANIZACION.

## Bloque 4 — siempre a mano, como un asistente de bolsillo (pedido del dueño: "similar al Dot")

- **Un ícono propio "Hablar con AK"** en el teléfono:
  - `public/manifest.json` → `shortcuts` con "Hablar con AK" a `/mi-dia?hablar=1`. Es la entrada que
    aparece al mantener apretado el ícono de la app instalada.
  - Con `hablar=1`, `src/components/multiagent/multiagent-widget.tsx` abre directo en la pantalla de
    llamada, con un solo botón grande "Hablar". El navegador exige un toque para prender el micrófono:
    **no intentes arrancarlo solo**.
- **El asistente te busca a vos cuando hay algo urgente**, sin esperar que lo abras:
  - El despertador `src/app/api/cron/asistente-proactivo/route.ts` ya junta lo urgente. Cuando hay
    algo de prioridad alta, manda un aviso al teléfono con `src/lib/firebase/server-messaging.ts`.
  - **El aviso va a cada persona según su perfil** (la misma regla del bloque 1): a la contadora, lo
    que falta cobrar; al organizador, lo que falta de una fiesta. Si el teléfono guardado no tiene a
    quién pertenece (`requestAndSaveFcmToken(userId)` en `src/lib/firebase/messaging.ts`), el aviso va
    sólo al dueño, nunca a todos.
  - Tocar el aviso abre `/mi-dia?hablar=1`.
  - **Máximo tres avisos por persona por día**, y nunca entre las 23 y las 8 (hora de Uruguay).
  - Interruptor en Ajustes → Asistente, prendido por omisión.
  - Avisar está permitido; mandarle algo a un cliente, no.

## Qué NO tocar

- El tope de minutos por día y su ajuste (`vozEnVivoMinutosPorDia`). **No cambies el valor por omisión.**
- La ficha de un solo uso: la clave nunca va al navegador.
- La voz de Gemini y la del teléfono.
- El modelo: sigue siendo el gratis que ya está configurado. Si para las herramientas hiciera falta un
  modelo pago, **parás y avisás**.

## Prueba (que mire el resultado)

- `src/__tests__/la-llamada-cuenta-a-cada-uno-lo-suyo.test.ts`:
  - con un usuario de perfil operador, el texto de `contextoDeVozParaPerfil` **no** tiene ningún "$" ni
    las palabras "saldo", "seña" o "cuota";
  - con contabilidad, sí tiene lo que debe un cliente de prueba;
  - con organización, tiene un pendiente de una fiesta de prueba.
- `src/__tests__/el-asistente-avisa-a-cada-uno-lo-suyo.test.ts`: el aviso de cobros no le llega al
  operador, el cuarto aviso del día no sale, a las 23:30 de Uruguay no sale nada, y con el
  interruptor apagado tampoco.
- `src/__tests__/la-llamada-hace-lo-que-puede-y-pregunta-lo-demas.test.ts`, contra la ruta nueva:
  - `crear_tarea` crea la tarea;
  - `agendar_reunion` sin confirmar **no** agenda, y confirmada sí;
  - una acción `'nunca'` (`cobrar`) no hace nada;
  - `cuanto_me_deben` con el perfil operador da error de permiso;
  - el mismo `id` dos veces crea **una** tarea;
  - sin sesión, 401.

```comprobar
usa: hablar=1 en public/manifest.json
usa: get('hablar') en src/components/multiagent/multiagent-widget.tsx
usa: server-messaging en src/app/api/cron/asistente-proactivo/route.ts
prueba: src/__tests__/el-asistente-avisa-a-cada-uno-lo-suyo.test.ts
usa: contextoDeVozParaPerfil en src/app/api/asistente/voz-en-vivo/route.ts
archivo: src/app/api/asistente/voz-en-vivo/accion/route.ts
usa: nivelDeRiesgo en src/app/api/asistente/voz-en-vivo/accion/route.ts
usa: functionDeclarations en src/lib/asistente/voz-en-vivo.ts
usa: toolResponse en src/lib/asistente/sesion-voz-en-vivo.ts
usa: importantPending en src/lib/asistente/voz-en-vivo.ts
no-usa: No ejecuto acciones por voz en src/lib/asistente/voz-en-vivo.ts
prueba: src/__tests__/la-llamada-cuenta-a-cada-uno-lo-suyo.test.ts
prueba: src/__tests__/la-llamada-hace-lo-que-puede-y-pregunta-lo-demas.test.ts
```
