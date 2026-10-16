# PARA GEMINI - Orden 177: la portada nueva (plan "Argon", aprobado por el dueño el 16/10/2026)

**El dueño dijo que sí a todo el plan ("hacé todo").** Esta orden lo baja a pasos exactos. **Una sola
propuesta con todos los bloques**; si uno se traba, entregá el resto y avisá cuál faltó. Antes de decir
"terminé", pasá `docs/ANTES-DE-ENTREGAR.md`. Arrancá de la versión principal de hoy. Si la orden 176
todavía no está fusionada, **hacé ésta encima de la rama de la 176** (tocan los mismos archivos de la
portada) y entregalas juntas.

## Lo que el plan pedía y NO se hace (contradice decisiones del dueño)

- Cifras: quedan **"+200" eventos, "+7" años y "Clientes satisfechos" sin porcentaje** (`DEFAULT_STATS`,
  `src/components/landing/StatsSection.tsx` ~8). Nada de "+250", "+10" ni "100%".
- **No se usa la palabra "congelar"** en nada que vea un cliente: el dueño trabaja con ajuste anual. El
  paso 1 del método dice **"Reservás tu fecha con una seña"**.
- **No se promete** plazo de respuesta, "garantía", "24/7" ni precio sostenido.
- El reloj del simulador, las promociones y los descuentos: no se tocan.
- Las reseñas de clientes (`src/data/testimonials.json`): no se corrigen las palabras ni se borran.
  "María Rosario Volpi" tiene dos reseñas distintas, no una repetida.
- Los textos de los ayudantes: "Bogue" ya pasa a "Vogue" en la orden 176.

## Cómo está armada hoy (lo investigó Claude)

- `src/app/page.tsx` ~708-790 arma la portada con `LandingSpaContainer`
  (`src/components/landing/LandingSpaContainer.tsx`), que recibe un componente por casillero (`hero`,
  `stats`, `difference`, `services`, `technology`, `salon`, `team`, `gallery`, `blog`, `video`,
  `testimonials`, `faq`, `cta`) y les pone `id={`landing-${key}`}` (~línea 61). **Los enlaces del menú
  apuntan a esos `id`** (`#landing-gallery`, etc.): si cambiás o juntás casilleros, **mantené un `id`
  por cada ancla que hoy existe** (`grep -rn "landing-" src` antes de borrar ninguno) y la prueba
  `tests/e2e/el-enlace-a-la-galeria-baja-hasta-la-galeria.spec.ts` tiene que seguir en verde.
- Tecnología hoy son **tres** bloques seguidos en el casillero `technology` (`page.tsx` ~732-740):
  `LaAppDeTuFiestaSection`, `InteractiveTechShowcase` y `TechnologyExperienceSection` ("Tecnología útil —
  Menos coordinación. Más experiencia", `TechnologyExperienceSection.tsx` ~73-76).
- Consejos hoy son **dos**: "Guías útiles y consejos" adentro de `AkTeamStorySection.tsx` ~112-128, y
  "Consejos AK" en `BlogSection.tsx` ~34.
- Fotos y videos son dos secciones: `GallerySection` y `VideoSection` (cada una con su `Async...` en
  `page.tsx` ~391 y ~479).

## Bloque 1 - Nuevo orden de la portada: 9 bloques

En `LandingSpaContainer.tsx` (el `return`, ~líneas 75-135) dejá este orden:

1. **Hero + verificador de fecha** (`hero`). En `HeroSection.tsx`, debajo del título, una barra con:
   `Tipo de evento` (15 Años, Bodas, Sociales, Empresariales), `Mes y año estimado` (`<input type="month">`),
   `Cantidad aproximada de invitados` (número) y el botón **"Consultar disponibilidad de fecha"**. El botón
   lleva a `/simulador-de-presupuesto?tipo=<tipo>&guests=<n>&mes=<AAAA-MM>&entry=hero-fecha`. El simulador
   ya lee `tipo` y `guests` (`src/app/simulador-de-presupuesto/page.tsx` ~267-269, `normalizePrefillEventType`
   ~255); sumá la lectura de `mes` para precargar la fecha tentativa (primer sábado de ese mes, editable)
   si el simulador tiene campo de fecha. En el celular, los campos van uno debajo del otro.
2. **Tipos de evento** (`services`): las tarjetas que ya están en `ServicesSection.tsx`.
3. **El valor de la tranquilidad + trayectoria**: `AkDifferenceSection` (ya compara AK contra proveedores
   sueltos) seguido de `StatsSection`. Es el casillero `difference` de hoy; queda en la posición 3.
4. **Salón Club Uruguay con ficha técnica** (`salon`): en `SalonDestacadoSection.tsx`, debajo de las fotos,
   una fila de íconos (lucide) con: capacidad (usa la prop `capacity` que ya recibe, `page.tsx` ~363; si no
   viene, no muestres ese ícono), "Pleno centro de Salto", "Climatización", "Recepción, salón principal y
   pista LED", "Cocina equipada para catering", "Personal de baños durante todo el evento". **Sin cifras
   inventadas**: sólo la capacidad, y sólo si viene del dato del salón.
5. **Ecosistema tecnológico unificado** (`technology`): **un solo bloque**. Queda `LaAppDeTuFiestaSection`
   (la demo) y abajo `InteractiveTechShowcase` (las estaciones, ver bloque 2). **Sacá
   `TechnologyExperienceSection` de la portada**: antes de borrarlo, pasá a `LaAppDeTuFiestaSection` lo que
   tenga de único (algún texto o beneficio que no esté repetido). El archivo puede quedar si otra pantalla
   lo usa (`grep -rn "TechnologyExperienceSection" src`); si nadie más lo usa, borralo.
6. **Galería unificada** (`gallery`): un componente nuevo `GaleriaUnificadaSection.tsx` con tres pestañas:
   **"Fotos de montajes"** (lo de `GallerySection`), **"Videos de fiestas reales"** (lo de `VideoSection`) y
   **"Video-testimonios"** (los videos de `src/lib/youtube/ak-channel.ts` cuya categoría o título indique
   testimonio; si no hay ninguno, la pestaña no aparece). Reusá `GallerySection` y `VideoSection` adentro de
   las pestañas en vez de copiarlos. Mantené el "Ver más" de a 12 que ya tiene la galería
   (`GallerySection.tsx` ~180-181, ~376). El `id` `landing-gallery` queda en este bloque y el de videos
   (`id="videos"`, `page.tsx` ~450) también, apuntando a la pestaña de videos.
7. **Prueba social + método en 3 pasos** (`testimonials`): las reseñas (`TestimonialsSection`), con los
   video-testimonios al lado si existen, y debajo el esquema de 3 pasos: **"1. Reservás tu fecha con una
   seña" → "2. Plan de pagos mensuales a tu medida" → "3. Ajuste final de invitados 15 a 30 días antes"**.
   Debajo del nombre de cada reseña, el tipo de evento: ya viene en `fiestaNombre` de cada testimonio.
8. **Preguntas frecuentes + guías** (`faq`): `FAQSection` y, abajo, **un solo** carrusel de artículos
   (`BlogSection`). **Sacá "Guías útiles y consejos" de `AkTeamStorySection.tsx` (~112-128)**; el equipo se
   queda con su parte de equipo y método. El ancla `landing-blog` tiene que seguir llevando a los artículos.
9. **Cierre** (`cta`): `CTASection` con el simulador y el calendario. Abajo, el pie de página.

`AkTeamStorySection` (equipo) puede ir entre el 3 y el 4 o adentro del 3; no lo saques. **No dejes
casilleros vacíos** ni secciones repetidas.

## Bloque 2 - Estaciones: "Tótem Touch IA" y tres grupos

`src/components/public/InteractiveTechShowcase.tsx` (lista `STATIONS` ~43, pestañas ~234-253):

- **Agregá la estación "Tótem Touch IA"** con el distintivo **"Exclusivo con IA"**: transforma la foto del
  invitado en personajes y estilos con inteligencia artificial. Es la estación `touchpix` de la app
  (`src/app/evento/touchpix/[fiestaId]/page.tsx`, temas `TOUCHPIX_THEMES` ~65 y personajes
  `FACE_SWAP_CHARACTERS`). Mostrá un **"Antes / Después"**: dos imágenes lado a lado. Usá fotos que ya estén
  en `public/` (buscá con `ls public/media`); si no hay un par real, una foto de ejemplo y la misma con un
  filtro de estilo hecho con CSS, rotulado "Ejemplo".
- **Agrupá las estaciones en 3 filtros** en lugar de 9 pestañas sueltas:
  - **Impacto visual y viral**: Tótem Touch IA, Plataforma 360, Vogue (Boomerang y GIFs), Espejo mágico,
    Fotocabina impresa.
  - **Emoción y recuerdos**: Buzón de recuerdos (teléfono retro, audio) y Video de vida.
  - **Interacción en pista**: Muro social en pantalla gigante, tótems de barra, invitación digital con QR.
  Primero se elige el grupo (3 botones grandes que entran en el celular sin desplazarse de costado) y
  después la estación. Si alguna estación de las que nombra el plan no existe hoy en `STATIONS`, sumala sólo
  si la app la tiene de verdad (buscá su pantalla en `src/app/evento/`); si no existe, no la inventes y
  avisá.
- En cada tarjeta, el botón **"Incluir en mi simulación"**, que lleva a
  `/simulador-de-presupuesto?extra=<id del servicio>`. Los ids son los de `src/data/servicios-empresa.json`
  (por ejemplo `serv_espejo_magico_ia` para el Tótem Touch IA, `serv_bogue`, `serv_espejo_magico`); buscá el
  de cada estación ahí y, si una estación no tiene servicio, no le pongas el botón.

## Bloque 3 - El simulador acepta el extra y muestra "Tótem Touch IA"

- `src/app/simulador-de-presupuesto/page.tsx`: leé `searchParams.get('extra')` (junto a los otros, ~267). Si
  ese id existe en `serviciosCatalogo` (se carga ~465 con `getPublicSimulatorBootstrap()`), sumalo a los
  servicios elegidos al llegar a la etapa de extras, como si el visitante lo hubiera buscado. Si no existe,
  se ignora sin error.
- El servidor ya acepta cualquier id existente (`src/lib/budget/public-simulator-persistence.ts` ~232-244):
  **no lo toques**.
- **No cambies precios.** El servicio de IA ya existe: `serv_espejo_magico_ia`, $4.990. Su nombre visible
  pasa a **"Tótem Touch IA (personajes y estilos con inteligencia artificial)"** en
  `src/data/servicios-empresa.json` ~422. Como el catálogo vivo está en la base, además mostrá ese nombre
  en el simulador con un mapa `NOMBRE_VISIBLE_POR_ID` (`{ serv_espejo_magico_ia: 'Tótem Touch IA ...' }`)
  que se aplique al listar; el id no cambia. Y que la búsqueda encuentre el servicio escribiendo "IA",
  "tótem" o "touch".

## Bloque 4 - Los botones: dos textos

En la portada y su menú, todos los botones de "cotizar" pasan a uno de estos dos:

- Principal (lleva al simulador): **"Simular mi presupuesto"**.
- Secundario (abre WhatsApp): **"Consultar disponibilidad por WhatsApp"**.

Los que hay hoy, verificados: `HeroSection.tsx` ~41 ("Hablar con AK") y ~43 ("Cotizar mi fiesta");
`page.tsx` ~720 (`simulatorLabel="Proyectar mi fiesta"`); `ServicesSection.tsx` ~239 ("Cotizar mi fiesta");
`LaAppDeTuFiestaSection.tsx` ~279 ("Simular presupuesto"); `LandingNav.tsx` ~145 y ~199 ("Cotizá tu
Fiesta"); `CTASection.tsx` ~40 ("¡Cotizá tu evento!", y `page.tsx` ~777 le pasa
`landingSettings.cta.ctaLabel`: cambiá el valor por defecto en `src/types/landing-editor.ts` y, si el
editor de la portada permite cambiarlo, dejá que el dueño lo siga pudiendo cambiar);
`SalonDestacadoSection.tsx` ~96 ("Cotizar una fiesta"). En el menú del celular, si "Consultar
disponibilidad por WhatsApp" no entra, el botón puede decir "Consultar por WhatsApp".

## Bloque 5 - Pie de página y datos para Google

- `src/components/public-footer.tsx`: dos enlaces a `/login` (~235 "Acceso Staff & Equipo AK" y ~311
  "Acceso Staff"). **Dejá sólo el de abajo (~311)**, chico y discreto.
- `src/app/page.tsx` ~673-700 (`jsonLd`): hoy es sólo `EventVenue`. Pasalo a un `@graph` con dos nodos:
  - `LocalBusiness` (mejor `EventPlanner` si lo acepta el validador; si no, `LocalBusiness`): "AK
    Producciones", la misma dirección, teléfono y redes que hoy, `areaServed`: Salto y litoral de Uruguay
    (`[{"@type":"City","name":"Salto"},{"@type":"AdministrativeArea","name":"Litoral de Uruguay"}]`),
    `hasOfferCatalog` con tres servicios: fiestas de 15, bodas, eventos empresariales y sociales.
  - `EventVenue`: "Salón Club Uruguay", con la dirección que ya tiene.
  Nada de calificaciones, precios ni cifras que no estén ya en la página.

## Bloque 6 - Fotos livianas

La galería ya usa `next/image` (carga diferida por defecto) y "Ver más" de a 12. **Sacá `priority`** de las
imágenes que no se ven al abrir la página (`GallerySection.tsx` ~55, ~67 y ~426: sólo la primera foto
visible puede tener `priority`). No hace falta convertir archivos: `next/image` ya los entrega en formatos
modernos.

## Pruebas (qué tienen que comprobar)

- `tests/e2e/la-portada-nueva.spec.ts` (celular 390 px y escritorio):
  - las anclas de hoy siguen existiendo y llevan a su bloque (`#landing-gallery`, `#landing-blog`, `#videos`);
  - **hay un solo bloque de consejos y uno solo de tecnología** (no aparece "Tecnología útil" ni "Guías
    útiles y consejos");
  - la barra del hero lleva al simulador con `tipo` y `guests` en la dirección, y el simulador muestra ese
    tipo y esa cantidad;
  - la galería tiene las pestañas "Fotos de montajes" y "Videos de fiestas reales";
  - la pestaña de estaciones muestra los 3 grupos, y "Tótem Touch IA" con "Exclusivo con IA";
  - "Incluir en mi simulación" del Tótem Touch IA llega al simulador con el servicio ya sumado;
  - ningún botón de la portada dice "Cotizá", "Cotizar", "Proyectar" ni "Hablar con AK";
  - la página no dice "+250", "+10", "100%" ni "congel".
- **La maquetación cambia a propósito**: regenerá la línea base de `tests/e2e/layout-baseline.spec.ts`
  siguiendo cómo se hace en ese archivo, y decilo en la entrega.
- `src/__tests__/datos-para-google-de-la-portada.test.ts`: el JSON-LD tiene `areaServed` con Salto y un
  nodo `EventVenue` y otro de negocio.

```comprobar
usa: Consultar disponibilidad de fecha en src/components/landing/HeroSection.tsx
usa: Tótem Touch IA en src/components/public/InteractiveTechShowcase.tsx
usa: Exclusivo con IA en src/components/public/InteractiveTechShowcase.tsx
usa: mi simulación en src/components/public/InteractiveTechShowcase.tsx
usa: searchParams.get('extra') en src/app/simulador-de-presupuesto/page.tsx
usa: areaServed en src/app/page.tsx
usa: Reservás tu fecha en src/components/landing/TestimonialsSection.tsx
no-usa: TechnologyExperienceSection whatsappNumber en src/app/page.tsx
no-usa: Guías útiles y consejos en src/components/landing/AkTeamStorySection.tsx
no-usa: Proyectar mi fiesta en src/app/page.tsx
no-usa: Cotizar una fiesta en src/components/landing/SalonDestacadoSection.tsx
no-usa: Cotizá tu Fiesta en src/components/landing/LandingNav.tsx
no-usa: Hablar con AK en src/components/landing/HeroSection.tsx
usa: Simular mi presupuesto en src/components/landing/ServicesSection.tsx
no-usa: Cotizar mi fiesta en src/components/landing/LaAppDeTuFiestaSection.tsx
no-usa: Cotizá tu evento en src/components/landing/CTASection.tsx
no-usa: Acceso Staff & Equipo AK en src/components/public-footer.tsx
usa: +200 en src/components/landing/StatsSection.tsx
archivo: src/types/landing-editor.ts
prueba: tests/e2e/la-portada-nueva.spec.ts
prueba: src/__tests__/datos-para-google-de-la-portada.test.ts
```
