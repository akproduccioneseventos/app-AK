# PARA GEMINI - Orden 192: un solo centro de presencia digital y redes, con todos los mensajes juntos

**Una sola propuesta con todos los bloques.** Si un bloque se traba, entregá el resto igual en la misma
propuesta y avisá cuál faltó. Antes de decir "terminé", pasá `docs/ANTES-DE-ENTREGAR.md` entero.

**Arrancá de la rama `claude/app-debug-stabilize-m70e6z`, no de `main`**, encima de las órdenes 188 a
191. **No traigas nada de las propuestas 1333 ni 1336** salvo el archivo que se nombra en el bloque 2.

## Lo que pidió el dueño (20/10/2026)

*"Quiero un centro de presencia digital y redes juntos, mensajes juntos y automáticos."* Y aprobó el
ayudante diario de redes que vino en la 1336.

## Lo que ya existe (no lo rehagas, juntalo)

- **Presencia digital:** `src/app/(app)/empresa/presencia-digital/presencia-digital-client.tsx`, con las
  solapas (~87) `revision`, `posicionamiento`, `comentarios`, `web`, `directorios`, `atribucion`, `ads`,
  `google_ficha`, `publicaciones` e `historial`. Lee `?tab=` (~88).
- **Redes sociales:** `src/app/(app)/empresa/redes-sociales/page.tsx`, con "Todos", "Listos para
  copiar", "Con error" y "Calendario" (~349), y sus acciones en `src/app/actions/social-media.ts`.
- **Comentarios de Instagram y Facebook:** se traen con `syncCommentsFromNetworks`
  (`src/lib/social-media/comments-backfill.ts` ~441) y se guardan en `social-comments.json`
  (`guardar-comentarios.ts`).
  - La respuesta con IA a preguntas es `armarRespuestaAPregunta` (~41) y
    `responderPreguntaComentarioSiAplica` (~103).
  - Se prende con `marketing-respuestas-comentarios.json` (`activo`, hoy apagado por omisión).
- **WhatsApp:** `src/app/api/whatsapp/webhook/route.ts`.
  - Contesta solo **únicamente** si `correspondeContestarSolo` (`src/lib/whatsapp/vino-de-la-publicidad.ts`
    ~104) dice que la persona vino de un anuncio o de una publicación.
  - Las conversaciones viven en `whatsapp-conversations.json` (`src/app/actions/whatsapp.ts`).
- **Reseñas de Google:** `generarBorradorRespuesta` (`src/lib/social-media/google-business-resenas.ts` ~48).
- **Publicación programada:** `procesarPosteosProgramados` (`src/lib/presencia-digital/publicador.ts`
  ~531). Facebook e Instagram **sólo suben fotos** (`meta-publisher.ts` ~13 y ~83).
- **Revisión diaria:** `buildDigitalPresenceDailyReview` (`src/lib/presencia-digital/revision-diaria.ts`
  ~12), con tope de IA.
- **Mensajes directos de Instagram y de Messenger: NO EXISTEN.** No hay nada que los reciba.

## Bloque 1 — un solo centro, con cinco solapas

La pantalla es `presencia-digital-client.tsx`, renombrada a la vista **"Presencia y redes"**. Es la
puerta "Marketing y Redes" de la orden 182 (`/marketing` lleva acá). Cinco solapas, en este orden:

1. **Hoy:** el ayudante diario (bloque 2).
2. **Mensajes:** la bandeja única (bloques 3 y 4).
3. **Publicaciones:** el calendario y las publicaciones. Traé las cuatro solapas de
   `redes-sociales/page.tsx` adentro de esta.
4. **Resultados:** posicionamiento, atribución, anuncios y ficha de Google.
5. **Conexiones:** cada red, si está conectada, y lo que falta para conectarla.

Las solapas viejas se reparten en estas cinco; ninguna se pierde. `/empresa/redes-sociales` y cada
`?tab=` viejo **llevan a la solapa nueva que corresponde**: no se borran direcciones.

## Bloque 2 — el ayudante diario (aprobado por el dueño)

- Tomá `src/lib/presencia-digital/revision-diaria.ts` y `src/types/presencia-digital.ts` del commit
  `3fd17bb41` (rama `feat/maxima-innovacion-5-pilares-ak`), con `git show 3fd17bb41:<archivo>`, **sólo esos
  dos**, y su parte de la pantalla.
- Qué muestra, con datos reales: qué red trajo más consultas y cierres en 30 días, qué tipo de fiesta se
  cotiza más, qué publicación funcionó, qué red lleva más de 3 días sin publicar, las preguntas repetidas
  en comentarios, y las fiestas recientes que no tienen fotos publicadas.
- Arma **tres publicaciones listas** para el día, con "Crear borrador" a un toque. El borrador **no se
  publica solo**: va al calendario.
- **Lo corre el despertador** todas las mañanas (en `src/app/api/cron/metricas-de-redes/route.ts` o en uno
  nuevo), no sólo al abrir la pantalla. El aviso "Tus 3 publicaciones de hoy" sale en `/mi-dia`.
- Pasa por `hayPresupuestoParaIA()` y `registrarConsumoIA()`. **Si no hay datos, lo dice: nada de
  números inventados.** Las cifras de la empresa son "+200" y "+7 años", nunca otras.

## Bloque 3 — todos los mensajes en una bandeja

Archivo nuevo `src/lib/mensajes/bandeja-unica.ts`, con `leerBandejaUnica()`, que junta en una sola lista
ordenada por fecha:

- las conversaciones de WhatsApp (`whatsapp-conversations.json`);
- los comentarios de Instagram y Facebook (`social-comments.json`);
- los mensajes directos de Instagram y Messenger (bloque 4);
- las reseñas de Google.

Cada mensaje lleva: canal (con su ícono), quién es (y si ya es **cliente o prospecto del CRM**, buscándolo
por teléfono o nombre), el texto, si ya se contestó y **cómo** ("solo", "una persona" o "pendiente").

**En la pantalla:**
- filtros por canal y "Sin contestar" primero;
- en cada mensaje, la respuesta que propone la IA, con dos botones: **"Mandar"** y "Editar";
- "Pasar a prospecto" crea el prospecto en el CRM con un toque, sin escribir de nuevo los datos.

## Bloque 4 — mensajes directos de Instagram y Messenger, y video en Instagram y Facebook

- **Ruta nueva `src/app/api/meta/webhook/route.ts`:**
  - el `GET` verifica `hub.challenge` igual que el de WhatsApp;
  - el `POST` comprueba la firma `X-Hub-Signature-256` con la clave de la app de Meta y, **si no coincide,
    no guarda nada**;
  - guarda en `social-mensajes-directos.json`, un registro por mensaje, sin pisar la lista (pregunta 22);
  - responde rápido, y si Meta manda el mismo mensaje dos veces, se guarda una (por el `mid`).
- **Contestar** con la API de mensajes de Meta, desde la bandeja.
- **Si la conexión todavía no está hecha**, la solapa Conexiones dice qué falta ("Falta el permiso de
  mensajes de Instagram en la app de Meta"). **Nada de simular mensajes.** Conectarlo no cuesta por mes.
- **Videos:** `meta-publisher.ts` suma Reels de Instagram (`media_type=REELS` con `video_url`, esperando
  a que el contenedor diga `FINISHED`) y video de Facebook (`/{page-id}/videos`). Si falla, el posteo
  queda "Con error" con el motivo, nunca "publicado".

## Bloque 5 — qué se contesta solo y qué no (lo pidió el dueño, con sus reglas)

| Canal | Se contesta solo | Si no |
|---|---|---|
| Comentario en una publicación de AK (Instagram, Facebook) | **Sí**, si es una pregunta, con `armarRespuestaAPregunta` | Elogios: un "¡Gracias!" con corazón. Quejas: **nunca solo**, van arriba en la bandeja. |
| Mensaje directo a la cuenta de AK (Instagram, Messenger) de alguien que **no es cliente** | **Sí**, la primera respuesta: qué hace AK, el enlace al simulador y "te escribimos por acá" | Desde el segundo mensaje, propuesta de la IA y **lo manda una persona**. |
| Mensaje directo de un **cliente con fiesta contratada** | **No** | Propuesta de la IA, lo manda una persona. |
| WhatsApp que viene de un anuncio o publicación | **Sí**, como hoy (`correspondeContestarSolo`) | — |
| WhatsApp de cualquier otro (familia, proveedores, amigos) | **Nunca** | No se le propone nada; se ve en la bandeja como "personal". |
| Reseña de Google | **No** | Borrador listo, lo publica una persona. |

- **Interruptor por canal** en la solapa Mensajes: "Contestar solo comentarios" y "Contestar solo
  mensajes directos". Están **prendidos por omisión**, porque lo pidió el dueño, y **se apagan con un
  toque**.
  - `marketing-respuestas-comentarios.json` pasa a `{ comentarios: true, mensajesDirectos: true }`.
  - El `activo` viejo se lee como `comentarios`.
- **Lo que se contesta solo nunca dice:** precios, descuentos, fechas libres, "garantía", "24/7",
  "congelar", ni un plazo de respuesta. Para precios, el enlace al simulador.
- **Tope:** como máximo 3 respuestas solas por persona por día. Cada respuesta pasa por el tope de IA,
  y sin IA va el texto fijo.
- **Todo lo que se contestó solo queda en la bandeja** con la marca "Contestó AK", para que el dueño
  lo vea.

## Qué NO tocar

- La regla de WhatsApp de `correspondeContestarSolo`: es una decisión del dueño, porque es su número
  personal.
- Cobros, presupuestos y permisos.
- Que las claves de redes y WhatsApp las ve sólo administración (`YA-RESUELTO.md` ~1336).
- Que ocultar un comentario funcione como hoy (`hideCommentInternal`).

## Prueba (que mire el resultado)

- `src/__tests__/la-bandeja-junta-todos-los-mensajes.test.ts`:
  - con un WhatsApp, un comentario, un mensaje directo y una reseña de mentira, `leerBandejaUnica()`
    devuelve los cuatro ordenados por fecha;
  - un número que es cliente sale marcado como cliente.
- `src/__tests__/lo-que-se-contesta-solo-respeta-las-reglas.test.ts`:
  - la pregunta en un comentario se contesta sola;
  - la queja no;
  - el mensaje directo de un cliente con fiesta contratada no;
  - el WhatsApp de un número sin anuncio no;
  - con el interruptor apagado, nada sale solo;
  - el cuarto mensaje del día de la misma persona no sale;
  - ninguna respuesta automática contiene "$", "garantía", "24/7" ni "congel".
- `src/__tests__/el-webhook-de-meta-no-acepta-firmas-falsas.test.ts`:
  - con una firma falsa, no se guarda nada;
  - el mismo `mid` dos veces guarda uno.
- `src/__tests__/el-reel-no-dice-publicado-si-fallo.test.ts`: si Meta devuelve error, el posteo queda
  "Con error".
- `tests/e2e/el-centro-de-redes-tiene-cinco-solapas.spec.ts`:
  - se ven Hoy, Mensajes, Publicaciones, Resultados y Conexiones;
  - `/empresa/redes-sociales` lleva a Publicaciones.

```comprobar
archivo: src/lib/mensajes/bandeja-unica.ts
archivo: src/app/api/meta/webhook/route.ts
usa: leerBandejaUnica en src/app/(app)/empresa/presencia-digital/presencia-digital-client.tsx
usa: X-Hub-Signature-256 en src/app/api/meta/webhook/route.ts
usa: REELS en src/lib/social-media/meta-publisher.ts
usa: mensajesDirectos en src/lib/social-media/comments-backfill.ts
usa: buildDigitalPresenceDailyReview en src/app/api/cron/metricas-de-redes/route.ts
usa: correspondeContestarSolo en src/app/api/whatsapp/webhook/route.ts
prueba: src/__tests__/la-bandeja-junta-todos-los-mensajes.test.ts
prueba: src/__tests__/lo-que-se-contesta-solo-respeta-las-reglas.test.ts
prueba: src/__tests__/el-webhook-de-meta-no-acepta-firmas-falsas.test.ts
prueba: src/__tests__/el-reel-no-dice-publicado-si-fallo.test.ts
prueba: tests/e2e/el-centro-de-redes-tiene-cinco-solapas.spec.ts
```
