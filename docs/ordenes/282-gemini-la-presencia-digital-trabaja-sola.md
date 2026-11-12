# Orden 282 — La presencia digital trabaja sola: conectada, contestando, ocultando y publicando (12/11/2026)

**Para Gemini, en la computadora del dueño.** Arrancá de `claude/app-debug-stabilize-m70e6z` (`git pull`), **después de
entregar la 280/281**, rama nueva `gemini/orden-282-presencia-sola`. **Una sola entrega, sin fusionar.** Repasá
`docs/ANTES-DE-ENTREGAR.md`.

## Qué pasó y qué quiere el dueño

Entró a su Facebook y tenía **un mes de comentarios sin contestar**; un comentario negativo tampoco lo hubiera visto. Sus
palabras: *"necesito que mi app eso me lo haga todo automático… publica automático, no me da el tiempo… un control
exhaustivo de toda mi presencia digital… hay que darle acceso a todo para que la aplicación trabaje sola"*.

**Lo que Claude midió en el código (no lo rehagas):** la app YA tiene casi todo, pero **nunca corrió**:

- `syncCommentsFromNetworks` (`src/lib/social-media/comments-backfill.ts` ~469) trae los comentarios, los clasifica con IA
  (`src/lib/social-media/clasificador-comentarios.ts`), contesta preguntas (`responderPreguntaComentarioSiAplica` ~131) y
  oculta insultos y spam (`hideCommentOnMeta` ~224). La dispara la tarea automática `metricas-de-redes` y el ingreso a la
  app (`src/lib/automatico/al-entrar-a-la-app.ts` ~177).
- **No corre porque Facebook e Instagram no están conectados**: la puerta de publicar dice "Sin conectar: … Instagram,
  Facebook". La conexión se guarda con `saveMetaPublishingCredentials` (`src/app/actions/social-connections.ts` ~154:
  `pageId`, `pageAccessToken`, `instagramAccountId`).
- Las respuestas automáticas están **apagadas de fábrica** (`getAjustesRespuestasComentarios` ~28: `activo: false`).
- Una **queja legítima nunca se oculta** (`clasificador-comentarios.ts` ~123).

## Bloque 1 — Conectar Facebook e Instagram de verdad (con el dueño al lado)

En la computadora del dueño, con él iniciando sesión en Meta (**su clave no se escribe en ningún lado**):

- Con la app de Meta que ya usa el WhatsApp (o una nueva de tipo Empresa, gratis), sacá un **token de página de larga
  duración** de "AK Producciones Eventos" con los permisos `pages_show_list`, `pages_read_engagement`,
  `pages_manage_engagement`, `pages_read_user_content`, `pages_manage_posts`, `instagram_basic`,
  `instagram_manage_comments`, `instagram_content_publish` y `instagram_manage_messages`.
- Cargalo en la app desde Presencia digital (la pantalla que ya llama a `saveMetaPublishingCredentials`), junto con el
  `pageId` y el `instagramAccountId`.
- Comprobá que funcionó: la puerta (`npm run "publicar?"`) tiene que decir Facebook e Instagram **conectados**, y una
  sincronización completa (`triggerCommentsSyncAction(true)`) tiene que traer los comentarios del último mes.
- Si el token vence (Meta los vence), la app **le avisa al dueño por WhatsApp 7 días antes** y muestra "Volver a
  conectar" en Presencia digital. Buscá si ya existe ese aviso antes de hacerlo.
- Anotá en `docs/evidencias/conexion-meta.md` qué permisos quedaron y la fecha de vencimiento (**sin el token**).

## Bloque 2 — Contestar todo, solo

- Las respuestas automáticas de comentarios pasan a **prendidas de fábrica** (`activo: true` en
  `getAjustesRespuestasComentarios`); el interruptor por canal sigue en Ajustes para apagarlo.
- Hoy sólo se contestan **preguntas**. Sumá: los **comentarios positivos o neutros** ("¡Hermoso!", "Qué lindo") reciben un
  agradecimiento corto con la voz de AK, distinto cada vez (la IA, con las reglas de siempre: sin precios, sin "garantía",
  sin "24/7", sin nombrar a nadie del personal ni al agasajado).
- **Nada queda sin contestar más de 24 horas**: una vez por día, todo comentario sin respuesta que no esté oculto ni sea
  spam se contesta (o, si es una queja, va al bloque 3). La primera vez, **el mes atrasado** también.
- Cada respuesta automática queda anotada en el comentario (`respuestaAutomatica`) para no contestar dos veces.

## Bloque 3 — Lo negativo se detecta y se esconde, y al dueño le llega el aviso (decisión del dueño)

- **Insultos y spam**: se ocultan solos, como ya hace (reversible con "Mostrar de nuevo", que ya existe).
- **Quejas y comentarios negativos** (decisión del dueño, 12/11/2026, cambia la de antes): **también se ocultan solos**,
  porque son reversibles: ocultar no borra, y el que comentó y sus amigos lo siguen viendo. Cambiá la línea ~123 de
  `clasificador-comentarios.ts` para que una queja legítima también recomiende ocultar, **y** que a la queja **no** se le
  conteste sola.
- **Cada negativo o queja le avisa al dueño por WhatsApp en el momento** (con los avisos al dueño que ya existen), con el
  texto del comentario y un enlace al comentario, para que él conteste en persona si quiere.
- **Nunca se borra nada solo.** Borrar no tiene vuelta atrás: queda un botón "Borrar" para el dueño.

## Bloque 4 — Publicar solo

Hoy los borradores (posfiesta, videos para redes de la orden 275, blog) esperan el toque del dueño. Decisión del dueño
(12/11/2026): *"publica automático, no me da el tiempo"*.

- Interruptor nuevo en Ajustes → Presencia digital: **"Publicar solo"**, **prendido de fábrica**.
- Con el interruptor prendido, cada borrador nuevo **le llega al dueño por WhatsApp con la vista previa** y, si en **12
  horas** no tocó "No publicar", pasa a `Programado` con la fecha del mejor horario (`calcularProximaFechaMejorHorario`,
  `src/lib/presencia-digital/publicador.ts`) y lo publica el publicador que ya existe.
- **Sólo fotos con permiso de promoción** (`fotosPromocionalesDeFiesta`, como pide la 275). Ese control no se saltea.
- Ritmo: no más de **una publicación por día por red**, para no saturar.

## Bloque 5 — El vigía: un tablero y un resumen diario

En Presencia digital, arriba de todo, un tablero por red (Facebook, Instagram, TikTok, YouTube, la ficha de Google):

- **Conectada o no** (y cuándo vence).
- **Comentarios sin contestar** (meta: cero), ocultados hoy, quejas de la semana.
- **Último posteo** y si pasaron más de 7 días sin publicar (en rojo).

Y **un resumen cada mañana por WhatsApp al dueño**, sólo si hay algo: "Ayer: 12 comentarios contestados, 1 queja
ocultada (ver), 1 publicación. Instagram: 9 días sin publicar".

**TikTok y la ficha de Google:** averiguá si sus API dejan leer y contestar comentarios y reseñas gratis. Si la de Google
(Business Profile) deja contestar reseñas, sumalo al bloque 2 con las mismas reglas. Si TikTok no deja, el tablero lo
dice ("TikTok no deja que una app conteste: revisalo a mano") y **no se inventa**.

## Pruebas

- `src/__tests__/la-presencia-contesta-todo.test.ts`: un comentario positivo recibe agradecimiento; una pregunta recibe
  respuesta; uno de hace 3 días sin respuesta se contesta en la pasada diaria; uno ya contestado no se contesta dos veces;
  ninguna respuesta tiene precios, "garantía" ni "24/7".
- `src/__tests__/lo-negativo-se-oculta-y-avisa.test.ts`: una queja se oculta (se llama a `hideCommentOnMeta`), **no** se
  contesta sola, y genera un aviso al dueño; un insulto se oculta; **nada llama a borrar**.
- `src/__tests__/publicar-solo-espera-12-horas.test.ts`: con "Publicar solo" prendido, un borrador de hace 11 h sigue en
  borrador, uno de hace 13 h pasa a Programado, uno marcado "No publicar" no pasa nunca, y uno con una foto sin permiso de
  promoción no pasa.

```comprobar
archivo: docs/evidencias/conexion-meta.md
usa: pages_manage_engagement en docs/evidencias/conexion-meta.md
prueba: src/__tests__/la-presencia-contesta-todo.test.ts
prueba: src/__tests__/lo-negativo-se-oculta-y-avisa.test.ts
prueba: src/__tests__/publicar-solo-espera-12-horas.test.ts
usa: hideCommentOnMeta en src/lib/social-media/comments-backfill.ts
```
