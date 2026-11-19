# Orden 326 — El centro de redes: todas las conversaciones, todos los comentarios, y contesta y da me gusta solo (19/11/2026)

**Pedido del dueño:** *"en el panel de redes deben estar todas las conversaciones de todas las redes; otra de comentarios;
también debe contestar y dar me gusta a las publicaciones y contestar comentarios de todos"*.

**Cómo se entrega:** en la **misma propuesta que las órdenes 322 a 325**, sobre `claude/juntar-1443`, después de la 325
(usa su conversación del prospecto y su asistente). Antes de decir "terminé": `docs/ANTES-DE-ENTREGAR.md`.

## Cómo está hoy (investigado por Claude el 19/11)

- El centro de redes es `src/app/(app)/empresa/presencia-digital/presencia-digital-client.tsx`, con cinco solapas: Hoy,
  Mensajes, Publicaciones, Resultados y Conexiones (las cuida `tests/e2e/el-centro-de-redes-tiene-cinco-solapas.spec.ts`).
- **Mensajes** lee la bandeja única (`leerBandejaUnica`, `src/lib/mensajes/bandeja-unica.ts:56`): WhatsApp
  (`whatsapp-conversations.json`) y los mensajes directos de Instagram y Facebook (`social-mensajes-directos.json`).
- **Comentarios:** se traen de Facebook e Instagram con `syncCommentsFromNetworks` (`src/lib/social-media/comments-backfill.ts`
  ~línea 550), que corre en el despertador `src/app/api/cron/metricas-de-redes/route.ts`. Ya contesta solo a los positivos o
  neutros (`responderComentarioSiAplica`, ~línea 153) y a las preguntas (`responderPreguntaComentarioSiAplica`), con
  `postReplyToMetaComment` (~línea 122). Las quejas no se contestan solas, y ocultarlas ya existe (`is_hidden`, también en
  `src/app/actions/comentarios-redes.ts`). **No existe "me gusta".**

## Bloque 1 — Mensajes: todas las conversaciones de todas las redes, en una lista

- La solapa Mensajes muestra **una conversación por persona**, de cualquier red, ordenadas por la última, con el ícono de la
  red, si la atiende el asistente o una persona (`atiende`, orden 325 bloque 4) y un filtro por red.
- **Una sola fuente:** la conversación del prospecto de la orden 325 (`conversacion` en el CRM). La bandeja única lee de ahí.
  **Nunca** se guarda un mensaje dos veces, y lo personal del WhatsApp (lo que no pasa por las puertas de la 325) **no
  aparece**, porque no se guarda.
- Tocar una conversación la abre al lado, con el borrador de respuesta y "Abrir en WhatsApp" / "Responder" (Instagram y
  Messenger se contestan desde la app por la API; WhatsApp, con el enlace).
- TikTok: si su API para empresas permite leer los mensajes, entra igual; si no, se deja preparado y la solapa lo dice
  ("TikTok todavía no deja leer los mensajes desde otra aplicación").

## Bloque 2 — Solapa nueva "Comentarios": todos los comentarios de todas las publicaciones

- Sexta solapa **"Comentarios"**: cada comentario de cada publicación de AK (Facebook, Instagram y TikTok si se puede), con la
  foto de la publicación, quién comentó, qué dijo y su estado: **contestado solo**, **con me gusta**, **oculto**,
  **para vos**. Filtro por red y por estado.
- Agregá "Comentarios" a la prueba de las solapas (ahora son seis) sin sacar las cinco que ya comprueba.

## Bloque 3 — Contesta y da me gusta solo, a todos

Las reglas, que salen de decisiones del dueño (12/11 y 19/11):

- **Positivo o neutro** ("¡Hermoso!", "Qué lindo"): **me gusta** y respuesta cordial con la voz de AK. La respuesta ya
  existe; falta el me gusta.
- **Pregunta** (precio, fecha, "info"): me gusta, respuesta pública *"¡Te escribimos por privado! 💬"* y **mensaje directo**
  con el asistente de la orden 325. **Nunca un precio ni una fecha en público.**
- **Negativo, queja o insulto:** se **oculta solo** (ocultar se puede deshacer; **borrar no se hace nunca solo**), **sin me
  gusta** y sin respuesta, y al dueño le llega el aviso en el momento.
- **Spam:** se oculta, sin aviso.
- **Me gusta:**
  - En Facebook, a los comentarios de las publicaciones de la página: `POST /{comment-id}/likes` con el token de la página.
  - En Instagram, **confirmá en la documentación de Meta si la API deja dar me gusta a un comentario**. Si no deja, la solapa
    lo dice en una línea y no se inventa.
  - **No se da me gusta a publicaciones de otras cuentas**: las redes no lo permiten desde otra aplicación. Si el dueño lo pide,
    se explica en la solapa.
- Interruptor por red y por acción en Ajustes (contestar, me gusta, ocultar), usando los que ya existen
  (`getAjustesRespuestasComentarios`, `comments-backfill.ts:39`). El de me gusta, prendido.
- Cada acción queda registrada en el comentario (`meGustaAt`, `respondidoAt`, `ocultoAt`), así el despertador no la repite.

## Bloque 3b — Todas las redes de la presencia digital, no sólo Facebook e Instagram

**Pedido del dueño (19/11/2026):** *"comentarios en Google, Pinterest, todo automático en mi presencia digital"*. Hoy
`syncCommentsFromNetworks` trae sólo Facebook e Instagram. Sumar, con las mismas reglas del bloque 3, **cada red hasta donde
su API lo permita**. Antes de programar cada una, **confirmá en su documentación oficial qué deja hacer**, y anotalo en la
propuesta:

- **Google (reseñas de la ficha del negocio):**
  - Las **positivas** (4 y 5 estrellas) se agradecen solas, con el nombre de la persona y sin repetir el mismo texto.
  - Las **negativas** (1 a 3) **no se contestan solas**, porque una reseña de Google no se puede ocultar: la IA prepara la
    respuesta y al dueño le llega el aviso con "Publicar respuesta" a un toque.
  - Sin precios ni promesas.
- **YouTube:** contestar comentarios; el me gusta, si la API no lo deja, no se inventa.
- **Threads:** contestar respuestas a las publicaciones de AK.
- **Pinterest y X:** si la API no deja leer o contestar comentarios (en X puede pedir un plan pago), **no se paga nada**: la
  red aparece en la solapa Comentarios con *"Esta red no deja contestar desde otra aplicación"*.
- **TikTok:** igual que Pinterest y X, según lo que permita su API para empresas.
- Todo entra a la misma solapa Comentarios, con el ícono de la red, y lo hace el mismo despertador
  (`src/app/api/cron/metricas-de-redes/route.ts`).

## Bloque 4 — Una publicación, y sale en todas las redes

**Pedido del dueño (19/11/2026):** *"las publicaciones las hago iguales en todas las redes; quisiera hacer una y que se publique
en todas: Pinterest, Google, redes, todo"*.

- **Ya existe el motor:** `publishPostInternal` (`src/lib/presencia-digital/publicador.ts:131`) recorre `selectedPlatforms` y
  publica en Facebook, Instagram, TikTok, YouTube, Google (ficha del negocio), Pinterest, Threads y X. **No se rehace.**
- **Lo que falta:** en `src/components/social-media/NewPostDialog.tsx:73` vienen marcadas de entrada sólo Instagram y
  Facebook. Que vengan marcadas **todas las redes conectadas** (`isConnected` en las conexiones), y que se puedan destildar.
  Las no conectadas aparecen apagadas con "Conectar" al lado.
- **Cada red con lo suyo, solo:** la IA (Gemini 4 Hydrogen) arma, a partir de un solo texto, la versión de cada red:
  - X, corto;
  - Instagram y TikTok, con hashtags;
  - Google, sin hashtags y con el botón "Consultar";
  - Pinterest, con título y el enlace a la web.

  Se muestran las versiones antes de publicar, para cambiar la que quiera. **Mismas reglas de siempre: sin precios, sin
  promesas, sin "garantía".**
- **Si una red pide algo que falta** (Instagram y Pinterest sin imagen, TikTok y YouTube sin video), esa red queda tildada en
  gris con el motivo en una línea, y las demás se publican igual. Al terminar: *"Publicado en 5 de 7. Instagram: falta la
  foto"*, nunca "listo" si alguna falló.
- Los borradores automáticos (los que se publican solos a las 12 horas, decisión del 12/11) también salen en todas las
  conectadas.

## Qué NO tocar

- La regla de que una queja no se contesta sola, y la de no borrar nunca solo.
- Lo personal del WhatsApp (orden 325): no se lee ni se muestra.
- Las solapas Hoy, Publicaciones, Resultados y Conexiones.

## Qué tiene que comprobar la prueba

- Con datos de prueba de tres redes, Mensajes muestra **una conversación por persona**, con su ícono, y el filtro por
  Instagram deja sólo las de Instagram.
- La solapa Comentarios aparece y lista comentarios de dos redes con su estado.
- Con la red simulada: un comentario positivo recibe **me gusta y respuesta**; una pregunta recibe la respuesta pública **sin
  precio** y un mensaje directo; un insulto queda **oculto, sin me gusta ni respuesta**, y llega el aviso; correr el
  despertador dos veces **no** da dos me gusta.
- Con el interruptor de me gusta apagado, no se llama a la API de me gusta.
- **Bloque 3b:** una reseña de Google de 5 estrellas (simulada) se contesta sola; una de 2 estrellas **no** se contesta y deja
  la respuesta preparada con el aviso al dueño.
- **Bloque 4:** con cuatro redes conectadas, la publicación nueva viene con las cuatro tildadas; sin imagen, Instagram queda en
  gris con su motivo y las otras tres se publican (con la red simulada), y el cartel dice "3 de 4", no "listo".

```comprobar
usa: Comentarios en src/app/(app)/empresa/presencia-digital/presencia-digital-client.tsx
usa: /likes en src/lib/social-media/comments-backfill.ts
usa: meGustaAt en src/lib/social-media/comments-backfill.ts
usa: conversacion en src/lib/mensajes/bandeja-unica.ts
no-usa: useState<SocialPlatform[]>(['Instagram', 'Facebook']) en src/components/social-media/NewPostDialog.tsx
usa: isConnected en src/components/social-media/NewPostDialog.tsx
usa: Google en src/lib/social-media/comments-backfill.ts
usa: YouTube en src/lib/social-media/comments-backfill.ts
prueba: tests/e2e/el-centro-de-redes-tiene-cinco-solapas.spec.ts
```
