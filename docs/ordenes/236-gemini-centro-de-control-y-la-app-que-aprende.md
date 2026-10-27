# Orden 236 — Centro de control de la IA, y la app que aprende (26/10/2026)

**Para Gemini. Va en la MISMA propuesta que las órdenes 234 y 235** (rama `gemini/ordenes-234-235`).
Si un bloque se traba, entregá el resto y avisá cuál faltó. Antes de decir "terminé", pasá
`docs/ANTES-DE-ENTREGAR.md` sobre lo que tocaste.

Palabras del dueño: *"quiero una app toda automatizada por la IA, que trabaje con mi orden, automática pero
con mi control"*, *"debe ser fácil de manejar para mí; la app no puede ser una cosa difícil"* y *"la app debe ir
mejorando y aprendiendo de todo lo que se hace y se sube"*.

**La medida de éxito es la facilidad.** El dueño no es programador. Una pantalla, palabras simples, botones
grandes, y cero configuración obligatoria: viene armado y funciona.

## Lo que ya existe y se REUSA (no se rehace)

Hoy hay cuatro bandejas sueltas. El centro las junta; no las reemplaza ni borra sus pantallas:

- **Propuestas del asistente:** `src/lib/asistente/propuestas-service.ts` (archivo `asistente-propuestas.json`,
  tipo `AsistentePropuesta` con `nivelRiesgo` `solo|pregunta|nunca`; `aceptarPropuesta` ~233,
  `posponerPropuesta` ~374, `descartarNoAvisarMas` ~388, `getPropuestasParaUsuario` ~444). **Es la base.**
- **Bandeja de mensajes preparados:** `scheduled-messages.json` (`src/app/actions/scheduled-messages.ts`,
  pantalla `src/app/(app)/contabilidad/crm/outbox/page.tsx`). Abrir WhatsApp, editar texto y cancelar
  ya existen: se reusan esas acciones.
- **Agentes automáticos:** `src/lib/agentes/motor-agentes.ts` (`ejecutarAgentesAutonomos` ~465),
  configuración en `agentes-configuracion.json` (`src/lib/agentes/tipos.ts`, campo `activo`), historial en
  `agentes-historial.json`. Pantalla actual: `src/app/(app)/settings/agentes-autonomos/page.tsx`.
- **Interruptores sueltos:**
  - recontacto (`src/lib/marketing/recontacto-automatico.ts`);
  - recordatorio de invitación no abierta (`src/lib/invitaciones/recordatorio-no-abiertas.ts:31/36`);
  - avisos y voz (`asistente-settings.json`, `src/lib/asistente/avisar-al-duenio.ts:11-35`).
- **Cuándo corrió cada tarea automática:** `src/lib/automatico/tareas-automaticas.ts`.

**No se tocan:** la pantalla `src/app/(app)/aprobaciones/page.tsx`, que son pedidos de cambio de una persona y
no de la IA, ni las reglas de `src/lib/asistente/que-puede-hacer-solo.ts`.

## Bloque 1 — Una sola pantalla: "Centro de control"

Pantalla nueva `src/app/(app)/centro-de-control/page.tsx`, en el menú como primera opción del dueño. Pide
`PERMISOS.ADMINISTRACION`, igual que `src/app/actions/agentes-autonomos.ts`. Tiene tres pestañas, con
estos nombres exactos:

1. **"Para tu OK"**. Junta en una lista, lo más nuevo arriba:
   - las propuestas `pendiente` del asistente;
   - los mensajes `pendiente` de la bandeja;
   - los borradores de redes por aprobar (`social-posts.json`).

   Cada tarjeta muestra qué es, para quién, el texto y tres botones grandes: **Sí, hacelo**, **Cambiar** y
   **No**. "Sí" en un mensaje abre WhatsApp con el texto (lo manda la persona, como hoy). Arriba va un
   contador: "Tenés 4 cosas para mirar".
2. **"Tus reglas"**. Una fila por cada tarea automática (cada agente, el recontacto, el recordatorio a
   invitados, lo nuevo de la orden 235 y la web de la 234), con **un selector de tres opciones**:
   - **Sola**;
   - **Preguntame antes**;
   - **Apagada**.

   Cada fila lleva una línea en criollo que dice qué hace.
3. **"Lo que hizo sola"**. La lista de lo que la IA hizo sin preguntar, con fecha y un enlace para verlo,
   leída de `agentes-historial.json` y del registro nuevo del bloque 2.

**Diseño:** usá la skill de celular primero. Tiene que verse bien en el teléfono del dueño, con letra
grande, sin tablas y sin palabras técnicas.

## Bloque 2 — Las tres opciones mandan de verdad

- Archivo nuevo `reglas-de-la-ia.json` con `{ [tareaId]: 'sola' | 'preguntar' | 'apagada' }`. Va con un
  lector y un escritor en `src/lib/ia/reglas-de-la-ia.ts`, y con turno de guardado
  (`mutateGenericJsonArray` o el mismo patrón que `agentes-configuracion.json`).
- **Valores de fábrica:**
  - todo lo que manda algo afuera, toca plata o publica: **"preguntar"**;
  - lo que sólo mira o arma borradores internos: **"sola"**.
- Cada tarea consulta su regla **antes** de actuar:
  - **apagada** → no corre;
  - **preguntar** → en vez de hacerlo, crea una `AsistentePropuesta` con la acción adentro, y lo hace al
    tocar "Sí";
  - **sola** → lo hace y lo anota en `ia-registro.json` con qué, cuándo y el enlace.
- El `activo` de los agentes y los interruptores sueltos de arriba **se leen desde acá**. La pantalla vieja de
  agentes sigue andando: escribe en el mismo lugar.
- **Lo que nunca puede ponerse en "sola"**, y el selector ni lo ofrece:
  - mandar mensajes a clientes;
  - cobrar o marcar pagado;
  - cerrar un presupuesto;
  - tocar permisos;
  - gastar en publicidad (pausar, subir o crear campañas).

  Esto lo controla también el servidor, no sólo la pantalla.

## Bloque 3 — Darle órdenes en una frase

Arriba del centro va una caja grande: **"¿Qué querés que haga?"**, escrita o con el micrófono. Usá el
asistente que ya ejecuta acciones con confirmación (`src/app/api/asistente/voz-en-vivo/accion/route.ts`
y `ejecutarAccionSecretario` en `src/app/actions/multiagent.ts`).

Lo que pide el dueño se convierte en tarjeta de "Para tu OK" o se hace, según su regla. Ejemplos que tienen
que andar:

- "armale la web a la fiesta de Sofía" → orden 234;
- "prepará los seguimientos de esta semana" → orden 235, bloque 1;
- "¿qué me falta para el sábado?".

## Bloque 4 — La app aprende de lo que se hace

Sin servicios pagos y sin entrenar modelos. Se aprende guardando lo que el dueño decide y usándolo como
ejemplo:

- **Cada respuesta del dueño queda anotada.** Cada vez que toca **Sí**, **Cambiar** o **No** en una tarjeta,
  se guarda en `ia-aprendizaje.json`:
  - el tipo de tarea;
  - el texto que propuso la IA;
  - el texto final, si lo cambió;
  - la decisión.
- **Los ejemplos del dueño entran en el pedido a la IA.** Cuando la IA escribe algo de ese tipo (mensaje
  de seguimiento, post, bienvenida de la web, descripción de tarea), se le pasan como ejemplo los últimos 5
  textos aprobados o corregidos por el dueño. Así copia su forma de escribir. La función va en
  `src/lib/ia/aprender-de-lo-aprobado.ts` y la usan los flujos de las órdenes 234 y 235.
- **Lo que siempre rechaza deja de proponerse solo.** Si el dueño dijo **No** 3 veces seguidas a un tipo de
  tarjeta, la regla pasa sola a "apagada" y se le avisa: *"Dejé de proponerte X porque lo rechazaste 3
  veces. Lo podés volver a prender en Tus reglas."*
- **Las plantillas se ordenan por lo que eligen los clientes.** Las plantillas de la web que más eligen las
  quinceañeras (orden 234, `propuestaDeWebElegida`) salen primero en las 3 propuestas siguientes.
- **Lo que sube el equipo también enseña.** Los posts con más alcance (métricas de redes que ya existen) y los
  comentarios de las encuestas (orden 235, bloque 7) entran como contexto en los textos nuevos.
- **Resumen mensual en "Lo que hizo sola":** "Este mes aprendí: escribís más corto, preferís la plantilla
  Grazia, apagaste X". Se arma con datos, no lo inventa la IA.

## Pruebas: que miren el resultado

**Jest**, en `src/__tests__/el-centro-de-control-manda.test.ts`. Tiene que comprobar estos casos:

- (a) Una tarea en **apagada** no corre.
- (b) Una tarea en **preguntar** no actúa y deja una propuesta. Al aceptarla, recién actúa.
- (c) Una tarea en **sola** actúa y queda en `ia-registro.json`.
- (d) Querer poner "mandar mensajes a clientes" o "gastar en publicidad" en **sola** se rechaza en el
  servidor.
- (e) Una sesión de secretaria no puede cambiar reglas.
- (f) Tres "No" seguidos apagan la regla.
- (g) Un texto corregido por el dueño aparece como ejemplo en el pedido siguiente a la IA (con la IA
  simulada).

Rompé a propósito la (d) y fijate que se ponga en rojo.

**Navegador**, en `tests/e2e/el-centro-de-control.spec.ts`. Comprobar:

- las tres pestañas, con sus nombres;
- tocar **No** en una tarjeta la saca de la lista.

Corré esas solas, después `npx tsc --noEmit`, `npx jest --silent` y `npm run "publicar?:rapido"`, y pegá las
últimas líneas en la propuesta. Actualizá `docs/QUE-HAY-EN-LA-APP.md` y regenerá el mapa con
`npm run mapa:generar`.

```comprobar
archivo: src/app/(app)/centro-de-control/page.tsx
archivo: src/lib/ia/reglas-de-la-ia.ts
usa: Para tu OK en src/app/(app)/centro-de-control/page.tsx
usa: Tus reglas en src/app/(app)/centro-de-control/page.tsx
usa: Lo que hizo sola en src/app/(app)/centro-de-control/page.tsx
usa: reglas-de-la-ia en src/lib/agentes/motor-agentes.ts
usa: aprenderDeLoAprobado en src/ai/flows/armar-web-del-evento-flow.ts
prueba: src/__tests__/el-centro-de-control-manda.test.ts
prueba: tests/e2e/el-centro-de-control.spec.ts
```
