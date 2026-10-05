# Orden 117 — El video para cada invitado, y lo que quedó sin hacer de las órdenes 105 y 106

**De:** Claude. **Para:** Gemini. **Fecha:** 5 de octubre de 2026.

**UNA SOLA PROPUESTA con todos los bloques.** Rama nueva desde la principal actualizada
(`git fetch origin main` primero). Si un bloque se traba, entregá el resto igual, en la misma
propuesta, y decí cuál faltó y por qué. Leé `docs/ANTES-DE-ENTREGAR.md` antes de decir "terminé".

**No toques** permisos, cobros, comida ni plata: si algo de eso hace falta, listalo y me lo pasás.
Lo que ya anda y no se toca: el control de entrada de recepción (`checkInGuest`), la galería del
invitado, el tótem de fotos actual, la voz de Gemini con sus dos interruptores.

## Bloque 1 — El video de la quinceañera para cada invitado (aprobado por el dueño)

**Qué es.** Desde su portal, la quinceañera (o los novios) graba un video corto para un invitado o
para un grupo. El invitado lo ve en su pantalla de invitado **recién cuando recepción marcó que
llegó**. Opcional: en la entrada, un tótem donde escanea su QR y se reproduce su video. Es
**opcional por fiesta** y sin IA.

**Dónde vive el dato.** En `src/types/fiesta.ts`, dentro de `FiestaEnPlanificacion`, un campo nuevo:

```ts
videosParaInvitados?: {
  id: string;                 // randomUUID, nunca la hora sola (ver SOCIAL01 en YA-RESUELTO)
  invitadoIds: string[];      // uno o varios: un grupo es la misma grabación para varios
  storagePath: string;        // privado: videos-invitados/{fiestaId}/{id}.webm
  duracionSegundos: number;
  creadoAt: string;
}[];
```

Y en `ClientPortalSettings` (`src/types/fiesta.ts` ~l.739): `videosParaInvitadosActivo?: boolean`.
Se prende desde la ficha de la fiesta, en la misma pantalla donde se arma el portal del cliente.
**Apagado por defecto.**

**Grabar (portal del cliente).** Pantalla nueva `src/app/portal-cliente/[id]/videos-invitados/page.tsx`,
con su tarjeta en `src/app/portal-cliente/[id]/page.tsx` sólo si el interruptor está prendido.

- Lista de invitados (nombre y mesa) con casillas para elegir uno o varios, y un botón "Grabar".
- Graba con `MediaRecorder` de la cámara frontal, **tope 30 segundos** (se corta solo, con cuenta
  regresiva visible), deja verlo antes de guardar y "Grabar de nuevo".
- Muestra quién ya tiene video (una tilde) y deja borrar y regrabar.
- Celular primero: es donde lo va a usar. Usá la skill `celular-primero`.

**Guardar (acción del servidor).** En un archivo nuevo `src/app/actions/videos-invitados.ts`:

- `guardarVideoParaInvitados(fiestaId, invitadoIds, formData)`: **la primera línea es
  `verifyPortalSession(fiestaId)`** (`src/lib/security/portal-session.ts` l.59); si da falso,
  devuelve error. Rechaza: interruptor apagado, archivo de más de 8 MB, tipo distinto de
  `video/webm` o `video/mp4`, `invitadoIds` vacío o con un id que no es de esa fiesta.
- Sube con `uploadToStorage(buffer, storagePath, contentType, false)` — **privado** (último
  argumento `false`) — y después agrega el registro con `actualizarFiesta`
  (`src/lib/fiesta/actualizar-fiesta.ts`), nunca leyendo y guardando la fiesta entera. Si el
  guardado falla, borra el archivo con `deleteFromStorage` y devuelve el error: **la pantalla no
  dice "guardado" si no se guardó**.
- `borrarVideoParaInvitados(fiestaId, videoId)`: misma sesión, saca el registro y el archivo.

**Verlo (pantalla del invitado).** En `getPublicGuestPortalData`
(`src/app/actions/public-guest-portal.ts` l.77), si el interruptor está prendido, hay un video cuyo
`invitadoIds` incluye a ese invitado **y el invitado tiene `checkedIn === true`**, se agrega
`videoPersonal: { url }` con `getSignedUrl(storagePath, 6 horas)` (`src/lib/firebase/storage.ts`
l.128). Si no llegó todavía, **no viaja ni la ruta**. En
`src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx` una tarjeta "Un mensaje para vos"
con el video, arriba de todo, sólo si viene.

**Tótem de bienvenida (opcional).** En `src/app/evento/totem/[fiestaId]/page.tsx`, un modo
"Video de bienvenida" que lee el QR del invitado (el mismo de su invitación, con
`guestAccessToken`) y reproduce su video a pantalla completa; si no tiene, muestra "¡Bienvenido,
{nombre}!" y vuelve solo a esperar a los 8 segundos. **El tótem no marca la llegada**: eso sigue
siendo de recepción. El video se pide con una acción que valida `hasPublicGuestAccess`
(`src/lib/guest-portal-public-data.ts` l.90).

**La prueba que mira el resultado** (`src/__tests__/el-video-para-cada-invitado.test.ts`):
- sin sesión del portal, `guardarVideoParaInvitados` no guarda nada;
- con un archivo de 9 MB o un invitado de otra fiesta, no guarda;
- **antes del check-in `getPublicGuestPortalData` no trae `videoPersonal`, después sí**, y a otro
  invitado del mismo grupo también, y a uno que no está en el grupo no;
- con el interruptor apagado no viaja aunque haya video;
- si `actualizarFiesta` falla, se llama a `deleteFromStorage` y devuelve `success: false`.
Probala rompiéndola: sacando la condición de `checkedIn`, la tercera tiene que dar rojo.

## Bloque 2 — "Llamarla": conversación en vivo con voz (orden 105, bloque 3)

Está pedido en `docs/ordenes/105-hablarle-a-la-app-por-whatsapp-y-con-voz.md` l.113 y **no se
hizo**: en `src/components/multiagent/multiagent-widget.tsx` no hay modo de conversación. Seguí lo
escrito ahí. Un botón "Hablar" (estado `modoConversacion` en el widget) que deja el micrófono abierto (`SpeechRecognition`, que ya está en
la l.~338) y contesta en voz con `reproducirVozReal` (`src/lib/asistente/reproductor-voz.ts`), sin
tocar los topes ni los interruptores de la voz. Prueba: con la IA y el micrófono simulados, dos
vueltas de pregunta y respuesta sin tocar nada en pantalla.

## Bloque 3 — Objetivos de varios pasos (orden 105, bloque 7)

Pedido en la orden 105 l.148 y **no se hizo**. Seguí lo escrito ahí: "Dejá lista la fiesta de
Ana", la pantalla "Qué puede hacer solo" en Ajustes, y el presupuesto al prospecto de anuncio con
`generateBudgetAndLeadFromSimulator` (`src/app/actions/armado-rapido.ts`). **Lo que toca plata
queda en `pregunta` y no se puede pasar a `solo`**: esa regla la reviso yo.

## Bloque 4 — Hablarle a la IA en la reunión (orden 106, bloque 2)

Pedido en `docs/ordenes/106-la-reunion-de-venta-que-impresiona.md` l.49 y **no se hizo**: en
`src/app/(app)/empresa/configurador-reunion/page.tsx` el ícono `Mic` está importado y no se usa.
Seguí lo escrito ahí: sólo toca el borrador, **no llama a `savePresupuesto`**, no inventa servicios.

## Bloque 5 — La pantalla gigante muestra TODAS las fotos (orden 106, bloque 5)

Pedido en la orden 106 l.113 y **no se hizo**. Sumá a `tests/e2e/la-pantalla-gigante-anda.spec.ts`
las 20 fotos contadas en la rotación y la rechazada que no aparece. Si la prueba encuentra que
faltan fotos, arreglá `src/app/evento/muro-en-vivo/[fiestaId]/page.tsx`.

## Bloque 6 — Dos ajustes de las estaciones que nadie lee

En `src/lib/entertainment/station-config.ts`, `overlayName` (l.22) y `deliveryChannels` (l.36) se
guardan y **ninguna estación los lee** (regla 3 de `CLAUDE.md`: un control que no cambia nada es
peor que no tenerlo). Engancharlos: `overlayName` se muestra en el marco impreso de la fotocabina y
la 360; `deliveryChannels` decide qué botones de "llevate tu foto" aparecen (QR, WhatsApp, mail).
Si alguno no tiene sentido enganchar, sacá la casilla de
`src/app/(app)/fiestas/nueva/entretenimiento/page.tsx` y decímelo. Ampliá
`src/__tests__/los-ajustes-de-la-estacion-llegan.test.ts` con los dos.

```comprobar
archivo: src/app/actions/videos-invitados.ts
usa: verifyPortalSession en src/app/actions/videos-invitados.ts
usa: videoPersonal en src/app/actions/public-guest-portal.ts
usa: videoPersonal en src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx
usa: guardarVideoParaInvitados en src/app/portal-cliente/[id]/videos-invitados/page.tsx
usa: videosParaInvitadosActivo en src/types/fiesta.ts
prueba: src/__tests__/el-video-para-cada-invitado.test.ts
# Bloque 2
usa: modoConversacion en src/components/multiagent/multiagent-widget.tsx
# Bloque 3
usa: generateBudgetAndLeadFromSimulator en src/lib/asistente/por-whatsapp.ts
# Bloque 4
usa: SpeechRecognition en src/app/(app)/empresa/configurador-reunion/page.tsx
# Bloque 5
prueba: tests/e2e/la-pantalla-gigante-anda.spec.ts
# Bloque 6
usa: deliveryChannels en src/app/evento/fotocabina/[fiestaId]/page.tsx
usa: overlayName en src/app/evento/fotocabina/[fiestaId]/page.tsx
```
