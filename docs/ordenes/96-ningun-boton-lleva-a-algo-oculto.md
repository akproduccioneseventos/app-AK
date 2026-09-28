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
- **Los textos y los números los cambia el bloque 5**, que ya decidió el dueño.
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

## Bloque 5 — Nada de garantías ni de "24/7", y son 7 años (decisión del dueño, 28/09/2026)

Palabras del dueño: *"nada de garantía ni 24/7, y son 7 años; no prometo cosas que no puedo
cumplir"*. Cambiá **exactamente** esto (líneas aproximadas):

| Dónde | Dice | Tiene que decir |
|---|---|---|
| `src/app/simulador-de-presupuesto/page.tsx` ~l.1995 y `src/app/simulador/page.tsx` ~l.81 | "…sin estrés, con costo real y garantía absoluta" | "…sin estrés y con costo real" |
| `src/app/simulador-de-presupuesto/page.tsx` ~l.2025 | "Lo que nos diferencia y te garantiza tranquilidad total" | "Lo que nos diferencia" |
| `src/app/simulador-de-presupuesto/page.tsx` ~l.2053 | "Calidad y cantidad garantizadas" | "Calidad y cantidad, como se contrató" |
| `src/components/landing/StatsSection.tsx` ~l.9-12 | "+12" años; "100%" / "Clientes satisfechos"; "24/7" / "Acompañamiento" | "+7" años; la tercera queda **sin porcentaje**: `value: 'Clientes'`, `label: 'Satisfechos'` (el contador ya muestra el texto tal cual cuando no hay número); **sacá la de 24/7** y acomodá la grilla para tres |
| `src/components/landing/StatsSection.tsx` ~l.9 | "+500" / "Eventos realizados" | "+200" / "Eventos realizados" |
| `src/types/landing-editor.ts` ~l.155-158 (`defaultLandingSettings.stats`, lo que sale en la portada si nadie guardó otra cosa) | "+500 Eventos Realizados", "+12 Años", "100% Clientes Satisfechos", "24/7 Soporte al Cliente" | los mismos tres de `StatsSection`: "+200" eventos, "+7" años, "Clientes" / "Satisfechos"; **sacá la de 24/7** |
| `src/app/actions/landing-editor.ts` ~l.22 (`getLandingSettings`) | usa las cifras guardadas en la base si existen | **si lo guardado es exactamente la lista vieja de cuatro** (los cuatro `value` de arriba: "+500", "+12", "100%", "24/7"), devolvé `defaultLandingSettings.stats`. Si el dueño ya las cambió a mano desde el editor, **no se tocan** |
| `src/app/(app)/empresa/landing-editor/page.tsx` ~l.762 | `placeholder="+500"` | `placeholder="+200"` |
| `src/app/catalogo/[tipo]/page.tsx` ~l.201-203 | "+10" años; "+500" eventos; "+500" familias felices | "+7" años; "+200" eventos; la tercera "Clientes" / "Satisfechos", sin número |
| `src/data/presentacion.ts` ~l.106 | "DJ profesional con +10 años de experiencia" | "DJ profesional con +200 fiestas realizadas" |
| `src/components/public/HeroSection.tsx` ~l.132 | "✅ +10 años de experiencia" | "✅ +7 años de experiencia" |
| `src/data/event-catalogs/shared.ts` ~l.118 y ~l.124 | "+10 años de experiencia"; "para garantizar la máxima calidad" | "+7 años de experiencia"; "para cuidar la calidad" |
| `src/components/landing/AkDifferenceSection.tsx` ~l.15 | "Menos proveedores, cero fallas." | "Menos proveedores, todo coordinado por el mismo equipo." |
| `src/components/public-footer.tsx` ~l.256 | "Coordinación presencial garantizada el día de tu celebración." | "Coordinación presencial el día de tu celebración." |
| `src/app/presentacion-led/slides/beneficios-slide.tsx` ~l.11 y ~l.86 | "Puntualidad garantizada en cada etapa."; "· Resultado garantizado" | "Puntualidad en cada etapa."; sacá "· Resultado garantizado" |
| `src/app/actions/social-admin.ts` ~l.39 | "…tu evento. ¡Diversión garantizada!" | "…tu evento." |
| `src/app/public/[eventType]/page.tsx` ~l.123 | "…una propuesta a medida en 24 hs." | "…una propuesta a medida." (plazos, ya prohibido desde agosto) |
| `src/app/actions/asistente-virtual.ts` ~l.65 | "asesor de ventas virtual 24/7" | "asesor de ventas virtual", y sumá a sus reglas: "No prometas plazos, garantías ni resultados." |

- **No se nombra a nadie del personal ni se destaca a una persona.** Palabras del dueño: *"se destaca
  el trabajo en equipo y el organizador"*. Si el barrido encuentra un texto que presenta a un
  integrante por su experiencia o su nombre, se reescribe hablando del equipo y del organizador.
- **Las cifras son las del dueño:** +200 eventos y +7 años. No inventes otras.
- **Barrido:** buscá sin distinguir mayúsculas `garant|24/7|24 ?hs|24 horas|cero fallas` en lo que
  ve un cliente o un prospecto (`src/app` sin `(app)`, `src/components/public`,
  `src/components/landing`, `src/data`, los artículos del blog). Lo que aparezca y sea una promesa
  se saca con el mismo criterio. Listalo en la descripción de la propuesta.
- **La prueba** (`src/__tests__/la-web-no-promete-lo-que-no-se-puede-cumplir.test.ts`) recorre esos
  mismos archivos y falla si aparece `garant`, `24/7`, `24 hs`, `cero fallas`, "+10 años", "+12
  años", "+500" o "100%" junto a "satisfechos". **Tiene que ponerse en rojo si se vuelve a escribir "garantía absoluta".**

## Bloque 6 — El blog tampoco promete (Codex, 28/09/2026)

Los artículos del blog los escribe la IA sola todos los días (`src/lib/blog-ai-generator.ts`), y
**la instrucción que le damos (~l.125) no le prohíbe prometer ni inventar datos**. Por eso tres
artículos publicados dicen cosas que el dueño no quiere decir. Hay que arreglar los tres **y** la
fuente, para que no vuelva.

**1. La instrucción a la IA** (`prompt`, ~l.125-131). Sumale estas reglas, textuales:

- "No prometas plazos, garantías, resultados ni seguridad. No escribas 'garantía', 'garantizado',
  '24/7', 'cero fallas', 'seguro para interiores' ni 'te aseguramos'."
- "No inventes estadísticas ni preferencias de clientes: nada de 'la mayoría de los clientes',
  'la opción preferida' ni porcentajes que no te dimos."
- "Las cantidades (bebida, hielo, comida) son orientativas: decilo en el mismo párrafo."

**2. Un control después de generar.** Función pura nueva `textoQuePromete(texto): string | null` en
`src/lib/blog/sin-promesas.ts`, que devuelve la frase encontrada si el texto tiene
`garant|24/7|cero fallas|segur[oa]s? para interiores|te aseguramos|la mayor[ií]a de (los )?clientes|opci[oó]n preferida`
(sin distinguir mayúsculas). En `blog-ai-generator.ts`, **antes de guardar**, pasala por el
artículo entero (`JSON.stringify` del generado): si encuentra algo, **no se guarda**, se registra
el motivo y se sale como cuando falla la generación. Nada de publicar "casi bien".

**3. Los tres artículos ya publicados.** Viven en la base (`readData('blog-posts.json')`, que en
producción no es el archivo del repositorio), así que **no alcanza con editar `data/blog-posts.json`**.
Hacé una función pura `corregirPromesasDelBlog(posts)` en el mismo `sin-promesas.ts` que reemplace
**exactamente** estas frases, y aplicala en `getBlogPosts` (`src/app/actions/blog.ts` ~l.12) y en
`getBlogPostBySlug` al leer. Corregí también `data/blog-posts.json` con los mismos textos.

| Artículo (`slug`) | Dice | Tiene que decir |
|---|---|---|
| `tecnologias-iluminacion-pantallas-quince` | "Asegurar chispas frías homologadas y seguras para interiores." | "Consultar con el salón si permite chispas frías y usar sólo equipos con ficha técnica del proveedor." |
| `catering-tradicional-vs-islas-quinceanos` | "Es la opción preferida para las quinceañeras en Salto porque…" | "Es una opción que eligen muchas quinceañeras porque…" (el resto de la frase igual) |
| `catering-tradicional-vs-islas-quinceanos` | "la mayoría de los clientes de AK Producciones eligen la propuesta mixta" | "una opción que funciona muy bien es la propuesta mixta" |
| `como-calcular-bebida-evento-salto` | "Si contratás una barra tecnológica de AK Producciones, el cálculo del stock ya está cubierto, pero si…" | "Si contratás la barra de AK Producciones, el cálculo lo hacemos con vos; si…" |
| `como-calcular-bebida-evento-salto` | `takeaway` "El promedio ideal es 1.5 litros…" | agregale al principio "Como referencia orientativa, " y dejá el resto |

**No toques** las cantidades en sí (litros, hielo, 20%): son orientación útil; lo que cambia es
que se lean como orientación y no como promesa. **Tampoco** el texto del ajuste para años futuros
de `src/data/blog-posts.ts` ~l.82: no promete nada y no contradice el ajuste anual.

**La prueba** (`src/__tests__/el-blog-no-promete.test.ts`):

- `corregirPromesasDelBlog` sobre una copia de `data/blog-posts.json` **anterior a tu cambio** (pegala
  en la prueba como dato) devuelve artículos donde `textoQuePromete` da `null`;
- `textoQuePromete` encuentra "garantía absoluta" y "la mayoría de los clientes";
- con el generador simulado devolviendo un artículo con "seguras para interiores", **no se llama a
  `writeData`**. Tiene que ponerse en rojo si se saca el control del paso 2.

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
no-usa: +500 en src/types/landing-editor.ts
no-usa: +500 en src/app/catalogo/[tipo]/page.tsx
no-usa: +10 años en src/data/presentacion.ts
usa: textoQuePromete en src/lib/blog-ai-generator.ts
usa: corregirPromesasDelBlog en src/app/actions/blog.ts
prueba: src/__tests__/el-blog-no-promete.test.ts
usa: sm:flex-wrap en src/components/public/InteractiveTechShowcase.tsx
prueba: tests/e2e/el-carrusel-de-tecnologia-se-ve-entero.spec.ts
prueba: src/__tests__/la-web-no-promete-lo-que-no-se-puede-cumplir.test.ts
no-usa: garantía absoluta en src/app/simulador-de-presupuesto/page.tsx
no-usa: '24/7' en src/components/landing/StatsSection.tsx
```
