# 96 — Ningún botón lleva a algo que está oculto

**Para:** Gemini.
**Escrita por:** Claude, el 28 de septiembre de 2026.
**De dónde sale:** Codex encontró que el portal del cliente mostraba "Confirmar menú" con la
sección del menú oculta: el cliente tocaba y no pasaba nada. Se arregló ese botón y dos más del
mismo portal (`src/app/portal-cliente/[id]/page.tsx`: los pendientes de menú, invitados y
pagos). Con la pregunta nueva del método (la 29 de `docs/COMO-AUDITAR.md`, y la 18 de
`docs/ANTES-DE-ENTREGAR.md`) hay que barrer toda la app.

## Cómo se entrega

- **UNA SOLA propuesta.** Si una parte se traba, entregá el resto igual en la misma propuesta y
  avisá qué parte faltó.
- **Arrancá desde la versión principal de ahora.**
- Antes de decir "terminé", pasá por `docs/ANTES-DE-ENTREGAR.md`.
- Tipos en cero, `npx jest` en verde, `npm run check:acentos` y `npm run "publicar?"` en verde.
- Anotá lo que arreglaste en `docs/YA-RESUELTO.md`.

## Qué buscar

1. **Enlaces a secciones de la misma pantalla.** Buscá `href="#`, `href: '#` y `` href={`# `` en
   `src/app` y `src/components`. Para cada uno:
   - encontrá el elemento con ese `id`;
   - fijate si está adentro de un `{condicion && (...)}` o de un modo que lo esconde.

   Si el destino se puede esconder y el botón no se esconde con **la misma condición**, es un
   hallazgo.

   Los que ya se sabe que hay que mirar:
   - `src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx` (~l.791 `#mi-pase` y ~l.798
     `#datos-evento`);
   - `src/app/evento/hub/[fiestaId]/page.tsx` (~l.353 `#event-tools-title`);
   - `src/components/public-footer.tsx` y `src/components/landing/LandingNav.tsx`: las
     secciones `#landing-*` de las landings **se prenden y apagan** desde los ajustes de cada
     landing;
   - `src/components/public/HeroSection.tsx` (~l.112 `#servicios`);
   - `src/app/presentacion-led/portafolio/*` (`#mapa`).
2. **Enlaces a otras pantallas que pueden no estar habilitadas.** En los dos portales
   (`src/app/portal-cliente/[id]/` y `src/app/invitacion/[fiestaId]/invitado/[guestId]/`) y en
   las tarjetas de navegación del portal del cliente (~l.673, "Feature Navigation Cards"), mirá
   cada `Link` o `router.push`.
   - Si la pantalla de destino chequea un ajuste o un módulo contratado
     (`modulosContratados`, `portalSettings.*.visible`, `simplicityMode`,
     `socialGallerySettings.enabled`) y **el botón no chequea lo mismo**, es un hallazgo.
   - Ejemplo a revisar: los pendientes que llevan a `/portal-cliente/${fiestaId}/musica` y
     `/fotos-video`.

## Qué cuenta como arreglo

- Lo más simple: el botón usa **la misma variable** que decide si se muestra el destino. No
  copies la condición a mano. Si hace falta, calculala una vez y usala en los dos lugares.
- Si el destino está oculto pero lo que el botón pide igual hay que hacerlo, llevá a otra
  pantalla que sí exista (por ejemplo, la página propia de esa parte).

## Qué NO se toca

- **No cambies qué se muestra y qué no.** El modo simple y los ajustes de visibilidad son
  decisiones del dueño. Sólo se alinean los botones con lo que ya se muestra.
- Si un hallazgo toca lo que ve un cliente de **plata** (pagos, cuotas), listalo en la propuesta y
  arreglalo igual con la misma regla, pero decilo en la descripción, así Claude lo mira con lupa.
- No saques secciones ni botones de las landings: se alinean, no se borran.

## Bloque 2 — Los números de la portada arrancan en cero (hallazgo de Codex, 28/09/2026)

`src/components/ui/animated-counter.tsx` arranca en `0` (`useState(0)`) y recién sube cuando la
tarjeta entra en pantalla. Desde `src/components/landing/StatsSection.tsx` (~l.9-12) se usa para
"+500 eventos", "+12 años", "100%" y "24/7". Mientras nadie baja hasta ahí —y **siempre para
Google**, que lee la página sin animar—, la portada dice **"+0 eventos", "+0 años", "0%" y "0/7"**.

- **Arreglo:** que el primer dibujo y lo que sale del servidor muestren **el número final**. La
  animación arranca desde cero recién cuando la tarjeta entra en pantalla, del lado del navegador.
  Guardá una marca de "ya se animó" para que no parpadee.
- **No cambies los textos ni los números.** Eso lo decide el dueño.
- **La prueba** (`tests/e2e/la-portada-no-dice-cero.spec.ts`) abre la portada **sin bajar** y
  comprueba que el HTML que llega del servidor contiene "+500" y no contiene "+0 ". Después baja
  hasta las tarjetas y comprueba que dicen "+500".

## Bloque 3 — El simulador ignora el tipo de fiesta que le mandan (Codex, 28/09/2026)

**Lo roto, y le cuesta ventas.** Las tarjetas de la portada
(`src/components/landing/ServicesSection.tsx` ~l.46-67) y las landings de bodas, quinceañeras y
cumpleaños (`src/app/bodas/page.tsx` ~l.35, `src/app/quinceaneras/page.tsx` ~l.35,
`src/app/cumpleanos/page.tsx` ~l.28) abren el simulador con `?tipo=...`. Pero el simulador
(`src/app/simulador-de-presupuesto/page.tsx` ~l.259) **sólo lee `eventType`**. Resultado: el
novio que llega desde la landing de bodas —justo la de los anuncios— arranca en **"Cumpleaños"**.

- **Arreglo:** en ~l.259, leer `searchParams.get('eventType') ?? searchParams.get('tipo')`.
  `normalizePrefillEventType` (~l.245) ya entiende "boda", "Boda", "15-anos", "XV años" y
  "corporativo". Para "social" devuelve Cumpleaños, que está bien.
- **No cambies los enlaces** de las landings: los anuncios ya publicados usan esas direcciones.

**Y el barrido (pregunta 30 del método):** buscá todos los enlaces que llevan datos en la
dirección (`?algo=` y `&algo=`) en `src/app` y `src/components`, y fijate que la pantalla de
destino lea **ese mismo nombre** con `searchParams.get('algo')`. Si no lo lee, es un hallazgo:
se arregla en el destino, leyendo también ese nombre.

**La prueba** (`tests/e2e/el-simulador-respeta-el-tipo-de-fiesta.spec.ts`):
- abre `/simulador-de-presupuesto?tipo=boda` y comprueba que queda elegida **Boda**;
- abre `?tipo=XV%20a%C3%B1os` y comprueba que queda **15 años**;
- abre sin nada y comprueba que queda Cumpleaños, como hoy.

## Bloque 4 — En la computadora, la 360 y el espejo quedan afuera del carrusel (Codex, 28/09/2026)

`src/components/public/InteractiveTechShowcase.tsx` ~l.234: la fila de estaciones usa a la vez
`overflow-x-auto`, `hide-scrollbar` y `sm:justify-center`. Cuando los botones no entran, centrar
una fila que se desborda **corta los de las puntas y no deja llegar a ellos**, y además la barra
está escondida. Por eso "Plataforma 360" queda afuera y "Espejo Mágico" cortado.

- **Arreglo:** en el celular sigue el desplazamiento horizontal (`justify-start`). Desde `sm:`, la
  fila **se parte en renglones** (`sm:flex-wrap sm:justify-center sm:overflow-visible`). No
  cambies los botones ni las fichas.
- **La prueba** (`tests/e2e/el-carrusel-de-tecnologia-se-ve-entero.spec.ts`), a 1280 × 800 y a
  390 × 844: cada botón de estación tiene que quedar **entero adentro de la pantalla**. Hacé
  `scrollIntoViewIfNeeded` en el celular y comparalo con el tamaño de la ventana; al hacer clic
  con el puntero, la ficha tiene que cambiar al nombre de esa estación.

## La prueba

`src/__tests__/ningun-boton-lleva-a-algo-oculto.test.ts`. Por cada archivo arreglado, comprobá que
el botón y su destino usan la misma condición, con el mismo estilo que
`src/__tests__/el-pendiente-no-lleva-a-una-seccion-oculta.test.ts` (que ya existe; no lo
modifiques). **Tiene que ponerse en rojo si se saca la condición del botón.**

```comprobar
prueba: src/__tests__/ningun-boton-lleva-a-algo-oculto.test.ts
prueba: tests/e2e/la-portada-no-dice-cero.spec.ts
usa: searchParams.get('tipo') en src/app/simulador-de-presupuesto/page.tsx
prueba: tests/e2e/el-simulador-respeta-el-tipo-de-fiesta.spec.ts
usa: sm:flex-wrap en src/components/public/InteractiveTechShowcase.tsx
prueba: tests/e2e/el-carrusel-de-tecnologia-se-ve-entero.spec.ts
```
