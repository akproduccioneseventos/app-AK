# Orden 324 — Decisiones rápidas con IA: muro, álbum y comprobantes (19/11/2026)

**Pedido del dueño:** *"quiero tener lo mejor"*, sobre la **API de Gemini Decisions** (modelo `gemini-decision-1`) que le
llegó por mail de Google AI Studio. Contesta preguntas cerradas (sí o no, una opción, una nota con criterios) sobre texto,
imagen, audio, video y PDF en 150 a 250 ms. Cuesta 0,10 dólares por millón de tokens de entrada, nada por la salida, y
tiene parte gratis. **El dueño ya dijo que sí al gasto**: igual, cada uso pasa por el tope de gasto de IA de la app.

**Cómo se entrega:** en la **misma propuesta que las órdenes 322 y 323**, sobre `claude/juntar-1443`, al final. Antes de
decir "terminé": `docs/ANTES-DE-ENTREGAR.md`.

## Bloque 0 — Un solo lugar para llamarla, con tope y con plan B

- Archivo nuevo `src/lib/ai/decisiones.ts` (`import 'server-only'`), función `decidir({ entradas, preguntas, funcion })`.
  Llama por REST a `client.decisions.create` (api_version `v1beta`, modelo `gemini-decision-1`), porque la versión
  instalada de `@genkit-ai/google-genai` (1.20.0) puede no traerla: **mirá primero si la trae** y, si no, usá `fetch` a
  la dirección de la documentación. Clave: `GEMINI_API_KEY` (la misma que ya usa la app).
- **Antes de llamar**, `reservarConsumoIA` (`src/lib/ai/consumo-servidor.ts:133`) con una función nueva
  `'decisiones'` en `FuncionConCosto` (`src/lib/ai/consumo.ts:14`). Si no hay cupo, si falta la clave o si la respuesta
  tarda más de 3 segundos, **`decidir` devuelve `null`** y cada bloque sigue como hoy: **nunca se aprueba ni se rechaza
  algo porque la IA no contestó**.
- Interruptor en Ajustes de IA: "Decisiones rápidas", prendido, y se puede apagar.

## Bloque 1 — El muro se revisa solo, al instante

- Hoy `uploadSocialPost` (`src/app/actions/social-gallery.ts:314`) usa `reviewSocialContent`
  (`src/lib/social-fiesta/content-review.ts:59`), que mira **sólo reglas de texto**. Sumar, para fotos y videos,
  `decidir` con: `apropiado` (sí/no: ¿desnudez, violencia, gestos obscenos, drogas?), `es_de_la_fiesta` (sí/no) y
  `calidad` (nota de 1 a 3: borrosa / correcta / muy buena), y guardar la respuesta en el post (`iaRevision`).
- **La regla, que se respeta siempre:** si `requireApproval` (`src/types/fiesta.ts` ~852) está prendido, **todo va a
  revisión como hoy** y la IA sólo ordena la cola (lo dudoso arriba, con su motivo). Si está apagado: `apropiado = no` va
  a revisión y **no sale en pantalla**; lo demás sale. Si `decidir` devuelve `null`, se hace lo de hoy.
- En `src/app/evento/moderacion/[fiestaId]/page.tsx`, cada foto en revisión muestra el motivo en criollo ("La IA la marcó
  como posible desnudez").

## Bloque 2 — El álbum elige las mejores

- `armarAlbumInteligente` (`src/lib/album/armar-album.ts:56`) hoy toma las aprobadas. Ordenar por la nota de `calidad` del
  bloque 1, más los likes, y sacar las repetidas de la misma ráfaga. Las sin nota (si la IA no estaba) van después, no
  afuera. **El cliente no elige nada** (decisión del dueño, 1/9/2026): el álbum sale hecho.
- Si la nota de calidad no existe para una foto vieja, se puede pedir de a tandas desde el armado del álbum, dentro del
  tope.

## Bloque 3 — Los comprobantes del portal se revisan solos (sólo avisa: no cobra)

- `submitClientPayment` (`src/app/actions/fiesta/portal.actions.ts:474`) guarda el comprobante
  (`ClientPaymentNotification`, `src/types/fiesta.ts` ~1905). Después de guardarlo, `decidir` sobre la imagen o el PDF:
  `es_comprobante` (sí/no), `monto_coincide` (sí/no contra `monto`), `tiene_fecha` (sí/no) y `tipo` (opción:
  transferencia / depósito / Mercado Pago / otro). Guardarlo en `revisionIA` de la notificación.
- **Esto es plata, y lo revisa Claude línea por línea.** La IA **nunca** cambia `estado`, ni toca `approvedAt` ni
  `cobroConfirmadoAt`, ni el presupuesto. Sólo suma un cartel en Pagos rápidos (`src/app/(app)/pagos-rapidos/page.tsx`):
  "La IA no encuentra el monto" o "Parece un comprobante correcto". **Aprobar sigue siendo de una persona.**
- Si la revisión falla, el comprobante queda guardado igual y el cliente ve lo mismo que hoy.

## Qué NO tocar

- Los estados de pago, la aprobación y el candado de la plata (`el-candado-de-la-plata.test.ts`).
- La regla de moderación del dueño: con `requireApproval` prendido, nada sale sin una persona.

## Qué tiene que comprobar la prueba

- **Bloque 0:** sin clave, sin cupo o con la IA colgada, `decidir` devuelve `null` en menos de 4 segundos y **no** gasta
  cupo de más.
- **Bloque 1:** con la IA simulada diciendo `apropiado = no` y `requireApproval` apagado, la foto **no** aparece en el muro
  y sí en moderación con su motivo. Con `null`, se comporta igual que hoy.
- **Bloque 2:** con notas 3, 1 y 2, el álbum las pone 3, 2, 1; las sin nota no se pierden.
- **Bloque 3:** con la IA simulada diciendo `monto_coincide = no`, el estado sigue `pendiente`, el presupuesto no cambia
  y Pagos rápidos muestra el aviso. Y un caso "alguien sin permiso" (el personal) que no ve los comprobantes.

```comprobar
archivo: src/lib/ai/decisiones.ts
usa: reservarConsumoIA en src/lib/ai/decisiones.ts
usa: decidir en src/app/actions/social-gallery.ts
usa: calidad en src/lib/album/armar-album.ts
usa: revisionIA en src/app/actions/fiesta/portal.actions.ts
usa: revisionIA en src/app/(app)/pagos-rapidos/page.tsx
```
