# Orden 342 — Un solo cerebro de IA y una sola puerta para encontrarlo

**Para Gemini. Va en la MISMA propuesta que la 341 (`gemini/orden-341`), y se hace PRIMERO: la papelería de la 341
llama al cerebro de esta orden.** Necesita la lista de modelos de la orden 340 (`src/ai/modelos.ts`). Antes de decir
"terminé", leé `docs/ANTES-DE-ENTREGAR.md`.

## Por qué (pedido del dueño, 23/11/2026)
Palabras suyas: *"lo más importante: que toda la parte de inteligencia artificial tenga un mismo núcleo, a pesar de que
estás usando diferentes cosas de tecnología de Google, que se haga automático, y que sea fácil: dónde lo encuentro"*.

Lo que midió Claude: la app llama a la IA por **siete puertas distintas**, cada una con sus modelos, su manejo de errores y
su forma (o no) de pasar por el tope de gasto:
- `src/ai/genkit.ts` (texto; la usan las acciones con `ai.generate`),
- `src/lib/ai/gemini-image.ts` (imágenes), `src/lib/ai/decisiones.ts`,
- `src/lib/asistente/voz-en-vivo.ts`, `src/lib/asistente/voz-gemini.ts`, `src/lib/asistente/whatsapp-media.ts`,
- `src/app/actions/settings.ts` (prueba de la clave).

Las piezas comunes ya existen, pero sueltas: el tope y el registro (`src/lib/ai/consumo-servidor.ts`: `hayPresupuestoParaIA`
~309, `reservarConsumoIA` ~133, `registrarConsumoIA` ~106, `anotarFalloIA` ~325), las reglas de seguridad
(`src/lib/ai/intelligence-guardrails.ts`), el contexto del negocio (`src/lib/ai/sofia-context.ts`,
`buildSofiaBusinessContext` ~28) y la lista de tareas automáticas (`src/lib/automatico/tareas-automaticas.ts`,
`TAREAS_AUTOMATICAS` ~61, `estadoDeLasTareas` ~189).

## Bloque 1 — El cerebro: `src/ai/cerebro.ts`
Una sola puerta, con cuatro funciones: `pedirTexto`, `pedirImagen`, `leerImagen` y `pedirVoz`. Cada una, siempre:
1. Mira el tope (`hayPresupuestoParaIA` / `reservarConsumoIA`); sin presupuesto, devuelve "Se llegó al tope de IA del mes"
   sin llamar a Google.
2. Elige el modelo de `src/ai/modelos.ts` y, si uno falla o está retirado, pasa al siguiente.
3. Suma el contexto del negocio cuando la tarea lo pide (`buildSofiaBusinessContext`) y las reglas de
   `intelligence-guardrails.ts`: nunca cobra, nunca manda mensajes a clientes, nunca da por aceptado un presupuesto, nunca
   toca permisos (las cuatro cosas que el dueño no automatiza).
4. Anota en el registro qué función de la app pidió qué, cuánto costó y si salió (`registrarConsumoIA` / `anotarFalloIA`),
   con un **nombre de función** (`quien: 'papeleria' | 'espejo-magico' | 'sofia' | ...`) para que el dueño vea en qué se
   gasta.

Las siete puertas de arriba pasan a llamar al cerebro. **No cambia qué hace cada función ni sus textos**: sólo por dónde
pasa. `genkit.ts` puede quedar como motor por debajo del cerebro.

## Bloque 2 — Una sola puerta en la app: "Asistente AK" (`/asistente`)
`/asistente` ya es la entrada de la IA en el menú (`src/lib/navegacion/mapa.ts` ~57) y `/multiagente` ya lleva ahí (~297).
Ahí se juntan, en solapas, sin borrar ninguna pantalla:
1. **Hoy:** lo que la IA hizo sola desde la última vez y lo que espera tu OK (la bandeja que ya existe en esa página).
2. **Lo automático:** cada tarea de `TAREAS_AUTOMATICAS` con su interruptor, cuándo corrió por última vez y si salió bien
   (`estadoDeLasTareas`), y cada función de IA con interruptor que hoy vive en Ajustes (enlace directo a su lugar).
3. **Gasto:** cuánto se gastó este mes por función (del registro del bloque 1) y el tope, con el botón para cambiarlo.
4. **Hablale:** el chat del asistente, el mismo de siempre.

Las otras pantallas que usan IA (presencia digital, secretaria, espejo mágico, decoración, papelería) siguen donde están y
muestran arriba un enlace chico "Ver en Asistente AK". Regenerar el mapa con `npm run mapa:generar`.

## Lo que NO hay que hacer
- No sumar funciones nuevas de IA en esta orden: es juntar lo que hay.
- No sacar ni mover pantallas que ya andan; sólo enlazarlas.
- No activar nada que se pague por mes.

## Qué tiene que comprobar la prueba
- **El candado:** ningún archivo fuera de `src/ai/` llama a `generativelanguage.googleapis.com` ni a `ai.generate(`. Una
  prueba que recorre `src/` y falla si aparece uno (romperla a propósito agregando una llamada directa y ver que frena).
- Con el tope agotado, `pedirTexto` y `pedirImagen` no llaman a Google.
- Con el primer modelo "retirado", el cerebro usa el segundo y lo anota.
- `/asistente` muestra las cuatro solapas, y "Lo automático" lista todas las tareas de `TAREAS_AUTOMATICAS`.

```comprobar
archivo: src/ai/cerebro.ts
usa: hayPresupuestoParaIA en src/ai/cerebro.ts
usa: registrarConsumoIA en src/ai/cerebro.ts
usa: ./modelos en src/ai/cerebro.ts
no-usa: generativelanguage.googleapis.com en src/lib/asistente/whatsapp-media.ts
no-usa: generativelanguage.googleapis.com en src/lib/asistente/voz-gemini.ts
no-usa: generativelanguage.googleapis.com en src/lib/ai/decisiones.ts
# Bloque 2
usa: estadoDeLasTareas en src/app/(app)/asistente/page.tsx
usa: Ver en Asistente AK en src/components/fiestas/panels/carta-tragos.tsx
prueba: src/__tests__/toda-la-ia-pasa-por-el-cerebro.test.ts
prueba: tests/e2e/asistente-ak-junta-toda-la-ia.spec.ts
```
