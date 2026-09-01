# Orden 28 — El álbum del recuerdo: lindo, con música, y que se lo lleve la gente

**Para Gemini. Escrita el 1 de septiembre de 2026.**

> **Pedido del dueño, textual:** *"ya que se va a obtener un montón de fotos, videos, audios,
> estaría bueno poder hacer tipo un álbum interactivo, con música, donde la gente tenga todo su
> contenido, tipo como el álbum que se imprime. Lindo, pero digital. No con todas las fotos, no
> con todos los audios, sino con algunos, que se pueda editar. Quizá automático, pero que la
> gente lo tenga."*

## Lo primero: LA MITAD YA ESTÁ HECHA. NO EMPIECES DE CERO.

**Verificado, archivo por archivo:**

- **`src/app/evento/[id]/video-recuerdo/video-recuerdo-client.tsx` (362 líneas)** ya hace: pase
  de fotos automático, **música con botón de silencio**, generación de un video vertical con
  acercamiento lento, y enlace para compartir.
- **`src/app/evento/album/[fiestaId]/page.tsx` (516 líneas)** junta las fotos de **todas** las
  estaciones y las de los invitados, con solapas, y deja compartir.
- **Descargar todo junto** ya existe:
  `src/app/api/fiestas/[fiestaId]/download-recuerdos/route.ts`.
- **Elegir qué entra** ya existe: sólo se muestran las aprobadas (`esAprobadoParaMostrar`).
- **`/post-fiesta/[fiestaId]`** ya le manda algo al cliente después de la fiesta.

**El trabajo es completarlo, no rehacerlo.**

## CÓMO SE ENTREGA

**UNA SOLA PROPUESTA.** `npm run "publicar?"` en verde y anotado en `docs/YA-RESUELTO.md`.

---

## BLOQUE 1 — LOS AUDIOS NO ESTÁN EN EL ÁLBUM, Y SON LO MÁS EMOCIONANTE

**Verificado:** los mensajes del buzón —audio, video y la cabina telefónica retro— **existen y
se guardan**, pero **el álbum no los muestra**. Sólo aparecen en la pantalla de post-fiesta.

Es justo lo que más emociona al otro día: **la voz de la abuela deseándole feliz cumpleaños.**

**Que el álbum los incluya**, como una tarjeta más entre las fotos: quién lo dejó, cuánto dura,
y se toca para escuchar. Los videos igual.

---

## BLOQUE 2 — LO ELIGE LA APP Y LO AJUSTA EL EQUIPO. EL CLIENTE NO ELIGE NADA.

**Corrección del dueño, 1 de septiembre de 2026, textual: *"no, el cliente no elige nada"*.**

Antes esta orden pedía que el cliente marcara qué fotos entraban al álbum. **Se saca.** El
cliente **recibe** el álbum terminado; no se le da trabajo ni se lo hace decidir entre 400
fotos.

**Cómo queda:**

- **La app arma la selección sola** (bloque 3). Ésa es la versión que se entrega.
- **El equipo de AK puede ajustarla** desde la pantalla de la fiesta: sacar una foto que no
  quedó bien, cambiar el orden. **Con lo que la app eligió ya alcanza**; el ajuste es la
  excepción, no el paso obligatorio.
- **Lo que el equipo ocultó por moderación no entra nunca**, ni siquiera para el ajuste.

**No hagas ninguna pantalla de selección para el cliente**, ni de aprobación, ni de "elegí tus
favoritas". No va.

## BLOQUE 3 — Que se arme SOLO, y bien

*"Quizá automático."* Es lo que hace la diferencia entre un álbum que existe y uno que la gente
mira.

**Que la app arme una primera versión sola**, sin que nadie toque nada, eligiendo:

- **Las mejores fotos**: las más queridas (los corazones del muro ya se cuentan), una de cada
  estación, y repartidas a lo largo de la noche —no veinte de la misma hora—.
- **Los momentos**: si la fiesta tiene cronograma, que respete el orden real —la llegada, la
  cena, el vals, la torta, la pista—.
- **Dos o tres audios**, no todos.
- **Un largo que se aguante**: entre 30 y 60 recuerdos. **Un álbum de 400 fotos no lo mira
  nadie.**

---

## BLOQUE 4 — Que se vea como un álbum, no como una grilla

*"Tipo el álbum que se imprime. Lindo."*

- **Se pasan páginas**, con dos recuerdos por página como un álbum de verdad.
- **La portada lleva el nombre y la fecha de la fiesta**, con la foto elegida y la paleta de
  colores de la fiesta —la misma de la invitación y la decoración—.
- **La música sigue sonando** mientras se pasan las páginas (ya existe el reproductor).
- **Anda en el celular**, que es donde lo van a mirar y donde lo van a mostrar.
- **Aplican las reglas de estética del bloque 7 de la orden 22**: movimiento lento, fotos
  verticales sin recortar, nada pegado al borde.

---

## BLOQUE 5 — Que se lo lleven de verdad

- **Un enlace propio** que el cliente pueda mandar a quien quiera, **sin que nadie instale nada
  ni se registre**.
- **Descargar todo** (ya existe) desde el mismo lugar.
- **Se prepara el mensaje para mandárselo al cliente**, y **lo manda una persona**. La regla de
  la casa: *preparar sí, mandar no.*

---

## LO QUE NO SE TOCA

- **El video recuerdo que ya anda**: se le agrega, no se rehace.
- **Las fotos del muro se bajan con el enlace directo, a propósito.** Decisión del dueño: no le
  pongas trabas.
- **No se le pide mail ni teléfono al invitado** para ver el álbum.
- **Nada que se pague por mes** sin preguntar.
- **Plata, cobros, comida y permisos: los hace Claude.**

## Y la prueba que hay que dejar

Una prueba que **abra el álbum de la fiesta de prueba y compruebe en pantalla**: que se ve la
portada con el nombre de la fiesta, que hay más de una página para pasar, que aparece al menos
un audio, y que **no entra nada que esté oculto por moderación**. Que los datos existan no
alcanza.

---

## CÓMO SE COMPRUEBA QUE ESTA ORDEN ESTÁ HECHA

**No alcanza con decir que está terminada.** Esto lo verifica `npm run ordenes?` solo, y
mientras falte algo, la orden figura como **a medias** aunque alguien diga lo contrario.

```comprobar
archivo: src/lib/album/armar-album.ts
usa: audioUrl en src/app/evento/album/[fiestaId]/page.tsx
usa: paginaActual en src/app/evento/album/[fiestaId]/page.tsx
prueba: tests/e2e/el-album-del-recuerdo.spec.ts
```

Qué significa cada línea, en criollo:

- **El armador del álbum existe**: el que elige solo los 40 recuerdos.
- **Los audios entran al álbum**: la voz de la abuela, que hoy sólo se ve en post-fiesta.
- **Se pasan páginas**: no una grilla de fotos.
- **Y hay una prueba de navegador que lo abre y lo mira.**
