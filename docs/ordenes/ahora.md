# El recuerdo de cada invitado

**Para:** Gemini (Antigravity)
**Escribe:** Claude
**Fecha:** 17 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

Ésta es la **única orden vigente**. Es la última mejora que quedaba del plan: **el
video para cada invitado**.

## LEÉ ESTO PRIMERO: la idea original no se puede hacer, y hay una mejor

El pedido era: *"cada invitado recibe su propio video con las fotos donde sale
él"*. **Se verificó y no se puede.**

**La app no sabe quién aparece en cada foto.** `SocialGalleryPost` en
`src/types/social-gallery.ts` guarda `authorName` —**quién la sacó**, no quién
sale—, y no hay reconocimiento de caras ni etiquetas de personas. Para saber
quién aparece habría que agregar reconocimiento facial: caro, lento, se equivoca,
y con las caras de menores de edad es un problema serio que no vale la pena.

**La versión que sí se puede, y que rinde casi lo mismo:**

> **"Tu recuerdo de la fiesta": las fotos que sacaste vos**, en las estaciones y en
> el muro, con tu enlace personal.

En una fotocabina, el que la usa **sale en la foto**. Así que "las tuyas" y "las
que salís" son casi lo mismo, sin adivinar nada y sin gastar un peso en
inteligencia artificial.

## Y el otro hallazgo: hoy no se guarda de quién es cada foto

**`guestId` llega cuando se sube la foto pero no se guarda.** Se usa sólo para
comprobar que la persona tiene permiso, y después se descarta
(`src/app/actions/social-gallery.ts`, cerca de la línea 298).

**Ese es el cambio que habilita todo lo demás, y es chico.**

**Aviso importante:** esto sirve **de acá en adelante**. Las fiestas ya pasadas no
tienen ese dato y no se puede recuperar. Decilo en la entrega para que nadie
espere que funcione con lo viejo.

---

# BLOQUE 1 — Guardar de quién es cada foto

## La mitad ya está hecha: **el muro**. NO la rehagas.

Claude lo hizo el 17 de agosto porque toca quién ve qué. Ya está en `main`:

- `SocialGalleryPost` tiene el campo `guestId`.
- La subida al muro (`createSocialMediaPost` en
  `src/app/actions/social-gallery.ts`) lo guarda.
- **La regla que hace que sea seguro, y que vale también para lo que falta:** el
  dueño se guarda **sólo si `guestAuthorized` es verdadero**, o sea si la persona
  probó tener el enlace personal de ese invitado. Un `guestId` suelto **no se
  guarda nunca**: sin eso, cualquiera manda el identificador de otro y se queda
  con sus fotos.
- Si vino sin enlace personal, la foto se guarda igual **sin dueño**. Nadie
  queda bloqueado.
- Hay pruebas en `src/__tests__/dueno-de-la-foto-y-prospecto-sin-telefono.test.ts`.

## Lo que falta y te toca: **las estaciones**

Fotocabina, espejo mágico y plataforma 360 suben por otro camino
(`createSocialMediaPostFromUrlForStation`, en
`src/app/actions/fiesta/entretenimiento.actions.ts` cerca de la línea 211), y
**hoy ese camino ni siquiera recibe el enlace personal del invitado**. Hay que:

1. Hacer que las pantallas de esas estaciones manden el `guestId` y el
   `guestAccessToken` cuando los tengan.
2. Validarlos en el servidor con `hasPublicGuestAccess` —**la misma función que
   usa el muro**— y recién ahí guardar el dueño.
3. **No confíes en el `guestId` que llega solo.** Si no valida, se guarda la foto
   sin dueño y listo.

**Esto solo ya sirve**, aunque no se haga nada más: permite saber cuántas fotos
sacó cada uno y quién participó más.

# BLOQUE 2 — "Tu recuerdo", en el enlace personal de cada invitado

Al día siguiente, cada invitado abre **su** enlace y ve **sus** fotos pasando, con
música y la marca de AK.

## Lo que ya existe (verificado, no lo rehagas)

- **El pase de fotos ya está hecho:**
  `src/app/evento/[id]/video-recuerdo/video-recuerdo-client.tsx`. Fotos que pasan
  cada 4 segundos, con música, silenciador y botón de saltear. Anda bien.
  **Hoy muestra todas las fotos de la fiesta y las ve igual todo el mundo.**
- **El recap de la mañana ya recibe el enlace personal**
  (`src/app/invitacion/[fiestaId]/recap/page.tsx` recibe `guestId` y `token`),
  **pero no filtra nada con ellos**: le muestra a todos las mismas ocho fotos.
- **Ya sabe esperar al día siguiente:** `isRecapAvailable()` en
  `src/lib/recap/recap-engine.ts`.

## Qué hacer

1. **Que el pase de fotos filtre por invitado** cuando viene un enlace personal.
   Sus fotos primero; si sacó pocas, se completa con las más queridas de la
   fiesta, **avisando cuáles son suyas y cuáles de la noche**.
2. **Si no sacó ninguna, no se le muestra una pantalla vacía:** se le muestra el
   recuerdo de la fiesta entera, que igual es lindo.
3. **Que funcione en el celular y de una sola mano.** Es lo primero que mira
   cuando se despierta.

# BLOQUE 3 — Que se pueda bajar y subir a las historias

**Éste es el que convierte el recuerdo en publicidad tuya, y hoy no existe.**

## El problema, verificado

**Lo que hay no es un video: es un pase de fotos que se mira en la pantalla.** No
genera ningún archivo, así que **el invitado no puede bajarlo ni subirlo a sus
historias**. Puede mirarlo y nada más.

## Qué hacer

- **Que se arme un archivo de video de verdad, vertical**, que el invitado pueda
  guardar y subir.
- **Armalo en el celular del invitado, no en el servidor.** Se puede: se dibujan
  las fotos en un lienzo y se graba desde el propio navegador. **No agregues un
  procesador de video al servidor**: con ciento cincuenta invitados por fiesta,
  eso se paga y se cae.
- **Si en el celular no sale bien, no lo fuerces.** Entregá los bloques 1 y 2, y
  decí por qué. Es una respuesta válida y esperada.
- La marca de AK va **discreta en el video**; el enlace al simulador va en el
  texto sugerido para compartir, **no encima de la imagen**.

## Lo que no se negocia

- **Sólo fotos aprobadas.** El `moderationStatus` manda. Una foto sin moderar en
  las historias de un invitado es un problema serio.
- **Publica la persona, no el sistema.** La app arma y ofrece; el invitado decide.
- **Nada de reconocimiento de caras.** Ni para esto ni para nada.

# BLOQUE 4 — Que el invitado pueda volver a su enlace al otro día

**Sin esto, los tres bloques de arriba no le llegan a nadie.**

## El problema, verificado

El enlace personal de cada invitado (`guestAccessToken`) **se le muestra una sola
vez**, como código QR y enlace en la pantalla de confirmación de la invitación
(`src/app/invitacion/[fiestaId]/rsvp/page.tsx`). **La app no se lo manda por
ningún lado**: si no lo guardó, lo perdió.

Al otro día a la mañana, el invitado no tiene cómo volver a su recuerdo.

## Qué hacer

**Que se lo pueda mandar a sí mismo, con un toque**, en el momento en que ya está
usando la app y contento: al bajar su foto de la fotocabina o al terminar de subir
al muro.

> **¿Querés guardarte el enlace de tus fotos?**
> **[Mandármelo por WhatsApp]**

Se abre su propio WhatsApp con el enlace escrito. **Lo manda él, a él.** La app no
manda nada.

## Lo que está prohibido

> **No se le manda nada a nadie.** Ni un mensaje, ni un aviso, ni el enlace.

La app **abre** el mensaje y la persona decide si lo manda. Nada de listas de
invitados, nada de envíos masivos. Eso quema la marca en Salto en una semana.

# BLOQUE 5 — El teléfono inventado en la lista de prospectos

## YA ESTÁ HECHO. No lo toques.

Claude lo hizo el 17 de agosto porque son datos comerciales. Ya está en `main`:
si no deja contacto se guarda **sin teléfono**, y la ficha dice "No dejó
teléfono: no hay a dónde llamarla". El número inventado `099000000` no se escribe
más.

Dos detalles por si te cruzás con eso: el control que exige un celular uruguayo
**sigue puesto para el simulador** (ahí sin teléfono no hay a dónde mandar el
presupuesto), y a dos invitadas que se llaman igual y no dejaron teléfono **no se
las junta en una sola ficha**: se las distingue por de qué fiesta vinieron.

---

## Sobre la plata: por qué esto NO tiene que costar

La versión original hubiera gastado por cada uno de los ciento cincuenta videos.
**Esta no gasta nada**, porque no usa inteligencia artificial: son las fotos que
ya están, ordenadas y armadas en el celular del invitado.

**Si en algún momento agregás algo que sí se paga**, pasá por el contador como
siempre: `hayPresupuestoParaIA()` antes, `registrarConsumoIA()` después, y sumá la
función a `COSTO_ESTIMADO_UYU` en `src/lib/ai/consumo.ts`.

## Lo que NO se toca

- **Plata, cobros, comida y permisos: eso lo escribe Claude.**
- **No le mandes nada a nadie que no lo haya pedido.** El recuerdo vive en el
  enlace personal que el invitado ya tiene. Nada de mensajes masivos.
- **No agregues un procesador de video al servidor.**
- **No hagas otro pase de fotos, otro recap ni otra galería.** Hay uno de cada
  cosa.

## Las tres cosas que trabaron entregas anteriores

1. **Antes de usar una función o un campo, abrí el archivo y confirmá que existe.**
2. **Decí desde qué pantalla se ve cada cosa nueva.** Ya hubo cuatro pantallas
   escritas que no se podían abrir desde ningún lado.
3. **Anotá en `docs/YA-RESUELTO.md` sólo lo que hiciste de verdad**, y actualizá
   `docs/QUE-HAY-EN-LA-APP.md`.

## Los controles antes de entregar

1. `npm run build`
2. `npx tsc --noEmit`
3. `npx jest --silent`
4. `npm run check:acentos`

Sobre el conjunto entero. **Si `npx tsc --noEmit` da un solo error, no subas.**

## Cuando termines

Avisá el número de la propuesta y mové este archivo a `hechas/` en la misma
propuesta.
