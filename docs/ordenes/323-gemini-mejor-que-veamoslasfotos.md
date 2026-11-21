# Orden 323 — Mejor que VeamosLasFotos: invitación, pantalla y lo nuevo con interruptor (19/11/2026)

**Pedido del dueño:** *"compará todas las funcionalidades de ellos con las nuestras, no sólo la invitación, la pantalla, todo… debe
ser mejor que lo que ellos hacen"*. Lo que más le gustó de ellos: **la estética y la forma de armar la invitación digital**.

**Cómo se entrega:** en la **misma propuesta que la orden 322**, sobre `claude/juntar-1443`, después de terminar la 322. Si un
bloque se traba, se entrega el resto igual y se avisa cuál faltó. Antes de decir "terminé": `docs/ANTES-DE-ENTREGAR.md`.

**Regla de esta orden:** todo lo **nuevo** va con su interruptor en la zona digital de la fiesta
(`ZonaDigitalFeatureId` en `src/types/fiesta.ts` ~línea 1394 y `defaultZonaDigitalFeatures` en
`src/lib/zona-digital-adolescentes.ts` ~línea 28), **apagado de entrada**, y la pantalla del invitado no lo muestra si está
apagado. Sin servicios que cobren por mes (si algo lo necesitaría, se deja preparado y se avisa).

## Comparación (investigada por Claude el 19/11)

| De ellos | En AK hoy | Qué se hace |
|---|---|---|
| Invitación con plantillas, fondos, colores y videos editables (~300 fondos de foto y ~300 de video) | 41 diseños, color e imagen de fondo; fondo de video sólo en una sección; **dos sistemas de invitación** y el editor avanzado trabaja sobre una boda de ejemplo | Bloques 1 y 2 |
| Invitación que "sigue viva" en la fiesta | El día de la fiesta la cuenta regresiva dice "¡Es hoy!" y nada más | Bloque 3 |
| Fotos en pantalla con transiciones personalizadas | Mosaico, carrusel, modo cine y Ken Burns; no se elige transición | Bloque 4 |
| Moderación: aprobar, borrar, avisar y bloquear al que sube algo feo; moderadores aparte | `/evento/moderacion` aprueba u oculta; **no borra ni bloquea** | Bloque 5 |
| Trivia con IA y ranking | `generarTriviaConIa` existe (`src/app/actions/games.actions.ts:245`) y **ninguna pantalla la llama**; tampoco hay pantalla del equipo para armar la trivia (`saveTriviaGame` sin quien la use) | Bloque 6 |
| Likes y álbum de las más votadas | Hay likes (`allowLikes`) y ranking en pantalla; el álbum no junta las más queridas | Bloque 7 |
| Marco con la marca del evento | `photoFrame` (`src/types/fiesta.ts` ~877) existe y **ninguna pantalla lo usa** | Bloque 7 |
| Transmisión en vivo desde el celular del invitado | No existe | Bloque 8 (nuevo, con interruptor) |
| Sin libro de firmas de audio (lo dicen ellos) | No existe | Bloque 9 (nuevo, con interruptor): acá les ganamos |
| Kiosco de impresión con pedidos por QR | Estación `/evento/impresion` con tope por persona; el invitado no pide desde su celular | Bloque 10 (nuevo, con interruptor) |
| Estadísticas del evento (visitas, activos ahora) | No para el operador en la noche | Bloque 11 |
| White label, revendedores, "Evento Crush" (citas), QR genérico | — | **No se hacen** (no es el negocio de AK; el QR genérico va contra la regla de que un enlace público nombra su fiesta) |

**Ya tenemos y ellos no (no tocar):** fotocabina, 360, espejo, Vogue, tótem, cabina con IA, barra interactiva, puerta con QR,
asistente del invitado, video resumen, búsqueda por cara, mi mesa. **No se tocan** la cuenta regresiva, el RSVP ni el mapa: andan.

## Bloque 1 — Un solo armador de invitación, en tres pasos, con el celular al lado

- Hoy hay dos sistemas (`docs/QUE-HAY-EN-LA-APP.md` ~línea 107): el editor avanzado (`AdvancedInvitationCanvas` en
  `src/components/invitacion/edit/`, usado por `src/app/(app)/fiestas/nueva/pagina-web/page.tsx`) trabaja con "María y
  Juan" de ejemplo, y lo que abre el invitado (`src/app/invitacion/[fiestaId]/invitacion-publica-client.tsx`, estilos en
  `getTemplateStyles` ~línea 988) sale de la configuración real de la fiesta. **El armador edita la configuración real**
  (la que lee la pública), nunca la de ejemplo.
- **Tres pasos:** (1) elegir diseño con `TemplatePickerGallery` filtrado por tipo de fiesta; (2) datos, que vienen
  **solos** de la fiesta (nombre, fecha, salón, hora), y el cliente sólo agrega lo que falta; (3) estilo: fondo, colores y
  letra.
- **Vista de celular al lado**, que se actualiza mientras se escribe, con la invitación real (mismo componente que la
  pública, no una copia).
- Botón "Ver como invitado" que abre la invitación pública de esa fiesta.

## Bloque 2 — Biblioteca de fondos para la invitación

- Hoy hay biblioteca de fondos sólo para el muro (`src/lib/social-fiesta/fondos-muro.ts`). Hacer la de la invitación:
  **al menos 40 fondos** por tipo de fiesta (15, boda, cumpleaños, empresa), mitad quietos y mitad **en movimiento**.
- Sin servicios pagos ni fotos bajadas: degradados y texturas animadas hechas con CSS o canvas, partículas
  (`EventParticles.tsx` ya existe) y las fotos propias de AK que ya están en `public/`. Cada fondo con su paleta de colores
  sugerida, que se aplica de un toque.
- El fondo en movimiento respeta "reducir movimiento" del teléfono y no traba un celular viejo (ver la habilidad
  `que-cargue-rapido`).

## Bloque 3 — La invitación sigue viva el día de la fiesta

- En `invitacion-publica-client.tsx` (~línea 170), el día del evento, en vez de sólo "¡Es hoy!", la invitación muestra los
  accesos de la noche: **subir fotos** (`/evento/social/[fiestaId]`), **buscar mi mesa** (`/evento/mi-mesa/[fiestaId]`) y,
  cuando exista, el menú digital (orden 321, bloque 7). Después de la fiesta, el álbum y el recap (ya existe `recap/`).
- Cada acceso respeta su interruptor: si la fiesta no tiene muro, no aparece "subir fotos".

## Bloque 4 — Elegir la transición de la pantalla gigante

- En `src/app/evento/muro-en-vivo/[fiestaId]/page.tsx` hoy hay `animate-fade-in` fijo (~línea 633). Campo nuevo
  `transicion` en `socialGallerySettings` (`src/types/fiesta.ts` ~línea 838): fundido, deslizar, zoom, polaroid y
  "al ritmo" (cambia con la música del modo audiorrítmico). Se elige en el panel del muro
  (`src/app/(app)/fiestas/nueva/muro-social/page.tsx`) y **el operador la ve cambiar** sin recargar.
- Con las curvas y tiempos de la habilidad `animaciones-pro`.

## Bloque 5 — Moderación completa, también desde el celular de un familiar

- En `src/app/evento/moderacion/[fiestaId]/page.tsx`: botón **Borrar** (usa `deleteSocialPost`,
  `src/app/actions/social-gallery.ts` ~línea 783, hoy sin quien lo llame) y botón **Bloquear a este invitado**: lo que suba
  después ya no entra y le aparece un aviso amable de que su contenido fue reportado.
- **Enlace de moderador** para un familiar, que vence al terminar la fiesta y **sólo** deja aprobar, ocultar, borrar y
  bloquear en esa fiesta. **Esto es permisos: lo revisa Claude línea por línea.** No le da acceso al panel del equipo ni a
  datos de otros invitados (nombres sí, teléfonos no). Lo frena hoy `canModerateSocialEvent` (~línea 81): el enlace se
  valida aparte, con su propia prueba de "alguien sin enlace no entra".

## Bloque 6 — La trivia se arma sola con la IA, y el equipo la maneja

- Pantalla del equipo para la trivia de la fiesta (en el centro de la fiesta): botón **"Armar con IA"** que llama a
  `generarTriviaConIa` con los datos de la fiesta (agasajados, tipo de fiesta), muestra las preguntas para **revisar y
  corregir** antes de usarlas (`confirmadaPorEquipo`, `src/lib/games/game-engine.ts` ~línea 23), y botones de empezar,
  revelar respuesta y terminar (ya están `responderTrivia`, `revelarRespuestaTrivia`, `terminarTrivia`).
- La pantalla gigante muestra la pregunta y después el **ranking** (`topTrivia`, `src/lib/games/juegos-en-vivo.ts:52`).
- Si la IA no está disponible o se pasó el tope del día, se usan las preguntas de siempre (`DEFAULT_TRIVIA_QUESTIONS`) y
  se avisa en pantalla.

## Bloque 7 — Las más queridas y el marco del evento

- Álbum (`src/lib/album/armar-album.ts`): sección **"Las más queridas de la noche"** con las 20 fotos con más likes.
- `photoFrame`: el marco con la marca del evento se aplica en la pantalla gigante y en lo que se imprime en
  `/evento/impresion` (ya existe `marcoEnImpresion`, ~línea 924). Si no hay marco cargado, no se dibuja nada.

## Bloque 8 — NUEVO con interruptor: "En vivo desde tu celular"

- Interruptor `transmision_invitado` en la zona digital. Con él prendido, en `/evento/social/[fiestaId]` aparece
  **"Salir en la pantalla"**: el invitado pide salir, el operador lo ve en `/evento/control-pantalla/[fiestaId]` y
  **acepta o rechaza**. Aceptado, su cámara sale en la pantalla gigante, con su nombre, hasta 60 segundos, y el operador lo
  corta cuando quiere.
- Conexión directa entre celular y pantalla por la red del salón (WebRTC con el servidor STUN gratis de Google; la
  coordinación por la base que ya usa la app). **Sin servidor de video pago.** Si no conecta en 10 segundos, plan B: el
  invitado graba un clip de 15 segundos y entra por la moderación como un video común.
- Nunca sale nada en pantalla sin que el operador lo acepte.

## Bloque 9 — NUEVO con interruptor: libro de firmas en audio y video (ellos no lo tienen)

- Interruptor `libro_de_firmas`. En `/evento/social/[fiestaId]`: **"Dejale un mensaje"**: hasta 30 segundos de audio o de
  video. Va **sólo** al cliente (portal y álbum final), **nunca** a la pantalla pública ni al muro.
- En el álbum: sección "Mensajes para vos", que se reproduce en orden.

## Bloque 10 — NUEVO con interruptor: "Imprimí tu foto" desde el celular

- Interruptor `impresion_desde_celular`. En la foto aprobada del invitado aparece **"Imprimir"**: entra a una cola, el
  invitado ve **su número**, y la estación `/evento/impresion/[fiestaId]` la muestra en orden y canta el número cuando está.
- Respeta `maxImpresionesPorPersona` y `limite-de-impresion.ts`. **Si ya existe el pedido desde el celular, no se rehace:
  se nombra en la propuesta.**

## Bloque 11 — Estadísticas en vivo para el operador

- En `/evento/control-pantalla/[fiestaId]`: cuántos invitados entraron, **cuántos hay ahora**, fotos subidas y aprobadas,
  votos, y la mesa más activa. Datos reales; si no hay, "Sin datos todavía", nunca un número inventado.

## Qué NO tocar

- Lo de plata, cobros y permisos del equipo. El bloque 5 crea un permiso nuevo y limitado: lo revisa Claude.
- La puerta, el RSVP, la cuenta regresiva y el mapa de la invitación.
- Los textos de venta, el reloj del simulador y las promociones.

## Qué tiene que comprobar la prueba

- **Bloque 1:** prueba de navegador que cambia el nombre en el armador y ve el nombre nuevo **en la invitación pública** de
  esa fiesta (no en la de ejemplo).
- **Bloque 2:** cambiar el fondo en el armador cambia el fondo de la pública; cuenta que haya ≥ 40 fondos.
- **Bloque 3:** con la fecha de hoy, la invitación muestra "Subir fotos"; con el muro apagado, no.
- **Bloque 4:** cambiar la transición en el panel cambia la clase de animación en el muro.
- **Bloque 5:** borrar saca la foto del muro; un invitado bloqueado no puede subir; **sin enlace válido la moderación no
  abre** (Jest + navegador).
- **Bloque 6:** "Armar con IA" (con la IA simulada) llena preguntas y no se usan hasta confirmarlas.
- **Bloques 8 a 10:** con el interruptor apagado el botón **no aparece**; prendido, aparece. Lo de la cámara se prueba con la
  cámara falsa de Chromium (`--use-fake-device-for-media-stream`).
- **Bloque 11:** con dos invitados de prueba, el contador dice 2.

```comprobar
usa: generarTriviaConIa en src/app/(app)/fiestas/[id]/centro/page.tsx
usa: deleteSocialPost en src/app/evento/moderacion/[fiestaId]/page.tsx
usa: transicion en src/app/evento/muro-en-vivo/[fiestaId]/page.tsx
usa: photoFrame en src/app/evento/muro-en-vivo/[fiestaId]/page.tsx
usa: transmision_invitado en src/lib/zona-digital-adolescentes.ts
usa: libro_de_firmas en src/lib/zona-digital-adolescentes.ts
usa: impresion_desde_celular en src/lib/zona-digital-adolescentes.ts
usa: /evento/social/ en src/app/invitacion/[fiestaId]/invitacion-publica-client.tsx
usa: fondos-invitacion en src/app/invitacion/[fiestaId]/invitacion-publica-client.tsx
archivo: src/lib/social-fiesta/fondos-muro.ts
usa: generarTriviaConIa en src/app/(app)/fiestas/[id]/centro/page.tsx
usa: topTrivia en src/lib/games/juegos-en-vivo.ts
usa: likes en src/lib/album/armar-album.ts
usa: photoFrame en src/app/evento/muro-en-vivo/[fiestaId]/page.tsx
archivo: src/lib/games/game-engine.ts
```
