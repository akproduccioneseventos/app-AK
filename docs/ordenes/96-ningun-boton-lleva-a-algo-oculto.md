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

## La prueba

`src/__tests__/ningun-boton-lleva-a-algo-oculto.test.ts`. Por cada archivo arreglado, comprobá que
el botón y su destino usan la misma condición, con el mismo estilo que
`src/__tests__/el-pendiente-no-lleva-a-una-seccion-oculta.test.ts` (que ya existe; no lo
modifiques). **Tiene que ponerse en rojo si se saca la condición del botón.**

```comprobar
prueba: src/__tests__/ningun-boton-lleva-a-algo-oculto.test.ts
```
