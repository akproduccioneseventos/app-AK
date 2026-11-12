# Orden 289 — La IA en dos niveles: la barata para lo simple, la inteligente para lo que importa (12/11/2026)

**Para Gemini.** Va **en la misma entrega que las 284 a 288 y 290** (tu rama `gemini/ordenes-282-283-entrega-completa`).
**Una sola propuesta, sin fusionar.** Si un bloque se traba, entregá el resto y avisá cuál.

**Decisión del dueño (12/11/2026):** *"para cosas simples, una inteligencia más barata; para las cosas más complejas, el
cerebro"*. Aprobó que suba el gasto **con un tope por día**.

## Lo que ya existe y se usa (no se rehace)

`src/ai/genkit.ts` ya tiene los papeles: `geminiFastModel` (rápido), `geminiProModel` (profundo),
`getGeminiModelForAgent` y `getEffectiveGeminiModelForAgent` (~68), que ya baja al rápido si el tope mensual de
`hayPresupuestoParaIA` está alcanzado. **El problema:** `DEFAULT_GEMINI_PRO_MODEL` (~17) es `gemini-flash-latest`, el
mismo que el rápido. Hoy toda la app usa la versión barata.

## Bloque 1 — El modelo profundo pasa a ser el inteligente

- `src/ai/genkit.ts` ~17: `DEFAULT_GEMINI_PRO_MODEL = 'googleai/gemini-pro-latest'`, y la lista de respaldo del profundo
  (`getGeminiFallbackCandidates` para `geminiProModel`) es: `gemini-pro-latest` → `gemini-flash-latest` →
  `gemini-3.8-flash`. Si el profundo contesta que el modelo no existe (404) o sin saldo (402/429), baja al rápido sin
  romper la respuesta.
- Las variables `GEMINI_MODEL_PROFUNDO` / `GEMINI_MODEL_PRO` siguen mandando si están puestas.
- Corregí el comentario de arriba ("gratuitos"): ya no son todos gratis.

## Bloque 2 — Tope diario del cerebro

- En `src/lib/ai/consumo-servidor.ts`, una función `reservarRespuestaProfunda(ahora)` que, **dentro de la misma
  transacción** de `cambiarConsumo`, suma 1 a `dias[AAAA-MM-DD].profundo` (día de Uruguay, con `src/lib/fechas/`) y
  devuelve `false` si ya llegó al tope. Tope en `ai-consumo.json` como `topeDiarioProfundo`, **por defecto 40**.
- `getEffectiveGeminiModelForAgent` (~68): si el preferido es el profundo, además del tope mensual llama a
  `reservarRespuestaProfunda`; con `false`, devuelve `geminiFastModel`. Si la reserva tira error, devuelve el rápido
  (nunca se queda sin contestar).
- En la pantalla de gasto de IA (donde hoy se edita `topeMensualUYU`), mostrar "Respuestas inteligentes hoy: N de 40" y
  dejar cambiar el tope, con permiso de **administración** (`puede(..., PERMISOS.ADMINISTRACION)`); el auditor no lo puede
  cambiar (`exigirQueSePuedaGuardar`).
- En `src/lib/ai/consumo.ts`, sumar `'respuesta-profunda'` a `FuncionConCosto` con un costo estimado de 3 pesos en
  `COSTO_ESTIMADO_UYU`, y registrarla en la reserva.

## Bloque 3 — Qué va al cerebro y qué no

**Al profundo** (con `await getEffectiveGeminiModelForAgent(...)` en vez del modelo fijo):
- `src/app/actions/asistente-virtual.ts` ~94, ~109, ~270, ~412 (hoy `geminiCommercialModel`): lo que contesta a
  clientes, prospectos e invitados por escrito.
- `src/lib/blog-ai-generator.ts` ~131 y ~169 (hoy `geminiProModel` fijo: pasá a la función para que respete el tope).
- `src/ai/flows/marketing-agent-flow.ts` ~91 y `src/ai/flows/generate-sales-pitch-flow.ts` ~34.
- `src/app/actions/simulador-copilot.ts` ~198 (hoy `geminiModel`): revisar un presupuesto.
- `src/ai/flows/multiagent-flow.ts` ~563, sólo con `deep: true` (como ya está).

**Se quedan en el rápido** (cosas simples): clasificar comentarios, resúmenes, paleta, testimonios, trivia, extraer datos
de un WhatsApp, leer un recibo. En `getGeminiModelForAgent` (~54), `fiestas_general` pasa a rápido salvo con `deep`
(lo usan el itinerario, el perfil del DJ y la web del evento: no necesitan el cerebro). `contable` sigue en profundo.

**No se toca:** la voz (`src/lib/asistente/voz-gemini.ts`) ni las imágenes (`gemini-image`, `gemini-3.1-flash-image`).

## Bloque 4 — Que se vea qué contestó

En el historial del asistente que ya ve el equipo, guardar con cada respuesta qué nivel la contestó (`nivel: 'rapido' |
'profundo'`), para poder comparar después.

## Pruebas

- `src/__tests__/la-ia-usa-el-cerebro-solo-donde-importa.test.ts`:
  - `getGeminiModelForAgent('comercial', { deep: true })` y el asistente usan el profundo.
  - `fiestas_general` sin `deep` usa el rápido.
  - Con `topeDiarioProfundo: 2`, la tercera llamada del día a `getEffectiveGeminiModelForAgent` devuelve el rápido, y al
    día siguiente (hora de Uruguay, 00:30) vuelve el profundo.
  - Si la reserva tira error, devuelve el rápido.
  - Dos reservas a la vez con tope 1 dejan pasar una sola (la base de mentira devuelve **una copia** en cada lectura).
- `src/ai/genkit.test.ts`: la lista de respaldo del profundo empieza por `gemini-pro-latest` y termina en un flash.

```comprobar
usa: gemini-pro-latest en src/ai/genkit.ts
usa: reservarRespuestaProfunda en src/lib/ai/consumo-servidor.ts
usa: reservarRespuestaProfunda en src/ai/genkit.ts
usa: getEffectiveGeminiModelForAgent en src/app/actions/asistente-virtual.ts
usa: getEffectiveGeminiModelForAgent en src/lib/blog-ai-generator.ts
usa: getEffectiveGeminiModelForAgent en src/app/actions/simulador-copilot.ts
usa: respuesta-profunda en src/lib/ai/consumo.ts
prueba: src/__tests__/la-ia-usa-el-cerebro-solo-donde-importa.test.ts
```
