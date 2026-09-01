# Orden 30 — Que la app se mueva: lo quieto se ve barato

**Para Gemini. Escrita el 1 de septiembre de 2026.**

> **Pedido del dueño:** *"la app sigue sin tener movimiento"*, *"movimiento de la estética"*.

## Lo medido, y explica el problema

| Dónde | Archivos con movimiento |
|---|---|
| **Las landings** (`src/app/landing`) | **0 de 6** |
| **Las páginas de venta** (`src/app/public`) | **0 de 4** |
| **La invitación digital** | 2 de 7 |
| El entretenimiento | 17 de 60 |

**Está al revés de lo que conviene.** Lo animado está adentro, en la fiesta; **lo quieto está
afuera**, justo en las pantallas que ve un prospecto que llega de Google o de un anuncio, y en
la invitación que la novia le manda a 200 personas.

**La app ya usa `framer-motion` en 57 pantallas: no hay que traer nada nuevo.**

## CÓMO SE ENTREGA

**UNA SOLA PROPUESTA.** `npm run "publicar?"` en verde y anotado en `docs/YA-RESUELTO.md`.

---

## LAS REGLAS, primero, porque el movimiento mal hecho es PEOR que ninguno

Una página que se sacude, rebota o hace esperar **se siente barata y lenta**. Esto no se
negocia:

1. **Todo entra igual: apareciendo y subiendo un poco.** 16 píxeles, no 100. Nada que venga
   volando del costado, nada que rebote, nada que gire.
2. **Rápido: entre 0,3 y 0,5 segundos.** Más lento que eso, la página se siente pesada.
3. **Una sola vez.** Lo que ya se vio no se vuelve a animar al subir y bajar.
4. **Nada importante espera para aparecer.** El título, el precio y el botón de contacto se ven
   **de entrada**. El movimiento acompaña, **nunca hace esperar**.
5. **En cascada, no todo junto**: cada bloque entra 80 milisegundos después del anterior. Con
   tres o cuatro escalones alcanza; más, aburre.
6. **Respetá a quien pidió menos movimiento.** El sistema operativo avisa cuando alguien lo
   configuró (`prefers-reduced-motion`): ahí **no se anima nada**. Hay gente a la que le da
   mareo, y además es lo correcto.
7. **En el celular, más sobrio.** Menos distancia y menos escalones: la pantalla es chica y el
   dedo va rápido.

---

## BLOQUE 1 — Las páginas de venta y las landings  ← ARRANCÁ POR ACÁ

`src/app/landing/*` y `src/app/public/*`. **Cero movimiento hoy.**

- **Al entrar**: el título y el subtítulo aparecen subiendo, uno detrás del otro.
- **Al bajar**: cada sección entra cuando llega a la pantalla, una sola vez.
- **Los números que impresionan** (fiestas hechas, invitados, estaciones), **que suban contando**
  cuando aparecen. Es lo que más engancha y es barato de hacer.
- **Las fotos de fiestas**: un acercamiento lento y suave al pasar el mouse. En el celular, nada.

---

## BLOQUE 2 — La invitación digital

Es lo que ve el invitado y lo que muestra la novia. Hoy casi no se mueve.

- **La portada**: la foto con un acercamiento muy lento y continuo, y el nombre apareciendo
  encima.
- **La cuenta regresiva**: que los números **cambien**, no que salten.
- **Cada sección** —cronograma, galería, regalos, vestimenta— entra al llegar a ella.
- **Al confirmar asistencia**: que se sienta que pasó algo. Una palomita que se dibuja, no un
  cartel seco.

**Ojo: los ocho diseños tienen personalidad distinta.** El de boda campo se mueve más suave que
el de fiesta de noche. **Mismo tiempo, distinta intensidad.**

---

## BLOQUE 3 — Que nada aparezca de golpe

Es lo que más se nota y lo que menos se piensa: **una pantalla que se arma de a pedazos mientras
carga se ve barata**, aunque el contenido sea bueno.

- **Mientras carga, el hueco del contenido con su forma** (lo que se llama "esqueleto"), no un
  espacio en blanco que después salta.
- **Las imágenes con su lugar reservado**, para que el texto no se mueva cuando terminan de
  bajar.
- **Al cambiar de pantalla**, que la nueva aparezca suave en vez de parpadear.

**Esto vale para toda la app, no sólo para las de venta.**

---

## LO QUE NO SE TOCA

- **El entretenimiento y la pantalla gigante ya se mueven**, y tienen sus propias reglas en la
  orden 22, bloque 7. **No los toques.**
- **Ningún texto de venta, precio, promesa ni el reloj del simulador**: son decisiones
  comerciales del dueño. **Movés cómo aparece, no lo que dice.**
- **Nada que se pague por mes** ni ninguna biblioteca nueva: `framer-motion` ya está.
- **Plata, cobros, comida y permisos: los hace Claude.**

## Y la prueba que hay que dejar

Que **nada importante quede escondido esperando una animación**: abrir la portada y las landings
y comprobar que **el título, el precio y el botón de contacto están visibles**. Ése es el riesgo
real de esta orden: que por animar, el prospecto entre y no vea el precio.
