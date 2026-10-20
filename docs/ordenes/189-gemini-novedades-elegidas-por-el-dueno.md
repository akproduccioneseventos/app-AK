# PARA GEMINI - Orden 189: las novedades que eligió el dueño (de las propuestas 1330, 1331, 1332, 1334 y 1335)

**Una sola propuesta con todos los bloques.** Si un bloque se traba, entregá el resto igual en la misma
propuesta y avisá cuál faltó. Antes de decir "terminé", pasá `docs/ANTES-DE-ENTREGAR.md` entero.

**Arrancá de la rama `claude/app-debug-stabilize-m70e6z` de hoy**, después de entregar la orden 188 (y
encima de ella). **No fusiones ni copies enteras las ramas viejas**: las cinco salieron de una versión
principal vieja y traen 260 a 295 archivos cada una, con cosas ya hechas o descartadas. Usalas **sólo como
referencia**, sacando el archivo que se nombra con `git show <commit>:<archivo>`. Las cinco propuestas se
cierran cuando entre ésta.

| Propuesta | Rama | Commit con lo nuevo |
|---|---|---|
| 1330 | `feat/estetica-marketing-automatizacion-redes` | `c7f9e3e6f` |
| 1331 | `feat/play-store-twa-y-pwa-pc` | `f9fe10632` |
| 1332 | `feat/innovacion-webar-selfie-trivia-ia` | `620b4d7ea` |
| 1334 | `feat/maxima-innovacion-5-pilares-ak` | `da9b8b902` |
| 1335 | `feat/centro-redes-presencia-tiempo-real` | `228c11887` |

## Bloque 1 — estética y marketing (de `c7f9e3e6f`)

- **Pantalla gigante:** `src/app/evento/muro-en-vivo/[fiestaId]/page.tsx`. La foto llena la pantalla en
  16:9 y lo que sobra se completa con la misma foto difuminada, nunca con franjas negras.
- **Sello "hecho con AK":** en `src/app/evento/album/[fiestaId]/page.tsx`, en
  `src/app/(app)/fiestas/[id]/video-recuerdo/video-recuerdo-client.tsx`, en
  `src/app/evento/barra/[fiestaId]/page.tsx` y en `invitacion-publica-client.tsx`. Discreto y con enlace
  a la portada.
- **Plantillas de marketing con datos reales:** `src/lib/marketing/marketing-hub.ts` y
  `src/app/marketing/page.tsx`. Si falta un dato, la plantilla lo dice; **no inventa cifras**. Las
  únicas cifras permitidas son "+200" eventos y "+7" años.
- **Publicación automática con videos:** `src/app/actions/social-media.ts`. Lo que ya publica fotos solo,
  también publica videos.
- **Asistente dorado y en voseo:** `src/components/concierge/ConciergeWidget.tsx`.
- **Títulos en la cabecera del panel:** `src/components/app-shell.tsx`.
- **NO traer:** el botón de WhatsApp para invitados en el hub. Escribirían todos al número personal del
  dueño. Tampoco las cabeceras impresas: ya están en la orden 178.

## Bloque 2 — la app instalable: Play Store, computadora, Android y iPhone (de `f9fe10632`)

- `public/manifest.json`, tal como lo dejó la 1331 (listo para Play Store).
- `PwaInstallButton` (`src/components/pwa-install-button.tsx`) en el portal (`src/app/portal/page.tsx`)
  y en el hub del invitado.
- **iPhone:** Safari no ofrece el aviso de instalar (`beforeinstallprompt` no existe ahí). Si el navegador
  es Safari de iPhone o iPad y la app no está instalada, el botón muestra la guía en dos pasos, con dibujo:
  "Tocá Compartir" y "Agregar a inicio". **No hay versión para la tienda de Apple: decisión del dueño.**
- **Play Store:**
  - Dejá `public/.well-known/assetlinks.json` con el paquete `uy.akproducciones.app`, y el lugar de la
    huella marcado con `REEMPLAZAR_HUELLA_PLAY`.
  - Dejá en `docs/GUIAS-PLAY-STORE-Y-PC.md` los pasos que hace una persona: pagar la cuenta, unos 25
    dólares una vez, y subir el paquete.
  - **No publiques nada en la tienda.**

## Bloque 3 — juegos y recuerdos del invitado (de `620b4d7ea`)

- **Búsqueda por selfie:**
  - `src/lib/caras/extractor-facial.ts` y su uso en `src/app/evento/galeria/[fiestaId]/page.tsx`.
  - Los modelos ya están en `public/models/caras/` y la biblioteca `@vladmandic/face-api` ya está
    instalada.
  - Se carga **sólo** cuando el invitado toca "Buscarme".
  - **No borres** `src/__tests__/las-caras-distinguen-personas.test.ts`. Tiene que seguir pasando.
- **Cámara descartable:**
  - Usá la de `src/app/evento/descartable/[fiestaId]/page.tsx`: 12 fotos por invitado, que se ven
    recién al día siguiente.
  - **No** traigas la segunda versión (`CamaraDescartableModal` de `228c11887`).
  - La fecha de "al día siguiente" se cuenta en hora de Uruguay (pregunta 70).
- **Trivia con IA — rehacela, no la copies.**
  - Lo que trae `generarTriviaConIa` en `src/app/actions/games.actions.ts` (~241) **no usa IA**: son
    preguntas fijas con respuestas "correctas" inventadas, como "¿Quién dijo te amo primero? → El novio".
    Eso no va.
  - Lo correcto:
    - Las preguntas las genera Gemini, con el modelo gratis de `src/ai/genkit.ts`, a partir de lo que
      el cliente cargó de su historia.
    - Antes, mirá `hayPresupuestoParaIA()` y después anotá el gasto con `registrarConsumoIA()`, los dos
      de `src/lib/ai/consumo-servidor.ts`.
    - **La respuesta correcta la confirma el equipo** antes de jugar.
    - Si no hay datos del cliente, la trivia es de cultura general de fiestas, no de la pareja.
- **Recepción inteligente:** no traerla. Ya está en la orden 181.

## Bloque 4 — realidad aumentada de verdad (el dueño la aprobó el 19/10/2026)

Lo que trae `src/app/evento/ar/[fiestaId]/page.tsx` en `620b4d7ea` **no es realidad aumentada**: es la
cámara con un dibujo encima. Lo que pidió el dueño es otra cosa: **el invitado apunta el celular a la
invitación impresa y sobre el papel aparece un video.**

- Biblioteca gratuita **MindAR** (paquete `mind-ar`, seguimiento de imagen). Se carga **sólo** en esa
  pantalla.
- **En el panel**, dentro de la invitación de la fiesta, va una sección "Realidad aumentada" con dos
  cosas:
  - **La imagen de la invitación impresa.** Si no suben una, se usa
    `fiesta.invitacionDigital?.cabecera?.imagenFondoUrl`.
  - **El video que aparece.**
  - Al guardar, la app arma sola el archivo de seguimiento con el compilador de MindAR en el navegador y
    lo sube junto a los otros archivos de la fiesta. Nada de pasos a mano.
- **El invitado** entra a `/evento/ar/[fiestaId]`, por el QR que se imprime en la invitación, apunta y
  ve el video encima del papel.
  - Si no hay cámara o no hay permiso, el cartel dice qué tocar.
  - Si la fiesta no tiene realidad aumentada preparada, lo dice y lleva al hub.
- Nada de esto se paga por mes. Si para algo hiciera falta un servicio pago, **parás y avisás**.

## Bloque 5 — el panel y la voz (de `da9b8b902`)

- **"Aprobar en un toque" en `src/app/(app)/mi-dia/page.tsx`:**
  - Toma el seguimiento de prospectos que trae.
  - Arma el enlace con `buildWhatsAppLink` de `src/lib/commercial/contact.ts`, **no** con la cuenta a
    mano del 598 (pregunta 72).
  - **El mensaje lo manda una persona tocando el botón**: nada sale solo.
- **Dictado por voz** en `src/app/simulador-ak/page.tsx` y en `ConciergeWidget.tsx`. Usa el
  reconocimiento de voz del navegador. Si el navegador no lo tiene, el micrófono no aparece.
- **NO traer:** `centro-unificado-redes-tab.tsx`, `src/app/actions/comentarios-redes.ts`,
  `src/lib/social-media/comments-backfill.ts` ni los cambios de `presencia-digital` y `redes-sociales`.
  Responden solos en redes, y el bot sólo contesta a quien llega por un anuncio (decisión del dueño).
  Tampoco el modo walkie-talkie ni la lista de regalos: el dueño no los eligió.

## Bloque 6 — Efecto Coldplay y armador de mesas (de `228c11887`)

- **Efecto Coldplay:** `src/app/actions/crowd-sync.ts` y `src/components/evento/CrowdSyncShow.tsx`.
  - Lo dispara el operador desde el centro de la fiesta (`src/app/(app)/fiestas/[id]/centro/page.tsx`),
    con permiso NOCHE.
  - Se ve en la pantalla gigante.
- **Armador de mesas:** `src/lib/fiesta/armador-mesas-inteligente.ts` (`armarMesasInteligente`).
  - Hoy no lo llama ninguna pantalla. Va un botón "Armar mesas solo" en
    `src/app/(app)/fiestas/nueva/invitados/page.tsx`.
  - Muestra la propuesta y, **recién cuando el equipo confirma**, guarda `tableNumber` (`src/types/fiesta.ts`
    ~51) en cada invitado.
  - Con turno: guardar no pisa lo que otro cambió mientras tanto (pregunta 22).
- **NO traer:** `CuatroPuertasHub` (choca con las 5 pestañas que eligió el dueño), `AudioGuestbookModal`
  (ya existe el buzón de recuerdos), `BrindisCruzadoModal` ni los cambios del centro de redes.

## Qué NO tocar

- Plata, cobros, permisos y la orden 183.
- Las cifras y textos de venta que ya decidió el dueño.
- Nada de "garantía", "24/7" ni "congelar" en lo que ve un cliente o un invitado.

## Prueba (que mire el resultado, no el ingrediente)

- `tests/e2e/la-pantalla-gigante-llena-la-pantalla.spec.ts`: en 1920x1080 la foto ocupa todo el alto y
  no hay franjas negras.
- `src/__tests__/la-trivia-usa-ia-y-no-inventa.test.ts`:
  - con el tope de IA agotado no llama a Gemini;
  - sin la confirmación del equipo, la trivia no arranca;
  - en ningún lado aparece la pregunta fija "¿Quién dijo".
- `src/__tests__/el-armador-de-mesas-no-guarda-sin-confirmar.test.ts`: armar no guarda nada, confirmar
  sí, y no pasa la capacidad de la mesa.
- `tests/e2e/iphone-ve-como-instalar.spec.ts`: con el navegador de iPhone, el botón muestra "Agregar a
  inicio".
- `src/__tests__/aprobar-en-un-toque-no-manda-solo.test.ts`: la pantalla arma el enlace con 598, y no hay
  ningún envío automático.

```comprobar
usa: extraerDescriptorFacial en src/app/evento/galeria/[fiestaId]/page.tsx
usa: mind-ar en src/app/evento/ar/[fiestaId]/page.tsx
usa: hayPresupuestoParaIA en src/app/actions/games.actions.ts
usa: armarMesasInteligente en src/app/(app)/fiestas/nueva/invitados/page.tsx
usa: CrowdSyncShow en src/app/evento/muro-en-vivo/[fiestaId]/page.tsx
usa: buildWhatsAppLink en src/app/(app)/mi-dia/page.tsx
usa: Agregar a inicio en src/components/pwa-install-button.tsx
archivo: public/.well-known/assetlinks.json
no-usa: Quién dijo en src/app/actions/games.actions.ts
prueba: src/__tests__/la-trivia-usa-ia-y-no-inventa.test.ts
prueba: src/__tests__/el-armador-de-mesas-no-guarda-sin-confirmar.test.ts
prueba: tests/e2e/la-pantalla-gigante-llena-la-pantalla.spec.ts
prueba: tests/e2e/iphone-ve-como-instalar.spec.ts
prueba: src/__tests__/aprobar-en-un-toque-no-manda-solo.test.ts
```
