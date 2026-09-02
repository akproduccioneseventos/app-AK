# Orden 30 — Que la app se mueva: lo quieto se ve barato

**Para Gemini. Escrita el 1 de septiembre de 2026.**

> **Pedido del dueño:** *"la app sigue sin tener movimiento"*, *"movimiento de la estética"*.

## Lo medido el 2 de septiembre de 2026 (esto reemplaza la medición vieja)

**Las ocho páginas de venta tienen CERO movimiento.** Comprobado archivo por archivo:

| Pantalla | Archivo | Movimiento |
|---|---|---|
| La portada | `src/app/page.tsx` | **0** |
| Landing de quince | `src/app/landing/xv-anos/page.tsx` | **0** |
| Landing de bodas | `src/app/landing/bodas/page.tsx` | **0** |
| Landing de eventos | `src/app/landing/eventos/page.tsx` | **0** |
| Landing general y la de campaña | `src/app/landing/page.tsx`, `landing/[slug]/page.tsx` | **0** |
| Las de tipo de evento | `src/app/public/[eventType]/page.tsx` | **0** |
| El blog | `src/app/public/blog/page.tsx` | **0** |
| Bodas, cumpleaños, experiencia AK, club, catálogo | `src/app/{bodas,cumpleanos,experiencia-ak,club-uruguay,catalogo}/page.tsx` | **0** |

**Los trece bloques que arman esas páginas y NO se mueven** (`src/components/public/`), y son
justo los que venden:

`TestimonialsCarousel.tsx` · `GallerySection.tsx` · `WhyChooseUs.tsx` · `EventProcess.tsx` ·
`PromotionsOrGifts.tsx` · `CallToActionBanner.tsx` · `FAQSection.tsx` · `PaymentMethods.tsx` ·
`BlogInteractiveList.tsx` · `BlogFaq.tsx` · `PublicNavbar.tsx` · `QuinceaneraLeadPrompt.tsx` ·
`LocalBusinessSchema.tsx` (este último no se ve, es para Google: **no lo toques**).

**Los cinco que SÍ se mueven, y no hay que rehacer:** `HeroSection.tsx`, `AsistenteVirtual.tsx`,
`FloatingActions.tsx`, `ServiceMenu.tsx`, `InteractiveTechShowcase.tsx`.

**Adentro de la app el movimiento ya está**: 95 archivos usan `framer-motion`. **El problema es
sólo afuera**, en lo que ve quien llega de Google o de un anuncio.

## Y hay algo ya escrito que nadie usa: empezá por acá

`src/app/ak-motion-effects.css` define **`.ak-motion-rise`** —exactamente el efecto de "aparecer
subiendo" que pide esta orden—, y `src/app/layout.tsx:6` lo carga **en todas las pantallas de la
app**. Comprobado el 2 de septiembre: **ningún componente lo usa.** Lo mismo con
`.ak-deferred-section` y `.ak-led-stage-safe`: cero usos.

**Qué hacer con eso, y decidilo vos:** si sirve para el bloque 1, **usalo** y te ahorrás la
mitad del trabajo. Si no sirve, **borralo del CSS**, porque hoy se descarga en cada visita sin
hacer nada. Lo que no se puede es dejarlo como está.

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

---

## CÓMO SE COMPRUEBA QUE ESTÁ HECHA

Sin este bloque nadie puede decir si la orden se cumplió: es lo que mira `npm run ordenes?`.

**Y ojo con la prueba**, que acá está el riesgo de verdad: una prueba que sólo mire *"se ve el
título"* **pasa igual con la página quieta**. Tiene que comprobar **las dos cosas**: que el
elemento se mueve (que su posición o su opacidad cambian entre el momento de entrar y medio
segundo después) **y que el título, el precio y el botón de contacto están visibles desde el
principio**, sin esperar ninguna animación.

```comprobar
usa: framer-motion en src/components/public/TestimonialsCarousel.tsx
usa: framer-motion en src/components/public/GallerySection.tsx
usa: framer-motion en src/components/public/WhyChooseUs.tsx
usa: framer-motion en src/components/public/EventProcess.tsx
usa: framer-motion en src/components/public/CallToActionBanner.tsx
usa: framer-motion en src/app/landing/xv-anos/page.tsx
usa: framer-motion en src/app/landing/bodas/page.tsx
usa: prefers-reduced-motion en src/app/ak-motion-effects.css
prueba: tests/e2e/la-web-de-venta-se-mueve.spec.ts
```
