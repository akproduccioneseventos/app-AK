# La barra de tragos: que el invitado se lleve su foto y vea bien la carta

**Para:** Gemini (Antigravity)
**Escrita:** 18 de agosto de 2026.

## Cómo se entrega

**UNA SOLA propuesta de cambios con todo adentro.** Cada fusión dispara un
despliegue y eso se paga. Si algo se traba, entregá el resto igual, en la misma
propuesta, avisando qué faltó.

**Arrancá desde la versión principal de ahora.** Las últimas dos entregas llegaron
hechas sobre una base vieja y una traía adentro la anterior entera: habría borrado
tres correcciones sin que se notara.

Antes de tocar nada, leé `docs/YA-RESUELTO.md` y `docs/QUE-HAY-EN-LA-APP.md`.

## Lo que YA EXISTE — no lo rehagas

Se verificó pantalla por pantalla. **Todo esto anda y no se toca:**

- **La pantalla grande de la barra** (`src/app/evento/barra/[fiestaId]/page.tsx`)
  ya muestra la carta como carrusel: las tarjetas se pasan de costado con el dedo y
  se acomodan solas al soltar. Ahí está el modelo a copiar.
- **El invitado ya puede pedir su trago** desde su enlace personal
  (`src/app/invitacion/[fiestaId]/invitado/[guestId]/MiniQuiosco.tsx`): elige,
  confirma, ve el estado (pedido / preparándose / listo), cancela o cambia de
  trago. **Toda esa lógica queda igual.**
- **El barman ya recibe los pedidos** en `/evento/barra/<fiesta>/barman`.
- El **tótem** (`/evento/totem/...`) es la pantalla de fotos del muro, **no tiene
  nada que ver con los tragos**. Ni lo toques.

## El problema, en una frase

**La pantalla del salón se ve mucho mejor que la que el invitado tiene en la mano.**

En el celular del invitado la carta es una grilla quieta de dos columnas, con la
foto del trago del tamaño de una estampilla (64 píxeles), el nombre y los
ingredientes en letra chica. El trago no se ve: se lee.

Es la pantalla que más mira el invitado en toda la noche, y es la más pobre.

## Qué hacer

Cambiar **sólo cómo se ve la carta** dentro del quiosco del invitado, por un
carrusel parecido al de la pantalla grande:

- **Tarjetas grandes, de a una o una y media por pantalla**, que se pasan de
  costado con el dedo y se acomodan solas al soltar (el mismo
  `snap-x snap-mandatory` que ya usa la pantalla grande).
- **La foto del trago es la protagonista**: que ocupe la mayor parte de la tarjeta,
  no una estampilla al costado. Si un trago no tiene foto cargada, que se vea bien
  igual —un fondo de color con el ícono grande y el nombre—, no un hueco gris.
- El nombre grande, los ingredientes debajo en letra legible, y el botón **Pedir**
  bien grande abajo de todo, que se alcance con el pulgar.
- **Que se note que hay más tragos a los costados**: que asome un pedacito de la
  tarjeta siguiente. Si no, el invitado cree que sólo hay uno.

## Cuidados

- **Es de noche y en una fiesta.** Botones de 44 píxeles para arriba, buen
  contraste, nada de letra menor a 12.
- **Se usa con una sola mano.** El botón de pedir tiene que quedar abajo, al
  alcance del pulgar, no arriba.
- **Si hay muchos tragos**, que se puedan filtrar por categoría como en la pantalla
  grande. Si son pocos, no muestres el filtro y no ocupes lugar.
- **No cambies nada de la parte de pedir.** Confirmar, cancelar, cambiar de trago y
  el estado del pedido ya funcionan y no se tocan.
- **Con la señal mala del salón**, que las fotos no dejen la pantalla en blanco: que
  la tarjeta se vea igual mientras la foto carga.

## Cómo se comprueba

Además de los cuatro controles, probalo **en tamaño de celular de verdad** (390 de
ancho) y confirmá:

1. Que se pasa de costado con el dedo y se acomoda solo.
2. Que se ve que hay más tragos al costado.
3. Que el botón de pedir se alcanza sin mover la mano.
4. Que un trago sin foto se ve bien igual.
5. Que pedir, cancelar y cambiar de trago siguen funcionando exactamente como antes.

Y del tótem:

6. Que después de subir la foto aparece el código para llevársela, y que se puede
   volver al inicio sin esperar.
7. Que la foto sacada después de pedir un trago queda guardada con ese trago.
8. Que con el interruptor de las redes prendido el tótem lo pide, y apagado no
   molesta.

---

# BLOQUE 2 — El tótem de la barra: tres cosas que se pierden

El tótem (`src/app/evento/barra/[fiestaId]/page.tsx`) es la pantalla táctil que va
en el salón: se pide el trago, y te sacás una foto o un video con él. **Funciona
bien.** Pero se le escapan tres cosas, y las tres están a un paso de estar hechas.

## 2.1 — El invitado se saca la foto y se va sin nada

Hoy sube la foto, aparece un cartel que dice "se envió a la pantalla gigante", y la
pantalla vuelve al inicio. **La persona que acaba de posar con su trago se va con
las manos vacías.**

Lo peor es que el dato ya está: `uploadBarMagicPhoto` **ya devuelve la dirección de
la foto y un texto listo para compartir** con el hashtag y el Instagram de AK. La
pantalla lo recibe y **lo tira**.

**Qué hacer:** después de subir, mostrar la foto o el video con un **código QR
grande** para que la persona lo escanee y se lo lleve al celular. Que la pantalla
espere unos segundos —con un botón de "listo" para volver antes— y recién ahí
vuelva al inicio.

**Por qué importa más de lo que parece:** el invitado que se lleva su foto la sube a
sus redes con el hashtag de AK. Es publicidad gratis de la fiesta, hecha por el
invitado. Hoy esa foto muere en la pantalla del salón.

## 2.2 — La foto no guarda con qué trago se sacó

El sistema **ya sabe** guardar el trago junto a la foto: la función acepta el trago
y arma sola el texto *"Disfrutando de un Mojito en la barra interactiva"*. Pero el
tótem **no le manda cuál trago era**, así que ese texto nunca sale y queda el
genérico.

**Qué hacer:** cuando la persona pidió un trago y después se saca la foto, mandar
también el trago elegido. Es pasar dos datos que ya están en la pantalla.

## 2.3 — El interruptor de "seguime en las redes" no funciona en el tótem

En los ajustes de la barra hay una opción para **exigir que la persona confirme que
sigue las redes de AK antes de subir su foto**. En el tótem no sirve: la pantalla
manda siempre que sí, sin preguntar. El dueño lo prende y no pasa nada.

**Qué hacer:** que el tótem respete el interruptor. Si está prendido, antes de subir
muestra un paso simple —"Seguinos y tocá acá"— con el botón que abre el Instagram de
AK y un "ya te sigo" para seguir. Si está apagado, no molesta a nadie.

**Ojo:** que no se convierta en una traba. Un solo toque, texto corto, y que se pueda
saltar si la persona insiste. Nadie quiere pelearse con una pantalla en una fiesta.

## Lo que NO se toca del tótem

Pedir el trago, la cuenta regresiva de tres para la foto, la grabación de video, las
plantillas de marco, y el envío a la pantalla gigante. Todo eso anda.

## Los cuatro controles, antes de entregar

1. `npm run check:acentos` — sin acentos rotos.
2. `npx tsc --noEmit` — cero errores.
3. `npx jest --silent` — todas en verde.
4. `npm run build` — tiene que terminar bien.

**El build es obligatorio, no un extra.** Ya pasó que el revisor de tipos pasaba y
el build fallaba, y la aplicación estuvo seis días sin poder publicarse.

## Cuando termines

Anotá en `docs/YA-RESUELTO.md` qué hiciste y actualizá `docs/QUE-HAY-EN-LA-APP.md`,
donde hoy figura que en el celular del invitado la carta es una grilla quieta. **Va
en la misma propuesta**, no aparte.
