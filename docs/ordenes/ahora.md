# La carta de tragos en el celular del invitado, como se merece

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
