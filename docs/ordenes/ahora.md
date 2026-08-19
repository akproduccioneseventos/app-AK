# El tótem de la barra: que el invitado se lleve su foto

**Para:** Gemini (Antigravity)
**Escrita:** 19 de agosto de 2026.

## Cómo se entrega

**UNA SOLA propuesta de cambios con los tres bloques adentro.** Cada fusión dispara
un despliegue y eso se paga. Si un bloque se traba, entregá el resto igual, en la
misma propuesta, avisando cuál faltó y por qué.

**Arrancá desde la versión principal de ahora.** Las últimas entregas llegaron
hechas sobre una base vieja, y una traía adentro la anterior entera: habría borrado
tres correcciones sin que se notara.

Antes de tocar nada, leé `docs/YA-RESUELTO.md` y `docs/QUE-HAY-EN-LA-APP.md`.

## Lo que YA ESTÁ HECHO — no lo rehagas ni lo toques

El tótem de la barra (`src/app/evento/barra/[fiestaId]/page.tsx`) es la pantalla
táctil del salón: se pide el trago, y te sacás una foto o un video con él. **Es
como la fotocabina pero SIN impresión**: lo que se saca va a la pantalla gigante y
queda guardado, nunca se imprime. Es a propósito del dueño.

Ya funciona y no se toca:

- Pedir el trago desde el tótem.
- La carta en carrusel de la pantalla grande.
- La cuenta regresiva de tres para la foto.
- **El video, que dura 8 segundos** (se bajó de 15: es un saludo con el trago en la
  mano, no un video). La constante es `DURACION_VIDEO_SEGUNDOS`, no la cambies.
- Las plantillas de marco y el envío a la pantalla gigante.
- **La carta de tragos del celular del invitado ya es un carrusel**
  (`MiniQuiosco.tsx`): tarjetas grandes con la foto de protagonista, que se pasan de
  costado con el dedo. Ya está hecho, no lo rehagas.

---

# BLOQUE 1 — Que el invitado se lleve su foto (el más importante)

Hoy el invitado sube la foto, sale un cartel que dice "se envió a la pantalla
gigante", y la pantalla vuelve al inicio. **La persona que acaba de posar con su
trago se va con las manos vacías.**

Y el dato ya está: `uploadBarMagicPhoto` **ya devuelve la dirección de la foto y un
texto listo para compartir** con el hashtag y el Instagram de AK. La pantalla lo
recibe y **lo tira**.

## Qué hacer

Después de subir, mostrar una pantalla de "listo" con:

- **La foto o el video que se acaba de sacar**, en grande.
- **Un código QR grande** para escanear con el celular y llevárselo. Que se vea de
  lejos y de noche: fondo blanco, buen tamaño.
- El texto para compartir, corto, con el hashtag.
- Un botón **"Listo"** para volver al inicio enseguida, y que además vuelva sola a
  los 20 segundos por si la persona se fue.

**Nada de imprimir.** No es una fotocabina con impresora: se lleva la foto en el
celular.

**Por qué importa:** el invitado que se lleva su foto la sube a sus redes con el
hashtag de AK. Es publicidad gratis de la fiesta, hecha por el invitado. Hoy esa
foto muere en la pantalla del salón.

---

# BLOQUE 2 — Que la foto guarde con qué trago se sacó

El sistema **ya sabe hacerlo**: la función acepta el trago y arma sola el texto
*"Disfrutando de un Mojito en la barra interactiva"*. Pero el tótem **no le manda
cuál trago era**, así que ese texto nunca sale y queda uno genérico.

**Qué hacer:** cuando la persona pidió un trago y después se saca la foto, mandar
también ese trago (el identificador y el nombre) junto con el archivo. Son dos datos
que ya están en la pantalla.

Si se sacó la foto sin haber pedido nada, va sin trago, como hasta ahora.

---

# BLOQUE 3 — Que funcione el interruptor de "seguime en las redes"

En los ajustes de la barra hay una opción para **exigir que la persona confirme que
sigue las redes de AK antes de subir su foto**. En el tótem no sirve: la pantalla
responde siempre que sí, sin preguntar. El dueño lo prende y no pasa nada.

**Qué hacer:** que el tótem respete el interruptor. Si está prendido, antes de subir
muestra un paso simple —"Seguinos y tocá acá"— con un botón que abre el Instagram de
AK y otro de "ya te sigo" para continuar. Si está apagado, no molesta a nadie.

**Ojo, que no se convierta en una traba.** Un solo toque, texto corto, y que se
pueda seguir igual si la persona insiste. Nadie quiere pelearse con una pantalla en
una fiesta, y un invitado trabado es peor que un seguidor menos.

---

---

# BLOQUE 4 — El buzón de saludos: falta la foto, y falta la puerta

**Esto no tiene nada que ver con los tragos.** Es el buzón donde el invitado le
deja un saludo a los dueños de la fiesta: `src/app/evento/buzon/[fiestaId]/page.tsx`.

## Lo que ya existe y anda

Cinco formas de dejar el saludo: **grabar video** (con efecto de cinta VHS, corta
solo a los **15 segundos**, que está bien así para un saludo), subir un video ya
hecho, **grabar audio**, audio con efecto retro, y subir un audio.

**El video de acá sigue durando 15 segundos y no se toca.** Es distinto del video
del tótem de la barra, que dura 8: uno es un saludo a los anfitriones, el otro es un
brindis con el trago en la mano.

## 4.1 — Falta sacarse una foto

Las tres opciones que tiene que haber son **foto, video y audio**. Hoy están el
video y el audio; **la foto no está**.

**Qué hacer:** agregar el modo foto, con la misma forma que ya tienen los otros:
sacarla con la cámara del celular, verla antes de mandarla, y poder repetirla. Que
se pueda escribir una dedicatoria corta debajo, igual que en los otros modos.

Aprovechá los marcos que ya existen para el video (`video-frame-templates`) si
aplican también a la foto; si no encajan, dejala simple y limpia antes que forzarlo.

## 4.2 — Al buzón no se llega desde el portal del invitado

Hoy al buzón sólo se entra por un enlace que abre el equipo desde su pantalla. **El
invitado, con su enlace personal, no tiene por dónde llegar.**

**Qué hacer:** poner el acceso al buzón en el portal del invitado
(`src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx`), al lado de las otras
opciones que ya están ahí (el quiosco de tragos, el muro, la galería). Con un texto
claro de qué es: dejarle un saludo a los dueños de la fiesta.

**Respetá el interruptor:** si el buzón está apagado para esa fiesta, la opción no
se muestra. Que no aparezca un botón que lleva a una pantalla apagada.

## Cómo se comprueba este bloque

1. Que desde el enlace personal del invitado se llega al buzón en un toque.
2. Que están las tres opciones: foto, video y audio.
3. Que el video sigue cortando a los 15 segundos.
4. Que la foto se puede repetir antes de mandarla.
5. Que con el buzón apagado, la opción no aparece en el portal del invitado.

## Cómo se comprueba

Además de los cuatro controles, probá en pantalla de verdad:

1. Que después de subir aparece el código para llevarse la foto, y que se puede
   volver al inicio sin esperar.
2. Que vuelve sola al inicio si nadie toca nada.
3. Que la foto sacada después de pedir un trago queda guardada con ese trago.
4. Que con el interruptor de las redes prendido el tótem lo pide, y apagado no
   molesta.
5. Que nada de esto rompe el pedido del trago, la cuenta regresiva ni el video de 8
   segundos.

**Que las pruebas llamen al código de verdad.** Ya pasó tres veces que una prueba
armaba una lista adentro y la filtraba ahí mismo: la entrega vino "en verde" sin
haber probado nada.

## Los cuatro controles, antes de entregar

1. `npm run check:acentos` — sin acentos rotos.
2. `npx tsc --noEmit` — cero errores.
3. `npx jest --silent` — todas en verde.
4. `npm run build` — tiene que terminar bien.

**El build es obligatorio, no un extra.** Ya pasó que el revisor de tipos pasaba y
el build fallaba, y la aplicación estuvo seis días sin poder publicarse.

## Cuando termines

Anotá en `docs/YA-RESUELTO.md` qué hiciste y actualizá `docs/QUE-HAY-EN-LA-APP.md`,
donde hoy figura que el invitado no se lleva su foto y que el interruptor de las
redes no se respeta. **Va en la misma propuesta**, no aparte.
