# Orden 327 — Lo mejor de las otras plataformas de redes: comentá y te llega, la competencia, las menciones y la página de enlaces (19/11/2026)

**Pedido del dueño:** *"revisá otras plataformas para mejorar esta"*. Claude comparó con ManyChat, Metricool, Later y
Linktree y le propuso cuatro cosas; el dueño contestó **"Todo"**.

**Cómo se entrega:** en la **misma propuesta que las órdenes 322 a 326**, sobre `claude/juntar-1443`, después de la 326
(usa su solapa Comentarios y el asistente de la 325). Si un bloque se traba, se entrega el resto igual en la misma propuesta,
diciendo cuál faltó. Antes de decir "terminé": `docs/ANTES-DE-ENTREGAR.md`.

## Cómo está hoy (investigado por Claude el 19/11)

- El aviso de Meta entra por `src/app/api/meta/webhook/route.ts`. Hoy **sólo** lee `entry.messaging` (mensajes directos,
  ~línea 92) y los guarda en `social-mensajes-directos.json`. **No lee `entry.changes`**: los comentarios llegan recién
  cuando el despertador `src/app/api/cron/metricas-de-redes/route.ts` corre `syncCommentsFromNetworks`
  (`src/lib/social-media/comments-backfill.ts`).
- Los ajustes de respuestas viven en `marketing-respuestas-comentarios.json` (`getAjustesRespuestasComentarios`,
  `comments-backfill.ts:39`).
- **No existe** nada de: palabra clave → mensaje privado, mirar cuentas de la competencia, menciones en historias
  (`story_mention`), ni página de enlaces para la biografía. Claude lo buscó sin distinguir mayúsculas.
- El WhatsApp de la empresa sale de `AK_WHATSAPP_NUMBER` (`src/lib/public-contact.ts`). La marca de origen `(ref AK-…)` la
  agrega la orden 325 en `src/lib/commercial/contact.ts`. Los parámetros `utm_*` ya los lee `src/lib/medicion-segura.ts`.

## Bloque 1 — "Comentá FECHA y te llega por privado" (como ManyChat)

- **Ajustes** (en el mismo archivo de ajustes de respuestas): interruptor **"Palabras clave"**, prendido, y la lista de
  palabras, de entrada `FECHA`, `PRECIO`, `INFO`, `PRESUPUESTO`. Se comparan sin mayúsculas ni acentos y como palabra entera
  ("info" sí, "información" también; "informal" no).
- Cuando un comentario en una publicación de AK (Instagram o Facebook) trae una palabra clave:
  1. **Mensaje privado al que comentó** con la "respuesta privada" de Meta: `POST /{page-id}/messages` con
     `recipient: { comment_id }`. Meta deja **una sola por comentario y dentro de los 7 días**; pasado eso no se intenta.
     El texto lo arma el asistente de la orden 325 (dice que es un asistente, saluda por el nombre) e incluye el enlace del
     simulador con la marca `ref AK-…` y `utm_source=instagram&utm_medium=comentario` (o `facebook`).
  2. Respuesta pública corta: *"¡Te escribimos por privado! 💬"*. **Nunca un precio ni una fecha en público.**
  3. Se guarda en el comentario `privadoEnviadoAt` y `palabraClave`. Si ya tiene `privadoEnviadoAt`, **no se manda otro**,
     aunque el despertador y el aviso de Meta lo traigan los dos.
- **Que llegue en el momento, no a la hora:** en `route.ts`, leer también `entry.changes`:
  - Instagram: `field === 'comments'` (`value.id`, `value.text`, `value.from`, `value.media.id`).
  - Facebook: `field === 'feed'` con `value.item === 'comment'` y `value.verb === 'add'`.
  
  Guardarlo en `social-comments.json` (mismo formato que `comments-backfill.ts`, sin duplicar por id) y correr ahí mismo las
  reglas de la orden 326 y de este bloque. El despertador queda como respaldo y **no repite** lo ya hecho.
- **Orden de las reglas, para que no se pisen con la 326:** primero quejas y spam (se ocultan y no se contestan, aunque
  traigan la palabra), después palabra clave, después pregunta, después positivo. **Un comentario recibe un solo mensaje
  privado**, venga por la regla que venga.
- El que escribe por ese privado entra al CRM como prospecto con origen `comentario` (puerta 3 de la orden 325, por la marca).

## Bloque 2 — Mirar a la competencia (como Metricool)

- **Ajustes:** lista "Cuentas de la competencia" (usuarios de Instagram, hasta 10), vacía de entrada, con interruptor
  prendido. Archivo nuevo `marketing-competencia.json` (documento entero: se guarda con `mutateGenericJsonArray`, **no** con
  `mutateDataItem`; mirá `FILE_TO_COLLECTION` en `src/lib/firebase-sync.ts`, error 18 de `CLAUDE.md`).
- Archivo nuevo `src/lib/presencia-digital/competencia.ts` (`import 'server-only'`). **Una vez por semana**, llamado desde el
  despertador `metricas-de-redes` (no un despertador nuevo), por cada cuenta:
  `GET /{ig-user-id-de-AK}?fields=business_discovery.username(<cuenta>){followers_count,media_count,media.limit(12){caption,like_count,comments_count,timestamp,media_type,permalink}}`
  con el token de Instagram de AK. Sólo funciona con cuentas **de empresa o creador**: si Meta contesta que no, la cuenta
  queda con *"Esta cuenta no es de empresa: Instagram no deja verla desde otra aplicación"*, sin error rojo.
- Guardar una foto por semana (seguidores, publicaciones por semana, promedio de me gusta y comentarios, lo que más funcionó).
- **En Resultados**, una sub-solapa nueva **"Competencia"** (al lado de las que ya están en
  `presencia-digital-client.tsx` ~línea 102, `subTabResultados`): AK y cada cuenta en una tabla que entre en el celular
  (en el celular, tarjetas una abajo de la otra), con la flecha de la semana, y **un resumen de la IA en tres líneas**: qué
  publicó la competencia que funcionó y qué podría probar AK. El resumen sale de los datos guardados, **no inventa
  números**; si no hay datos, lo dice.
- **No se comenta, no se sigue ni se da me gusta** a cuentas ajenas: sólo se mira.

## Bloque 3 — "Te mencionaron en una historia": se agradece solo y se guarda (como Later)

- Cuando alguien menciona a AK en una historia de Instagram, Meta lo manda por `entry.messaging` con
  `message.attachments[].type === 'story_mention'` y `payload.url`. Hoy ese mensaje entra como un directo sin texto.
- En `route.ts`, separarlo:
  1. **Agradecimiento automático por privado, una sola vez por historia**, con la voz de AK (*"¡Gracias por compartirnos!
     🙌"*), sin precios ni promesas. Interruptor "Agradecer menciones", prendido.
  2. **Bajar la imagen o el video en el momento** (la dirección de Meta vence a las 24 horas) y guardarlo en el
     almacenamiento de la app, con quién lo mencionó y cuándo, en una lista **"Para compartir"** en la solapa Publicaciones.
  3. Botón **"Compartir en mi historia"** a un toque, que arma la publicación con el publicador que ya existe
     (`publishPostInternal`, `src/lib/presencia-digital/publicador.ts:131`) **o**, si la API no deja publicar historias, baja
     el archivo y abre Instagram. El interruptor "Compartir solo" existe, **apagado**: compartir la historia de otra persona
     lo decide el dueño.
- Si el que mencionó es un invitado de una fiesta (mismo usuario de Instagram que en la fiesta), se anota en la fiesta; si no,
  se guarda igual.

## Bloque 4 — Página de enlaces para la biografía de Instagram (como Linktree, pero de AK)

- Página pública nueva **`/enlaces`** (`src/app/enlaces/page.tsx`), armada del lado del servidor, liviana (sin animaciones
  pesadas, carga en el celular en menos de 2 segundos: skill `que-cargue-rapido`), con el logo de AK y **cuatro botones
  grandes**:
  1. **Armá tu presupuesto** → `/simulador-de-presupuesto?utm_source=instagram&utm_medium=bio`.
  2. **Mirá nuestras fiestas** → la galería de la portada.
  3. **Escribinos por WhatsApp** → con `buildWhatsAppLink` (`src/lib/commercial/contact.ts`), que lleva la marca `ref AK-…`
     de la orden 325, así entra al CRM.
  4. **Instagram / Facebook** → las cuentas de AK.
- Los textos de los botones y cuáles aparecen se cambian en Ajustes; sin promesas, sin "garantía", sin plazos.
- **Cuántos tocan cada botón:** cada botón pasa por `/api/enlaces/clic?d=<boton>`, que suma uno por botón y por día en
  `marketing-enlaces-clics.json` (documento, `mutateGenericJsonArray`) y redirige. Sin datos personales ni cookies nuevas. Se
  ve en Resultados → Atribución como "Biografía de Instagram".
- Va en el mapa de la app (`npm run mapa:generar`) y en `sitemap.ts`. **Es una pantalla nueva:** si el tope de pantallas de
  la 1443 no da, sube en una, con el motivo escrito al lado del número en la prueba del tope (*"orden 327: página de
  enlaces de la biografía"*).
- En Conexiones, al lado de Instagram, una línea: *"Poné este enlace en tu biografía"* con **Copiar** a un toque.

## Qué NO tocar

- Las reglas de la 326: una queja no se contesta sola, **nunca se borra nada solo**, en público nunca un precio.
- Lo personal del WhatsApp (orden 325).
- El simulador, su reloj y sus textos.
- La portada y su galería: sólo se enlazan.

## Qué tiene que comprobar la prueba

- **Bloque 1 (Jest con la red simulada):** un comentario "Info!!" manda **un** privado con `comment_id` y el enlace con
  `ref AK-`, y una respuesta pública **sin dígitos de precio**; el mismo comentario entrando por el aviso de Meta **y** por
  el despertador manda **un solo** privado; un comentario de 8 días no intenta el privado; "sos un chanta, info" se oculta y
  **no** recibe privado; con el interruptor apagado no se llama a la API.
- **Bloque 1, aviso de Meta:** un cuerpo de Instagram con `entry.changes[field=comments]` y uno de Facebook con
  `field=feed, item=comment` quedan guardados en `social-comments.json` sin duplicar.
- **Bloque 2:** con la respuesta de `business_discovery` simulada, la sub-solapa Competencia muestra los seguidores de dos
  cuentas; con el error de "no es de empresa", muestra la línea en criollo y no rompe la tabla.
- **Bloque 3:** un mensaje con `story_mention` **no** queda como directo vacío, guarda el archivo en "Para compartir" y manda
  **un** agradecimiento; repetido el mismo aviso, no manda otro; con "Compartir solo" apagado no publica nada.
- **Bloque 4 (navegador):** `/enlaces` abre sin sesión, muestra los cuatro botones, el de WhatsApp lleva `ref AK-` y tocar
  "Armá tu presupuesto" suma un clic y llega al simulador.

```comprobar
usa: changes en src/app/api/meta/webhook/route.ts
usa: comment_id en src/lib/social-media/comments-backfill.ts
usa: privadoEnviadoAt en src/lib/social-media/comments-backfill.ts
usa: story_mention en src/app/api/meta/webhook/route.ts
archivo: src/lib/presencia-digital/competencia.ts
usa: business_discovery en src/lib/presencia-digital/competencia.ts
usa: competencia en src/app/api/cron/metricas-de-redes/route.ts
usa: Competencia en src/app/(app)/empresa/presencia-digital/presencia-digital-client.tsx
archivo: src/app/enlaces/page.tsx
usa: buildWhatsAppLink en src/app/enlaces/page.tsx
archivo: src/app/api/enlaces/clic/route.ts
```
