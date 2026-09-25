# Orden 74 — El secretario que habla: manos libres y que haga más cosas

**Para Gemini. UNA SOLA PROPUESTA con los cinco bloques.** Si un bloque se traba, entregá los
otros igual y decí cuál faltó.

Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md` sobre lo que tocaste.

**De dónde sale:** el dueño pidió las cinco mejoras del secretario que habla. La investigación
ya está hecha: abajo va el archivo, la línea y el nombre exacto de cada cosa. **No hace falta
buscar nada.**

**Todo pasa en un solo archivo de pantalla:**
`src/components/multiagent/multiagent-widget.tsx`. Está enganchado en la pantalla base
(`src/components/app-shell.tsx:443`), así que aparece en toda la app interna.

**Lo que NO tocás:**

- `src/app/actions/multiagent.ts` — es el servidor, lo trabajé yo en esta misma tanda.
- `src/app/actions/crm.ts`, `presupuestos.ts`, y todo lo de plata, cobros, comida y permisos.
- El botón flotante, dónde se ubica, que se pueda arrastrar y el historial: **andan, no se
  rehacen**.

---

## Bloque 1 — Que lo dictado se mande solo

**Hoy:** en `toggleVoiceRecording` (línea ~280), cuando termina de escuchar, el resultado se
escribe en el cuadro con `setInput(...)` (línea ~301) **y ahí queda**. Hay que tocar "enviar".

**Qué se hace:** cuando el dictado termina, **se manda solo**. La función para mandar ya acepta
el texto por parámetro: `handleSend(override?: string)`, línea ~431. O sea:
`handleSend(final.trim())` en vez de `setInput(...)`.

**Cuidado con esto:** que no se mande vacío, y que no se mande dos veces si llegan dos
resultados finales seguidos.

---

## Bloque 2 — Que no se corte en la primera pausa

**Hoy:** `recognition.continuous = false` (línea ~294). Se cierra en cuanto hacés una pausa, y
lo que venía después se pierde.

**Qué se hace:** escuchar de corrido (`continuous = true`) y **cortar cuando la persona toca el
botón**, o sola después de unos segundos sin que nadie hable. Con el bloque 1: lo que se juntó
se manda al cortar.

**Cuidado:** el micrófono no puede quedar prendido para siempre. Un tope de seguridad (por
ejemplo 60 segundos) y se corta solo.

---

## Bloque 3 — Que lea la respuesta entera

**Hoy:** `truncateForSpeech` (línea 77) lee **las tres primeras frases** y después dice
*"¿Querés que siga con más detalle?"*. Si la respuesta es larga, la voz se queda por la mitad.

**Qué se hace:** que lea todo. Y si es muy largo, que **al decir "seguí" (o tocar un botón)
siga leyendo desde donde quedó** — sin volver a preguntarle a la inteligencia artificial, que
cuesta plata: el texto ya está en pantalla.

**Cuidado:** al empezar una respuesta nueva, se corta la anterior
(`window.speechSynthesis.cancel()`, ya está puesto en la línea ~490).

---

## Bloque 4 — Que avise cuando el micrófono falla

**Hoy:** `recognition.onerror = () => setIsRecordingVoice(false)` (línea ~308). Si el navegador
no da permiso o el micrófono falla, **el botón se apaga y no dice nada**: parece que el
secretario te ignoró.

**Qué se hace:** decir en pantalla qué pasó, en criollo y según el caso: que no diste permiso
al micrófono, que no se escuchó nada, o que el navegador no puede. El aviso ya existe y se usa
así: `setToast({ message: '...', type: 'warning' })`.

**Y el caso que ya está bien y se respeta:** si el navegador no tiene dictado, ya avisa
(línea ~288). No lo rehagas.

---

## Bloque 5 — Que haga tres cosas más

**Hoy el secretario hace:** crear tarea, agendar recordatorio, navegar, y —desde esta tanda—
anotar un prospecto. Se le agregan tres, **todas de operación, ninguna toca plata**:

1. **Marcar una tarea como hecha.** La acción que existe es `updateTareas(fiestaId, tareas)`,
   en `src/app/actions/fiesta/tareas.actions.ts:7`. **Ojo:** recibe **la lista entera** de
   tareas, no una sola; hay que leer las de la fiesta, marcar la que corresponde y mandar todo.
2. **Anotar un invitado.** `addInvitado(fiestaId, nuevoInvitadoData)`, en
   `src/app/actions/fiesta/invitados.actions.ts:113`. El identificador y el enlace del invitado
   los genera sola: no se los mandes.
3. **Registrar un incidente de la fiesta.** `createIncidente(...)`, en
   `src/app/actions/incidents.ts:127`. Genera sola el identificador y la fecha.

**Cómo se agrega una acción nueva, y son tres lugares, los tres obligatorios:**

- **El contrato:** `src/types/multiagent.ts:81`, la lista de valores de `action.type`.
- **Las instrucciones a la inteligencia artificial:** `src/ai/flows/multiagent-flow.ts`, el
  bloque "REGLAS DE ACCIÓN" (líneas ~115-137). Se copia el formato de las que ya están.
- **El que la ejecuta:** `src/app/actions/multiagent.ts`, dentro de
  `sendPersistentMultiAgentMessage`. **Este archivo es mío: dejá escrito en la propuesta qué
  necesitás que enganche y lo hago yo.**

**Esto no es negociable, y hay un control que lo hace cumplir**
(`src/__tests__/el-secretario-hace-lo-que-dice-que-hace.test.ts`): **una acción declarada que
nadie ejecuta se pone en rojo.** Ya pasó: el secretario podía decidir "anotar prospecto",
"armar presupuesto" y "preparar WhatsApp", y **nadie las ejecutaba**. Contestaba como si las
hubiera hecho.

**Y una que NO se puede hacer, y por eso no está en la lista:** *"agregá esto a la lista de
compras"*. La lista de compras **no se carga a mano**: se calcula sola desde los menús
contratados. No inventes una acción para eso.

---

## Lo que tiene que comprobar la prueba

Una prueba de navegador, en `tests/e2e/el-secretario-escucha-y-hace.spec.ts`, que **mire el
resultado en pantalla**, no que la palabra aparezca en el código. Como el micrófono de verdad
no existe en la prueba, se simula el dictado igual que se simula el portapapeles en
`tests/e2e/la-hoja-del-dj-dice-la-verdad.spec.ts`.

Tiene que comprobar, y cada línea tiene que poder ponerse en rojo:

- Que al terminar el dictado **el mensaje se manda solo**, sin tocar "enviar".
- Que si el micrófono falla, **aparece el aviso en pantalla** (hoy no aparece nada).
- Que la respuesta larga **no se corta** en la tercera frase.

**La sesión se pone con `ponerSesionDelEquipo(context, baseURL)`**, de
`tests/e2e/helpers/fiesta-de-prueba.ts`. Nunca armando la cookie a mano: eso ya costó una hora.

```comprobar
archivo: src/components/multiagent/multiagent-widget.tsx
usa: handleSend en src/components/multiagent/multiagent-widget.tsx
prueba: tests/e2e/el-secretario-escucha-y-hace.spec.ts
# Bloque 5 (va en la orden 88)
usa: complete_task en src/types/multiagent.ts
```
