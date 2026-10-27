# Orden 235 — La IA hace sola lo que hoy se completa a mano (26/10/2026)

**Para Gemini. Una sola propuesta con todos los bloques**, en una rama nueva desde `main` actualizada:
`gemini/orden-235-ia-automatica`. Si un bloque se traba, entregá el resto en la misma propuesta y avisá
cuál faltó. Antes de decir "terminé", pasá `docs/ANTES-DE-ENTREGAR.md` sobre lo que tocaste.

Pedido del dueño: *"todo lo que pueda hacer la IA en toda la app, automático"*. Casi toda la IA de la app
existe **bajo un botón, de a uno**. Esta orden la hace correr sola.

## Reglas que valen para TODOS los bloques

- **Nada sale para afuera solo.** Los mensajes a clientes o prospectos quedan como **borrador en la
  bandeja de salida** (`scheduled-messages.json`, `status: 'pendiente'`) y los manda una persona.
- **No se toca:** cobrar, marcar como pagado, facturar, cerrar presupuestos ni permisos. Un gasto
  prellenado lo confirma una persona.
- **Tope de IA en cada llamada.** Antes de llamar al modelo, `hayPresupuestoParaIA`; después,
  `registrarConsumoIA` (`src/lib/ai/consumo-servidor.ts:90` y `:43`). Cada función nueva va en
  `FuncionConCosto` y `COSTO_ESTIMADO_UYU` (`src/lib/ai/consumo.ts:14` y `:35`).
- **Si la IA falla o no hay tope**, queda lo que había antes (el texto fijo actual, o nada) y **no se
  anuncia como hecho**.
- **Sin inventar:** ni precios, ni promesas, ni "garantía", ni fechas que no estén en los datos, ni nombres
  del personal.
- Lo que corre solo cuelga del despertador que ya existe: `src/app/api/cron/asistente-proactivo` y
  `ejecutarAgentesAutonomos` en `src/lib/agentes/motor-agentes.ts`. **No se crean servicios pagos.**
- **No va en esta orden:** la web del evento, que es la orden 234.

## Bloque 1 — Seguimiento a prospectos con texto personalizado

En `src/lib/agentes/motor-agentes.ts` (~145 y ~165), los textos fijos de 5 y 14 días se reemplazan por la
generación de `generateAiCommercialFollowup` (`src/app/actions/commercial-intelligence.ts:218`). Para no
pedir sesión desde el despertador, sacá su núcleo a una función interna en `src/lib/`.

- Con datos del `CrmLead` (`src/types/crm.ts:50-90`).
- Si la IA falla, queda el texto fijo de hoy.
- El borrador va a la bandeja como ahora. **No cambia quién lo manda.**

## Bloque 2 — El prospecto de WhatsApp se completa solo

En `src/app/actions/whatsapp.ts` (~221-245), después de guardar el mensaje, la IA extrae del texto:

- `partyType`, `eventDate`, `guestCount` y el lugar;
- un `nextAction`;
- un resumen corto para `notes`.

Las reglas del guardado:

- **Sólo completa campos vacíos**: lo que tipeó el equipo no se pisa.
- No contesta nada al que escribe; la regla del WhatsApp personal sigue igual.
- Reutilizá `extraerDatosPresupuestoProspecto` (`src/lib/asistente/por-whatsapp.ts:56`) como respaldo sin IA.

## Bloque 3 — El recibo se lee de verdad (está roto)

`src/ai/flows/extract-receipt-data.ts` dice "autocompletar", pero lee la foto como si fuera texto, así que
con un ticket real devuelve vacío. Reescribilo con Gemini, leyendo la imagen como hace
`src/ai/flows/extract-contract-data.ts:6-42` (`{{media url=…}}` y `ejecutarPromptConFallback`).

- **Devuelve:** proveedor, fecha, monto, categoría y confianza.
- **Sigue igual:** `extractReceiptDataAction` (`src/app/actions/gastos.ts:142`) con su permiso de
  contabilidad. Sólo prellena el formulario; guardar sigue siendo de una persona.

## Bloque 4 — Redes: borradores escritos por IA, solos, con fotos reales

- **Post semanal:** `autoGenerarBorradoresSemanales` (`src/lib/presencia-digital/autogenerador-semanal.ts:59`)
  pasa a correr por el despertador una vez por semana, además del botón. El texto y los hashtags los escribe
  la IA. Si la IA falla, quedan los temas fijos.
- **Post después de la fiesta:** el post de `motor-agentes.ts:272-337` usa la IA y 1 a 3 fotos reales de la
  galería de esa fiesta. **Queda como borrador para aprobar**: hoy publica el texto genérico, y eso deja de
  pasar.
- **`generateSocialPostFlow`** (`src/ai/flows/generate-social-post-flow.ts`): hoy no tiene IA. Se usa con
  Gemini en estos dos lugares, o se borra.

## Bloque 5 — Tareas de la fiesta según lo contratado

En `src/app/(app)/fiestas/nueva/tareas/client.tsx` (~204-267), las tareas del sistema salen de **los
servicios del presupuesto** (fotocabina, catering, 360, DJ…) y de lo que falta. Para lo que falta usá
`src/lib/readiness-score.ts` y `detectarErroresHumanos` (`src/lib/alertas/errores-humanos.ts:6`).

- Se generan **solas** cuando la fiesta pasa a contratada, y el despertador las revisa a diario.
- Las reglas deciden qué tareas van. La IA sólo redacta la descripción.
- **No se duplican:** cada tarea lleva un id estable por servicio.
- El botón actual queda.

## Bloque 6 — Las notas para el DJ se guardan y las ve el DJ

En `src/app/(app)/fiestas/nueva/musica/page.tsx`, hoy el resultado de `generateDjProfileAction` (~140) vive
sólo en `djBrief` (~53) y se pierde.

- Guardarlo en la fiesta, en un campo nuevo `musica.briefDj` con el texto y la fecha.
- Regenerarlo solo cuando cambia la playlist o la lista de "no pasar", con una espera de unos segundos.
- Mostrarlo en la vista del operador y del DJ.

## Bloque 7 — Resumen de encuestas

Un resumen mensual por el despertador, a partir de `feedback.json` (`src/types/feedback.ts`):

- los temas que se repiten;
- las áreas con nota baja;
- tres mejoras propuestas;
- qué comentarios sirven como testimonio. **Sólo se sugieren; aprobarlos es de una persona.**

Se muestra arriba de `src/app/(app)/settings/feedback/page.tsx`. `generateTestimonialFlow` (sin IA, no lo
llama nadie) se usa con Gemini acá, o se borra.

## Bloque 8 — Agenda de la reunión con lo que falta de esa fiesta

En `src/app/(app)/fiestas/nueva/reuniones/page.tsx` (~183), al crear la reunión, a la plantilla maestra
(`getMasterTemplate`) se le suman **arriba** los puntos que faltan de esa fiesta: menú, lista de invitados,
música y cuotas, sacados de `readiness-score.ts`. La IA ordena y redacta.

`analyzeEventPlan` está duplicado en `src/ai/flows/` y `src/app/ai/flows/`, y no lo llama nadie. Usá el de
`src/ai/flows/` y borrá la copia.

## Bloque 9 — Material después de la fiesta, ya preparado

Uno a tres días después de cada fiesta, el despertador corre `generateAiPostEventMaterial`
(`src/app/actions/post-event-intelligence.ts:174`): agradecimiento, pedido de reseña e idea de post.
Usá su núcleo interno, sin sesión.

- Los mensajes van **como borradores a la bandeja**.
- No se repite si ya existe el borrador de esa fiesta.
- El botón de `src/app/control-tower/post-fiesta/page.tsx` queda.

## Bloque 10 — Logística: se completa con los datos del salón

En `src/app/(app)/fiestas/nueva/logistica/page.tsx` (~121-237), los campos vacíos se completan con los
datos del salón elegido: `direccion`, `googleMapsUrl`, `estacionamiento` y `accesibilidad`
(`src/types/salon.ts:39-47`).

- La IA redacta "cómo llegar" y el plan de lluvia con esos datos.
- **Sólo campos vacíos.** No toques `/evento/logistica/[fiestaId]`.

## Bloque 11 — Alergias contra el menú

En `src/app/(app)/fiestas/nueva/alergias/page.tsx`, se cruzan las restricciones de los invitados
(`src/types/invitado.ts`) con los platos del menú asignado:

- Se avisa en pantalla qué platos chocan y con cuántas personas.
- Se avisa a cocina, como alerta interna.

**Primero por reglas** (gluten, lactosa, vegano, vegetariano, frutos secos). La IA sólo se usa para los
ingredientes escritos a mano.

## Bloque 12 — Paleta sugerida por IA

En `src/app/(app)/fiestas/nueva/decoracion/page.tsx` (~136), el botón "Sugerir paleta" usa Gemini con:

- el tipo de fiesta;
- el estilo;
- las fotos de referencia, si hay.

`suggestPalette` (`src/ai/flows/suggest-palette-flow.ts`) hoy devuelve paletas fijas: usalo con Gemini y
borrá la copia de `src/app/ai/flows/` si existe.

## Bloque 13 — Mesas: el resultado en pantalla, no en la consola

En `src/app/(app)/fiestas/nueva/invitados/layout/page.tsx` (~627-630), el aviso dice "revisá la consola".
Mostrá en pantalla qué invitados se movieron y a qué mesa. Mirá `salon-ia.actions.ts:7` antes de tocar.
`assignGuestsFlow`, que no lo llama nadie, se borra.

## Bloque 14 — Lo que el cliente le pregunta al asistente

`getConversacionesAsistenteCliente` (`src/app/actions/asistente-virtual.ts:181`) no lo lee ninguna
pantalla. Cambios:

- Se muestra en la ficha de la fiesta como "Lo que preguntó el cliente", con un resumen de IA arriba.
- Sólo para el equipo con permiso de organización.

## Pruebas — que miren el resultado

Una prueba de Jest por bloque, con la IA simulada, en `src/__tests__/la-ia-trabaja-sola-235.test.ts` (o una
por archivo). Qué tiene que comprobar cada una:

1. El borrador lleva el texto de la IA y sigue `pendiente`. Si la IA falla, queda el texto fijo.
2. Un `guestCount` cargado a mano no cambia.
3. Con una imagen simulada, devuelve el monto del modelo y **no guarda un gasto**.
4. El post después de la fiesta queda como borrador, no publicado.
5. Las tareas salen según los servicios, y correr dos veces no duplica.
6. El texto para el DJ queda guardado en la fiesta.
7. Sin respuestas no llama al modelo.
8. La agenda trae primero lo que falta.
9. No duplica el borrador.
10. Un campo escrito a mano no cambia.
11. Un invitado celíaco y un plato con gluten dan una alerta.
12. Sin tope de IA, no llama al modelo.
13. El aviso muestra los cambios de mesa.
14. Una sesión de personal no ve las conversaciones.

Rompé a propósito la regla de "sólo campos vacíos" (bloques 2 y 10) y fijate que la prueba se ponga en rojo.

Para lo que se ve en pantalla (bloques 6, 11 y 13) va una prueba de navegador,
`tests/e2e/la-ia-trabaja-sola.spec.ts`, con las respuestas del servidor simuladas.

Corré esas pruebas solas, después `npx tsc --noEmit`, `npx jest --silent` y `npm run "publicar?:rapido"`, y
pegá las últimas líneas de cada uno en la propuesta. Actualizá `docs/QUE-HAY-EN-LA-APP.md`: la línea de
recibos y la de cada cosa que ahora es automática.

```comprobar
usa: generateAiCommercialFollowup en src/lib/agentes/motor-agentes.ts
usa: guestCount en src/app/actions/whatsapp.ts
usa: media url en src/ai/flows/extract-receipt-data.ts
# Bloque 4
usa: autoGenerarBorradoresSemanales en src/app/api/cron/asistente-proactivo/route.ts
usa: readiness en src/app/(app)/fiestas/nueva/tareas/client.tsx
usa: briefDj en src/app/(app)/fiestas/nueva/musica/page.tsx
usa: generateTestimonialAction en src/app/(app)/settings/feedback/page.tsx
usa: analyzeEventPlan en src/app/(app)/fiestas/nueva/reuniones/page.tsx
# Bloque 9
usa: generateAiPostEventMaterial en src/lib/agentes/motor-agentes.ts
usa: estacionamiento en src/app/(app)/fiestas/nueva/logistica/page.tsx
usa: menu en src/app/(app)/fiestas/nueva/alergias/page.tsx
usa: suggestPalette en src/app/(app)/fiestas/nueva/decoracion/page.tsx
no-usa: consola en src/app/(app)/fiestas/nueva/invitados/layout/page.tsx
usa: getConversacionesAsistenteCliente en src/app/(app)/fiestas/nueva/page.tsx
prueba: src/__tests__/la-ia-trabaja-sola-235.test.ts
prueba: tests/e2e/la-ia-trabaja-sola.spec.ts
```

