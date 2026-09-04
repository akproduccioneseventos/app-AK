# Orden 41 — Terminar todo lo que marca el panel

**Para Gemini. UNA SOLA PROPUESTA con todos los bloques.** Si un bloque se traba, entregá el
resto igual en la misma propuesta y decí cuál faltó y por qué. No abras una propuesta por bloque.

**Antes de empezar:** `git fetch origin && git checkout -b feat/orden-41 origin/main`. Arrancar de
una versión vieja fue la causa de tres entregas fallidas. **No trabajes sobre una rama con
propuesta ya fusionada.**

**Lo que NO se toca, y es importante:** el reloj del simulador, el ajuste anual del 15%, los
descuentos, los textos de venta, `apphosting.yaml`, nada de cobros ni de permisos. Y **nunca
reemplaces una biblioteca por un archivo vacío para que compile**: si algo no compila, decilo y
entregá el resto. Ya pasó y dejó la búsqueda por cara apagada sin que se notara.

---

## Bloque 1 — Fotocabina: lo que falta para igualar al rubro

Archivo: `src/app/evento/fotocabina/[fiestaId]/page.tsx` (componente `FotocabinaPage`, línea ~78).
Los ajustes de la estación viven en `fiesta.station`, del tipo
`EntertainmentStationRuntimeConfig` en `src/lib/entertainment/station-config.ts:13`. **Todo ajuste
nuevo se agrega ahí y se lee desde la pantalla**: un ajuste que nadie lee es peor que no tenerlo.

1. **Cambiar el fondo sin tela verde.** Hoy sólo funciona con tela: `aplicarChromaKey()` en
   `src/lib/entretenimiento/segmentacion-fondo.ts:32`, llamada desde la línea ~428 cuando
   `fiesta.station.enableChromaKey`. Falta el recorte por silueta, sin tela. El resto de la
   cadena ya está: `procesarFondoCanvas()` (mismo archivo, línea 72) y el estado `fondoVirtual`
   (línea ~105) ya eligen fondo. **Sólo falta el recorte.** Usá `@mediapipe/selfie_segmentation`
   o `@tensorflow-models/body-segmentation` — **y si agrega peso a la descarga inicial, cargalo
   sólo cuando el operador prende la opción**, no al abrir la pantalla.
2. **Boomerang / GIF y cámara lenta.** `mediaRecorderRef` ya existe (línea ~248): el video se
   graba. Falta reproducir al revés (boomerang) y a velocidad reducida. Ajuste nuevo en
   `station-config.ts`: `velocidadRecuerdo?: 'normal' | 'lenta' | 'boomerang'`.
3. **Marcos animados.** Los marcos fijos están en `FRAMES` y se filtran por
   `fiesta.station.marcosHabilitados` (línea ~844). Falta que un marco pueda moverse.
   `dibujarMarcoDinamico()` en `src/lib/entretenimiento/marcos-dinamicos.ts:24` **ya existe y lo
   usa el Bogue**: reusalo, no escribas otro.
4. **Firmar o dibujar sobre la foto.** El Espejo Mágico ya tiene un lienzo de dibujo:
   `drawingCanvasRef` en `src/app/evento/espejo-magico/[fiestaId]/page.tsx:122`. **Sacá eso a un
   componente compartido y usalo en las dos**, no lo copies.
5. **Armar el diseño de la impresión.** Hoy la hoja se arma fija en
   `src/lib/entretenimiento/imprimir-recuerdo.ts`. Falta que el operador elija la grilla: una
   foto grande, dos, o la tira de cuatro. Ajuste nuevo: `disenoImpresion?: 'una' | 'dos' | 'tira'`,
   leído en `imprimirRecuerdo()`. **Ojo: hay una prueba que ya cuenta las páginas**
   (`src/__tests__/la-fotocabina-imprime-lo-que-se-pide.test.ts`) — no la rompas, ampliala.

## Bloque 2 — Plataforma 360

Archivo: `src/app/evento/plataforma-360/[fiestaId]/page.tsx` (componente `Plataforma360Page`,
línea ~53). El video se graba con `mediaRecorderRef` (línea ~65) y **la música ya está a medias**:
`customAudioUrl` (línea ~98), `customAudioRef` (línea ~100) y `selectCustomAudio()` (línea ~138).

1. **Música sobre el video.** Hoy la canción suena mientras se graba pero **no queda pegada al
   archivo**. Falta mezclarla en el video que se entrega. Usá el audio ya cargado en
   `customAudioRef`, no agregues otro selector.
2. **Cámara lenta** — el efecto de moda del rubro. Los cuadros ya se guardan en `capturedFrames`
   (línea ~99).
3. **Marco animado sobre el video** — reusá `dibujarMarcoDinamico()`.
4. **Cortina de entrada y de salida** (un fundido al principio y al final).
5. **Elegir cuántas vueltas da** — ajuste nuevo en `station-config.ts`: `vueltas360?: number`.

## Bloque 3 — Bogue y Espejo Mágico

- **Bogue** (`src/app/evento/bogue/[fiestaId]/page.tsx`, componente `BoguePage` línea ~76):
  falta **elegir cuántos cuadros tiene el loop** (ajuste `cuadrosDelLoop?: number`). El fondo
  virtual (`fondoVirtual`, línea ~122) y el filtro de belleza ya están importados: **comprobá que
  se apliquen de verdad al recuerdo final** y, si no, engancharlos. No los reescribas.
- **Espejo Mágico** (`src/app/evento/espejo-magico/[fiestaId]/page.tsx`, línea ~102): falta
  **cambiar el fondo** —reusá `procesarFondoCanvas()`— y **el texto de marca junto al QR**: el
  campo `brandText` ya existe en `station-config.ts` y **no lo lee esta pantalla**.

## Bloque 4 — Decoración y pantalla gigante

- **Decoración** (`src/app/(app)/fiestas/nueva/decoracion/page.tsx`): que **cuente los invitados
  sola** a partir de la lista de la fiesta —`getGuestAdultsCount` y `getGuestKidsCount` en
  `src/lib/fiesta/guest-counts.ts` ya hacen la cuenta, usalos— y que **avise si un elemento de
  decoración ya está usado** en otra fiesta del mismo día.
- **Pantalla gigante** (`src/app/evento/muro-en-vivo/[fiestaId]/page.tsx`, componente
  `MuroEnVivoPage` línea ~51): hoy el fondo se arma con un degradado de `config.accentColor`.
  Falta **poder elegir un fondo** de una lista. Y en la moderación
  (`src/app/evento/moderacion/[fiestaId]/page.tsx`, `moderateSocialPost` línea ~67), falta que
  **ordene sola lo dudoso primero** en vez de dejar todo mezclado.

## Bloque 5 — Álbum del recuerdo

Pantalla: `src/app/evento/album/[fiestaId]/page.tsx`. Armador: `src/lib/album/armar-album.ts`.
La selección automática ya llegó en `src/lib/album/elegir-las-mejores.ts`: **no la rehagas**.

Falta **bajar todo junto**. El endpoint público que ya existe es
`src/app/api/social-gallery/[fiestaId]/download/route.ts`. **NO uses
`/api/fiestas/[fiestaId]/download-recuerdos`: ése pide sesión de administrador** y desde la
pantalla del cliente devuelve un error de acceso. Ya pasó.

## Bloque 6 — Que las pruebas no llamen "rota" a una pantalla que está bien

`tests/e2e/recorrido-de-pantallas.spec.ts` visita 357 pantallas **sin parámetros** y marca como
rotas once que están correctas: `/portal/mesas` pide `?fiestaId` y avisa bien que falta;
`/prospectos` manda a iniciar sesión, que es lo correcto; `/proveedor/acceso/token_demo_123` dice
que el acceso no existe, que es lo correcto.

**Lo que hay que hacer:** que el recorrido las visite **con un enlace válido** —la fiesta de
prueba de `tests/e2e/helpers/fiesta-de-prueba.ts` ya existe— y que una pantalla que **avisa
correctamente que falta un dato no cuente como rota**. Una pantalla rota es la que se queda en
blanco o tira un error de React, no la que explica qué falta.

---

## Cómo se comprueba que está hecho

Cada línea de abajo se verifica sola con `npm run ordenes?`. **Ojo con lo que ya salió mal dos
veces: la comprobación pide el RESULTADO, no el ingrediente.** Que una biblioteca aparezca en un
archivo no dice que la pantalla haga nada.

**Y cada bloque necesita una prueba de navegador que mire el resultado en pantalla**, no un nombre
buscado en el código. Las pruebas de las estaciones ya existen y son el modelo a seguir:
`tests/e2e/las-estaciones-respetan-los-ajustes.spec.ts`.

```comprobar
usa: velocidadRecuerdo en src/lib/entertainment/station-config.ts
usa: velocidadRecuerdo en src/app/evento/fotocabina/[fiestaId]/page.tsx
usa: disenoImpresion en src/lib/entretenimiento/imprimir-recuerdo.ts
usa: disenoImpresion en src/app/evento/fotocabina/[fiestaId]/page.tsx
usa: dibujarMarcoDinamico en src/app/evento/fotocabina/[fiestaId]/page.tsx
usa: vueltas360 en src/app/evento/plataforma-360/[fiestaId]/page.tsx
usa: customAudioRef en src/app/evento/plataforma-360/[fiestaId]/page.tsx
usa: cuadrosDelLoop en src/app/evento/bogue/[fiestaId]/page.tsx
usa: brandText en src/app/evento/espejo-magico/[fiestaId]/page.tsx
usa: procesarFondoCanvas en src/app/evento/espejo-magico/[fiestaId]/page.tsx
usa: getGuestAdultsCount en src/app/(app)/fiestas/nueva/decoracion/page.tsx
usa: social-gallery en src/app/evento/album/[fiestaId]/page.tsx
prueba: tests/e2e/la-fotocabina-tiene-todo.spec.ts
prueba: tests/e2e/las-estaciones-respetan-los-ajustes.spec.ts
```
