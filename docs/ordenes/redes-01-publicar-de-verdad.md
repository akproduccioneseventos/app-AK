# Orden `redes-01` — que la app publique de verdad en Instagram y Facebook

Para Gemini. **UNA sola propuesta con todos los bloques adentro.** Si un bloque se
traba, entregá el resto igual y decí cuál faltó.

Antes de subir tiene que dar todo verde: `npx tsc --noEmit`, `npx jest --silent`,
`npm run build`, `npm run check:acentos`.

Comentarios del código en castellano, explicando **por qué**, no qué hace la línea.

---

## De qué se trata

Hoy la pantalla de redes sociales de la empresa es un **planificador**: se arma la
publicación, la IA escribe el texto, se guarda con fecha… y después el dueño copia
y pega a mano en Instagram o Facebook. La propia pantalla lo dice.

Lo que falta es que **publique sola**. Eso es lo que hay que construir.

## Antes de escribir código: leé esto

Publicar en Instagram y Facebook desde una app no es sólo programar. Del lado de
Meta hacen falta cosas que **no dependen del código** y que hay que dejar
documentadas para el dueño:

- La cuenta de Instagram tiene que ser **Profesional** (de empresa o creador) y
  estar vinculada a una **Página de Facebook**. Una cuenta personal no se puede
  publicar por API, no hay forma.
- Hace falta una app en Meta for Developers con los permisos de publicación, y Meta
  los revisa antes de habilitarlos para cuentas que no sean del propio
  desarrollador.
- Los permisos de larga duración caducan cada 60 días y hay que renovarlos.
- Instagram por API **no publica historias** con las mismas facilidades que el feed,
  y tiene topes de publicaciones por día.

**Primer entregable, antes que el código:** un documento
`docs/redes-sociales-requisitos.md` que le explique al dueño, en castellano simple
y sin jerga, qué tiene que hacer él del lado de Meta, en orden, con qué pantalla
entra a cada cosa. Sin eso, el código no sirve de nada.

Si algo de la lista de arriba resulta imposible o cambió, **decilo en la propuesta**
en vez de construir algo que no va a poder funcionar.

---

## Bloque 1 — Conectar la cuenta de verdad

Hoy `src/app/(app)/settings/social-connections/page.tsx` guarda **el enlace** al
perfil, nada más, y sirve para mostrarlo en las invitaciones. Eso queda como está.

Lo nuevo es una conexión real:

1. Pantalla para conectar con Meta, con un botón "Conectar Instagram y Facebook"
   que arranque el ingreso de Meta y traiga el permiso de la Página y de la cuenta
   de Instagram vinculada.
2. Guardar el permiso del lado del servidor, **nunca en el navegador**, junto con
   qué Página y qué cuenta de Instagram quedaron vinculadas.
3. Mostrar el estado con claridad: *Conectado como AK Producciones · Instagram
   @akproducciones*, con la fecha en que vence y un botón para renovar.
4. Si no está conectada, la pantalla de publicar tiene que **decirlo antes** y no
   dejar apretar "Publicar ahora". Hoy deja apretar igual.
5. Un botón para desconectar que borre el permiso guardado.

---

## Bloque 2 — Publicar ahora

En `src/app/actions/social-media.ts` ya existe `saveSocialPost()` y un parámetro
`autoPublish` que **nunca se usa**: es código muerto. Ahí va la publicación.

1. Una acción nueva que reciba el identificador del post guardado y lo publique en
   la red elegida.
2. Instagram: la imagen tiene que estar en una dirección pública accesible. Como
   las imágenes ya se suben al almacenamiento de la app, usar esa dirección.
3. Facebook: publicar en la Página vinculada, con texto e imagen.
4. Guardar en el post el resultado: publicado o falló, cuándo, y el enlace a la
   publicación real para poder abrirla desde la app.
5. **Los errores se traducen.** Si Meta contesta que el permiso venció, que la
   cuenta no es profesional o que se pasó del tope diario, el dueño tiene que leer
   eso en castellano y saber qué hacer, no ver el mensaje de Meta en inglés.

---

## Bloque 3 — Que la fecha programada dispare sola

Hoy se elige día y hora y **no hay nada que publique cuando llega el momento**.

Ya existe la carpeta `src/app/api/cron/` con dos tareas andando
(`generate-blog-post` y `recordatorios-de-pago`): copiar ese mismo patrón.

1. Una tarea nueva que corra cada quince minutos, busque los posts cuya fecha ya
   pasó y sigan sin publicar, y los publique.
2. Que no publique dos veces el mismo: marcarlo antes de intentar y guardar el
   resultado.
3. Si falla, reintentar hasta tres veces separadas en el tiempo y después dejarlo
   marcado como fallido **con el motivo en castellano**, visible en la pantalla.
4. En la lista de publicaciones, que se vea el estado de cada una: programada,
   publicada, falló. Con color, no sólo con texto.

---

## Bloque 4 — Que el dueño entienda qué pasó

1. En la pantalla de redes, un resumen arriba: cuántas programadas, cuántas
   publicadas este mes, cuántas fallaron.
2. Cada publicación fallida con un botón "Reintentar".
3. Cada publicación exitosa con un enlace para verla en Instagram o Facebook.

---

## Lo que NO hay que tocar

- El planificador actual tiene que **seguir funcionando igual** para quien no
  conecte las cuentas: armar, guardar, copiar y pegar a mano. Publicar solo es un
  agregado, no un reemplazo.
- El atajo de WhatsApp, que abre el mensaje ya escrito, queda como está.
- Los enlaces a los perfiles que se muestran en las invitaciones no se tocan.
- El agente de marketing que escribe los textos no se toca: sigue generando.
- El ajuste anual del 15%, el descuento del Salón Club Uruguay y el del presupuesto
  son decisiones de marketing del dueño.

## Si algo no se puede

Este bloque depende de aprobaciones de Meta que pueden demorar o no salir. Si eso
traba la publicación real, **entregá igual lo que sí se pueda**: el documento de
requisitos, la pantalla de conexión y el estado de las publicaciones. Y dejá escrito
qué quedó esperando y de qué depende.

## Al terminar

Anotar en `docs/YA-RESUELTO.md` qué quedó funcionando y qué quedó pendiente de una
aprobación externa, para que nadie lo vuelva a auditar como si fuera un defecto.
