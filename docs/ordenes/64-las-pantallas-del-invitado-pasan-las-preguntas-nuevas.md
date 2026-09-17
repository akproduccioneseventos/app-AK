# Orden 64 — Las pantallas del invitado pasan las preguntas nuevas

**Para Gemini.** **UNA SOLA propuesta con todos los bloques.** Si un bloque se traba, entregá el
resto igual en la misma propuesta y avisá cuál faltó.

**Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`**: son **quince preguntas** ahora, no
nueve. Las seis nuevas salieron de defectos reales de este mes.

## Por qué existe esta orden

Codex encontró en la encuesta post fiesta tres cosas que **ninguna de las preguntas viejas
agarraba**: el botón quedaba en "Enviando..." para siempre si se cortaba la señal, dos respuestas
a la vez perdían una, y se aceptaba cualquier campo que llegara del navegador. El servidor ya está
arreglado. **Lo que falta es probar en el navegador que la pantalla se comporta**, y pasar las
mismas preguntas por las otras pantallas que usa gente sin cuenta.

## Bloque 1 — La prueba de navegador que mira el resultado, no el código

**Esto es lo más importante de la orden.** Hoy el control que tenemos lee el código y verifica que
el apagado del cartel esté en un `finally`. Eso frena la regresión, pero **no ve la pantalla**.

- **Archivo nuevo:** `tests/e2e/las-pantallas-del-invitado-no-quedan-colgadas.spec.ts`.
- **Qué tiene que comprobar, y es el resultado, no la forma:**
  1. Abrir `/feedback/<id de fiesta>`, completar el formulario.
  2. **Cortar la respuesta del servidor** con `page.route(...)` sobre la llamada de la acción, para
     que falle.
  3. Apretar "Enviar Mis Comentarios".
  4. **El botón vuelve a decir "Enviar Mis Comentarios"** —no "Enviando..."— y aparece el aviso de
     que no se pudo enviar. Eso es lo que se comprueba.
  5. Y lo que escribió el invitado **sigue en los campos**: no se perdió.
- Hacé lo mismo con la confirmación de asistencia (`/invitacion/<id>/rsvp`).
- **Rompela a propósito una vez**: sacá el `finally` de
  `src/app/feedback/[fiestaId]/page.tsx` y verificá que la prueba se ponga en rojo. Dejá escrito en
  el comentario de arriba del archivo que la probaste rompiéndola.

## Bloque 2 — Pregunta doce: ¿qué pasa si toca dos veces?

En las pantallas del invitado —confirmación de asistencia, buzón de recuerdos, muro de fotos,
fotocabina— el invitado tiene el dedo nervioso y la señal del salón es mala.

- Revisá que **el botón se apague mientras trabaja y se vuelva a prender en un `finally`**, en cada
  una.
- Donde dos toques generen **dos registros** —dos confirmaciones del mismo invitado, dos saludos
  iguales en el buzón—, que el segundo no cree un registro nuevo.
- **NO toques** `src/app/actions/feedback.ts` ni `src/lib/feedback/lo-que-llega-de-afuera.ts`: eso
  ya está hecho y anda.

## Bloque 3 — Pregunta catorce: ¿qué ve el que adivina el enlace?

Las pantallas que se abren sin cuenta están bien que sean públicas. Lo que hay que mirar es **qué
traen pegado de más**: el presupuesto, precios internos, el teléfono del cliente, la lista del
personal, el itinerario interno de la empresa.

- Recorré lo que devuelve el servidor a cada pantalla pública y **sacá lo que el invitado no tiene
  por qué ver**. Una sola cosa por vez y con el nombre exacto del campo en el mensaje del commit.
- **El itinerario interno ya está filtrado** (`src/__tests__/el-cliente-no-ve-lo-interno-del-itinerario.test.ts`):
  no lo rehagas, usalo de modelo.

## Lo que NO se toca

- Los textos que ve el cliente en la web y las decisiones de marketing: promociones, descuentos, el
  reloj del simulador. Nada de eso se cambia.
- La descarga de las fotos del muro con enlace directo: **es a propósito**, el dueño quiere que
  cualquiera con el enlace pueda bajarlas.
- El servidor de la encuesta, ya arreglado.

## Qué tiene que comprobar la prueba

Cada bloque deja su prueba, y **ninguna puede dar verde con la función apagada**. La del bloque 1
tiene que fallar si se saca el `finally`; la del bloque 2, si se saca el bloqueo del botón.

```comprobar
prueba: tests/e2e/las-pantallas-del-invitado-no-quedan-colgadas.spec.ts
usa: finally en src/app/invitacion/[fiestaId]/rsvp/page.tsx
archivo: docs/ANTES-DE-ENTREGAR.md
```

## Bloque 4 — Pregunta doce en las pantallas que NO son de plata

Claude ya puso tope de espera en los cuatro botones de plata que faltaban (cobrar una factura,
crear una factura, cobrar contra un presupuesto y guardarlo desde el configurador de reunión).
**Esos no se tocan, ya están.**

Falta el mismo repaso en las pantallas que son tuyas: entretenimiento, pantalla gigante, buzón,
impresos, herramientas internas. En cada botón que guarda o manda algo:

- que se apague mientras trabaja **y se vuelva a prender en un `finally`**;
- que use `conTopeDeEspera(...)` de `src/lib/ui/tope-de-espera.ts` cuando la espera depende del
  servidor, así el botón nunca queda girando para siempre;
- y agregá la pantalla a `src/__tests__/los-botones-de-plata-no-se-cuelgan.test.ts`, que es la
  lista donde esto se controla solo.
