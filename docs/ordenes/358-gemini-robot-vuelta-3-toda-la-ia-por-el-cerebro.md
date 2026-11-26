# Orden 358 — Robot, vuelta 3: toda la IA pasa por el cerebro, de verdad

**Para Gemini. Va en la MISMA propuesta que la 350, 355, 356 y 357 (rama `gemini/orden-346`).** Si un archivo se traba,
entregá el resto y avisá cuál faltó. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`.

## Por qué
Tercera vuelta del robot (26/11/2026). Revisó plata, permisos e integraciones. En plata y en permisos no hubo errores
nuevos, y Meta y Mercado Pago verifican la firma y no cobran dos veces. Lo que sí apareció: **la decisión del dueño del 23/11 ("toda la IA tiene un mismo
núcleo", orden 342) no se cumple.** 20 archivos llaman a la IA con `generateWithGeminiFallback` o
`ejecutarPromptConFallback` (`src/ai/genkit.ts` ~157), que va directo a `ai.generate` sin pasar por `src/ai/cerebro.ts`:
sin el tope central, sin el registro de gasto y sin las reglas del negocio. El control
`src/__tests__/toda-la-ia-pasa-por-el-cerebro.test.ts` no lo ve porque sólo busca `ai.generate(` y la dirección de Google.

## Bloque 1 — Pasar cada llamada al cerebro (pregunta 232)
En cada archivo, reemplazá la llamada por `pedirTexto` de `src/ai/cerebro.ts` (~299), con un `quien` que diga de dónde
viene (el mismo nombre que ya usa para el tope, si tiene), `incluirReglas: true` cuando escribe algo que ve un cliente o
un prospecto, y `datosNoConfiables` para lo que escribió una persona de afuera (comentarios, mensajes, formularios). Si
el archivo necesita JSON, se pide en el texto y se lee la respuesta como ya hace `src/app/actions/presentacion-ia.ts`.
Archivos:
`src/app/actions/asistente-virtual.ts`, `src/app/actions/commercial-intelligence.ts`, `src/app/actions/games.actions.ts`,
`src/app/actions/post-event-intelligence.ts`, `src/app/actions/salon-ia.actions.ts`, `src/app/actions/simulador-copilot.ts`,
`src/app/actions/whatsapp.ts`, `src/app/ai/flows/analyze-codebase-flow.ts`, `src/lib/blog-ai-generator.ts`,
`src/lib/commercial/commercial-followup.ts`, `src/lib/crm/ia-prospecto.ts`, `src/lib/feedback/resumen-feedback.ts`,
`src/lib/fiesta/tareas-sistema.ts`, `src/lib/marketing/whatsapp-remarketing.ts`, `src/lib/multiagent/encargado.ts`,
`src/lib/post-event/post-event-core.ts`, `src/lib/presencia-digital/competencia.ts`,
`src/lib/social-media/clasificador-comentarios.ts`, `src/lib/social-media/comments-backfill.ts`,
`src/lib/whatsapp/asistente-de-prospectos.ts`.
- Lo que hoy controla su propio tope (`reservarConsumoIA` suelto) deja de hacerlo: el cerebro ya lo hace. Que no se cuente
  dos veces.
- Si la IA no contesta o se pasó el tope, cada pantalla muestra lo que ya mostraba en ese caso. No cambies textos ni
  comportamientos: sólo el camino.

## Bloque 2 — Que el control lo vea
En `src/__tests__/toda-la-ia-pasa-por-el-cerebro.test.ts`, sumá que **ningún archivo fuera de `src/ai/` importe
`generateWithGeminiFallback` ni `ejecutarPromptConFallback`** (las pruebas `*.test.ts` pueden). Rompelo a propósito
antes de entregar (un import de prueba en un archivo cualquiera) y mirá que frene.

## Barrido en toda la app
- `grep -rn "generateWithGeminiFallback\|ejecutarPromptConFallback\|from '@/ai/genkit'" src --include=*.ts* | grep -v "^src/ai/"`
  tiene que quedar vacío salvo pruebas.
- Llamadas directas a otras IA: `grep -rnE "openai|anthropic|generativelanguage" src --include=*.ts* | grep -v "^src/ai/"`.

## Lo que NO hay que hacer
- No cambiar modelos, topes ni reglas del cerebro.
- No cambiar textos que ve el cliente ni prompts que ya funcionan, salvo lo necesario para pasar por `pedirTexto`.
- No sumar servicios pagos.

## Qué tiene que comprobar la prueba
- `toda-la-ia-pasa-por-el-cerebro.test.ts` falla si un archivo fuera de `src/ai/` importa `generateWithGeminiFallback`.
- `src/__tests__/la-ia-de-cada-modulo-pasa-por-el-tope.test.ts`: con el cerebro de mentira y el tope agotado, el
  clasificador de comentarios, el blog y el asistente de prospectos no llaman a la IA y devuelven su respuesta de respaldo.

```comprobar
usa: pedirTexto en src/app/actions/whatsapp.ts
usa: pedirTexto en src/lib/blog-ai-generator.ts
usa: pedirTexto en src/lib/presencia-digital/competencia.ts
usa: pedirTexto en src/lib/social-media/clasificador-comentarios.ts
usa: pedirTexto en src/lib/whatsapp/asistente-de-prospectos.ts
usa: pedirTexto en src/lib/multiagent/encargado.ts
usa: pedirTexto en src/app/actions/asistente-virtual.ts
no-usa: generateWithGeminiFallback en src/app/actions/whatsapp.ts
no-usa: generateWithGeminiFallback en src/lib/blog-ai-generator.ts
no-usa: generateWithGeminiFallback en src/lib/multiagent/encargado.ts
usa: generateWithGeminiFallback en src/__tests__/toda-la-ia-pasa-por-el-cerebro.test.ts
prueba: src/__tests__/la-ia-de-cada-modulo-pasa-por-el-tope.test.ts
```
