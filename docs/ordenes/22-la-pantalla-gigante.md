# Orden 22 — La pantalla gigante, igual o mejor que las del rubro

**Para Gemini. Escrita el 31 de agosto de 2026.**

> **Pedido del dueño:** *"lo que hiciste con el entretenimiento, hacé con la pantalla gigante"*,
> y recordó que había pasado un ejemplo del estilo de Instagram.

## Lo primero, y que quede escrito: NUESTRA PANTALLA YA ES MEJOR QUE LA MAYORÍA

Se investigaron las plataformas del rubro en agosto de 2026 y **se midió la nuestra, función por
función, con archivo y línea**. El resultado sorprende para bien.

**Las de fiesta con QR** —Kululu, GuestCam, GuestPix, Wedibox, Camdeed— hacen **una sola cosa**:
el invitado escanea, sube del navegador sin instalar nada, y la foto aparece en la pantalla.
**Nosotros hacemos eso y catorce cosas más.**

Lo que la nuestra ya tiene, verificado en `src/app/evento/muro-en-vivo/[fiestaId]/page.tsx`:

fotos en vivo con moderación previa (línea 46), encuestas con barras de resultado (768),
sorteo con rueda que gira y confeti (896-1075), chat de invitados (732), pedidos de canciones
al DJ (745), seis tipos de juego con podio por mesa (1761-1867), ranking de la foto más querida
(1557), momentos a pantalla completa con el nombre del homenajeado (870-892), cartel LED
publicitario configurable y segunda línea de promoción (819-864), logo de la empresa y las
cuatro redes (467, 798), visualizador que se mueve con la música en cuatro estilos (1148-1342),
pantalla de "todavía no hay fotos" con el QR grande (1110-1145), aviso de reconexión si se
corta internet (1105), y los textos escalan con el tamaño de la pantalla (1871-1890).

**No la rehagas. No la "mejores" porque te parece. Lo que sigue es lo único que falta.**

## CÓMO SE ENTREGA

**UNA SOLA PROPUESTA.** `npm run "publicar?"` en verde y anotado en `docs/YA-RESUELTO.md`.

---

## BLOQUE 1 — LAS DEDICATORIAS ESTÁN APAGADAS Y NADIE LO SABE  ← ARRANCÁ POR ESTE

**Verificado**, `src/app/evento/muro-en-vivo/[fiestaId]/page.tsx:628`:

    {false && isLoaded && settings.privateDedicationsMode !== true && ...

**Ese `false` apaga las dedicatorias a mano.** El invitado las puede escribir
(`addDedication()` en `/evento/social/[fiestaId]`), se guardan, **y no las ve nadie en la
fiesta**. Es exactamente lo que el proyecto prohíbe: algo que se puede cargar y no lo lee nadie.

**Hay una nota al lado que dice que los recuerdos van en otro módulo, así que puede haber sido a
propósito. NO LO DECIDAS VOS.**

**Qué hacer:** dejarlo **detrás del ajuste que ya existe** (`privateDedicationsMode`) en vez del
`false` clavado. Así el equipo decide por fiesta si salen o no, y **si el dueño dice que no
salen, se sacan también de donde el invitado las escribe** —porque prometerle algo que no pasa
es peor—. **Preguntá antes de encenderlas.**

---

## BLOQUE 2 — "QUÉ VIENE AHORA": lo único que tienen todas y nosotros no

Es lo que hacen EventMobi, Webex y Whova, y en una fiesta sirve más que en un congreso: la
pantalla dice **qué está por pasar**.

Nosotros tenemos los momentos (la entrada, la torta, el vals) y los mostramos **cuando ya
pasaron**. **Falta anunciarlos antes.**

- Una tarjeta más en la rotación: **"Ahora: baile. Después: la torta"**.
- **Cuenta regresiva** al próximo momento cuando falten menos de 10 minutos.
- Sale del cronograma que la fiesta ya tiene. **Si la fiesta no tiene cronograma cargado, la
  tarjeta no aparece** (nunca un hueco vacío).

**La prueba:** con dos momentos cargados, la pantalla dice el próximo; sin cronograma, no
aparece la tarjeta.

---

## BLOQUE 3 — Los aplausos, que hoy no existen

Tenemos corazones (`likes`). **Las plataformas de evento tienen reacciones en vivo**: el
invitado toca desde el celular y **la reacción cruza la pantalla grande** en el momento.

- Tres botones en el celular: aplausos, corazón y fuego.
- En la pantalla gigante, **suben flotando por encima de lo que se esté mostrando** y
  desaparecen. No tapan nada ni cortan la rotación.
- Es de lo que más engancha en una fiesta y es barato de hacer: **son los mismos avisos que ya
  usa el chat**.

---

## BLOQUE 4 — Moderación que ayuda sola

Walls.io y Taggbox **filtran solos** insultos, spam y fotos repetidas antes de que alguien las
mire. Nosotros moderamos **todo a mano** (`isPostApprovedForScreen`, línea 46).

**Qué hacer, y sin pagar nada por mes:**

- **Marcar las repetidas**: si llegan dos fotos casi iguales seguidas del mismo invitado, la
  segunda se marca "posible repetida" para que el moderador la vea primero.
- **Una lista de palabras** que dejan el mensaje esperando aprobación en vez de publicarlo.
- **NUNCA borrar solo.** La app marca y ordena; **la mano que aprueba sigue siendo humana.**

**No contrates un servicio de inteligencia artificial en la nube para esto.**

---

## BLOQUE 5 — La pantalla del salón y de los patrocinadores

Ya tenemos el cartel LED y el logo de la empresa. **Falta la tarjeta entera**, que es lo que
EventMobi vende como "pantalla de patrocinadores": una tarjeta más en la rotación con el logo
grande del salón o de un auspiciante y una frase.

Sale de lo que ya se carga de la empresa. **Si no hay nada cargado, no aparece.**

---

## BLOQUE 6 — INSTAWALL, que es la competencia DIRECTA  ← IMPORTANTE

**El dueño pasó el ejemplo: `instawall.fun`.** Se miró. **Es la más parecida a lo nuestro de
todas las trece**: está en castellano y apunta a **bodas, cumpleaños y quince años**, o sea que
compite con AK en el mismo mercado.

### Lo que ellos tienen y nosotros NO (verificado en nuestro código)

**6.a — El fondo de la pantalla se elige.** Ellos traen **más de 100 fondos listos** y además
dejan subir el propio. **El nuestro es fijo**: una grilla puesta a mano
(`src/app/evento/muro-en-vivo/[fiestaId]/page.tsx:1236`), igual en toda fiesta.

Qué hacer: que el muro use **el fondo que el cliente cargó para su fiesta** —el mismo campo que
ya existe para fondos— y si no cargó ninguno, que se pueda elegir entre **seis u ocho listos**
que combinen con el color de la fiesta. **No hagas cien.** Con que combinen alcanza.

**6.b — La pantalla de espera se personaliza.** Ellos dejan subir una **imagen de portada** que
se ve mientras no llegó ninguna foto. La nuestra es fija: fondo oscuro con el QR
(`EmptyWallState`, línea 1114).

Qué hacer: que use la foto de portada de la fiesta si hay, con el QR encima. **El QR se queda
siempre**, que es lo que hace que la gente suba.

**6.c — El afiche del QR para imprimir, con la marca del cliente.** Ellos generan **un afiche
con el logo y los colores del cliente**, listo para imprimir y poner en las mesas. **Nosotros no
tenemos nada de eso**: el QR sólo se ve en la pantalla.

Qué hacer: una pantalla que arme el afiche —QR grande, nombre de la fiesta, "escaneá y subí tus
fotos", el color de la fiesta y el logo si hay— **y que se baje listo para imprimir**. Es de lo
más útil de toda esta orden: sin afiche en las mesas, la gente no sabe que puede subir.

**6.d — El álbum del final, con las fotos Y los mensajes.** Ellos, al terminar, le mandan a los
invitados un álbum con todo lo que se compartió, **fotos y mensajes juntos**. Nosotros tenemos
el álbum (`/evento/album/[fiestaId]`) pero **con las fotos solas**.

Qué hacer: que el álbum muestre también las dedicatorias y los mensajes del buzón. **No lo
mandes solo por mensaje a nadie**: se prepara y lo manda una persona, que es la regla de la
casa.

### Lo que ellos tienen y NO se copia

**La moderación automática que descarta sola.** Ellos filtran con inteligencia artificial unos
minutos antes de mostrar y **descartan solos** lo inapropiado. Nosotros marcamos y ordenamos
(bloque 4), **pero la mano que aprueba sigue siendo humana**. En una fiesta de quince, que una
máquina decida sola qué foto de una nena se muestra es un riesgo que no vale la pena.

### Y lo que nosotros tenemos y ELLOS no

Que quede escrito, porque es con lo que se vende:

Ellos tienen un **buzón de mensajes y audios**. **El nuestro tiene audio, video, foto, subir
desde la galería y hasta una cabina telefónica retro** —cinco formas contra dos—. Y ellos no
tienen nada de: encuestas en vivo, sorteo con rueda, chat, pedidos al DJ, seis juegos con podio
por mesa, ranking de la foto más querida, momentos a pantalla completa, cartel LED de
publicidad ni visualizador que se mueve con la música.

**La pantalla de ellos muestra fotos lindas. La nuestra maneja la fiesta.**


---

## LO QUE NO SE COPIA, y es decisión tomada

- **Traer lo que la gente publica en Instagram, Facebook o TikTok con un hashtag** (es lo que
  hacen Walls.io y Taggbox). **No se hace**: es un servicio que se paga por mes y además trae a
  la pantalla de la fiesta cosas que nadie miró antes.
- **Cobrar por la foto.**
- **Pedirle mail o teléfono al invitado.**

## LO QUE NO SE TOCA

- **Las quince cosas que ya andan**, listadas arriba. **Ninguna.**
- **El cartel LED y los textos de promoción**: son decisión comercial del dueño.
- **Plata, cobros, comida y permisos**: los hace Claude.
- **Lo que se ve feo pero anda**: se anota, no se toca.

## Y la prueba que hay que dejar

Por cada cosa que agregues, **una prueba que abra la pantalla gigante y compruebe que se ve**,
no que el dato exista. La pantalla se prueba como `/evento/muro-en-vivo/[fiestaId]`.
