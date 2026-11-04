# Orden 265 — Entretenimientos al nivel del rubro, y la pantalla gigante manejada desde el celular (03/11/2026)

**Para Gemini.** Va en la **misma** entrega que las órdenes 262, 263 y 264 (rama `gemini/orden-262-anuncio-al-simulador`).
Antes de decir "terminé", pasá `docs/ANTES-DE-ENTREGAR.md` y usá las skills `celular-primero` y `animaciones-pro`.

**Pedido del dueño (02/11/2026):** *"revisá todas las apps del mundo de los entretenimientos que tengo y armá lo que falta;
los controles de la pantalla gigante tienen que ser fáciles desde el celular en medio de la fiesta, y que funcione la
sincronización"*.

Claude comparó con el rubro: dslrBooth, Snappic, Touchpix, funEvent, Mirror Me, Walls.io, Kululu, Kahoot, Trivia Anywhere y
Waldo. Además **leyó lo que hace de verdad cada estación**. Lo de abajo está todo confirmado en el código.

## Bloque 1 — el control remoto de la pantalla gigante, en el celular

Hoy la pantalla se maneja desde `src/app/(app)/fiestas/nueva/muro-social/page.tsx`. Son 2.750 líneas pensadas para
computadora:

- botones de 36 px;
- "Play", "Pause", "Prev", "Next" y "Loop" en inglés;
- para poner un anuncio hay que bajar media página.

**Esa pantalla queda como está**, para preparar la fiesta. Se hace una pantalla nueva, **sólo para la noche**:
`/evento/control-pantalla/[fiestaId]` (`src/app/evento/control-pantalla/[fiestaId]/page.tsx`). Pensala para un celular con
una mano, a oscuras y apurado:

- **Fondo oscuro, botones de 56 px como mínimo y textos en castellano.** Nada chico.
- **Barra fija abajo:** "⏮ Anterior", "⏯ Pausar / Seguir" y "⏭ Siguiente". Usá las acciones que ya existen en
  `src/app/actions/fiesta/screen-mode.actions.ts`: `playScreenPlaylist`, `pauseScreenPlaylist`, `nextScreenItem` y
  `prevScreenItem`.
- **Arriba, qué se ve ahora:** el nombre del ítem en curso y si está en pausa. Que se refresque cada 2 segundos, como la
  pantalla gigante.
- **Botones grandes, de un toque:**
  - "Mostrar fotos del muro" y "Poner el video", con `goToScreenItem`.
  - "Anuncio rápido": un campo y "Mandar a la pantalla", con `updateLedMessage`. Sumá 4 frases listas: "¡A la pista!", "¡Se
    viene el vals!", "¡Brindis!" y "Sacate una foto en la cabina".
  - "Lanzar trivia" y "Terminar juego", con lo que ya usa la página de muro-social (~2203-2233).
  - "Sorteo": girar y mostrar al ganador, con lo que ya existe.
- **"Últimas fotos":** las últimas 6 aprobadas, cada una con "Ocultar" de un toque, usando `moderateSocialPost`. Abajo, un
  enlace a la moderación completa, `/evento/moderacion/[fiestaId]`.
- **Si una acción falla,** se dice en grande, "No llegó a la pantalla. Probá de nuevo", y el botón vuelve a su estado.
  Nada de "listo" si no se guardó.
- **Desde muro-social** se llega con un botón "Manejar la pantalla desde el celular" que muestra el QR de esta dirección,
  igual que el botón "Moderar desde el celular" que ya existe (~1175).

**Quién puede usarla:** pide `PERMISOS.NOCHE`, como la moderación. El invitado no entra.

## Bloque 2 — que dos operadores no se pisen (sincronización)

1. `updateSocialGallerySettings` (`src/app/actions/fiesta/portal.actions.ts:~270`) guarda **el objeto entero** que manda la
   pantalla. Con dos personas tocando, la segunda borra lo que puso la primera: un anuncio, el fondo o la playlist. Además
   pide sólo sesión.
   - Que pida `requireEventPermission(fiestaId, PERMISOS.NOCHE)`.
   - Que guarde **sólo los campos que cambiaron**: recibí un `cambios: Partial<SocialGallerySettings>` y mezclalo sobre lo
     guardado, **dentro de la transacción**. Usá `actualizarFiesta(fiestaId, fn)` (`src/lib/fiesta/actualizar-fiesta.ts`).
   - En muro-social, cada botón manda sólo lo suyo. Por ejemplo, `handlePlay` (~613) y `handlePlaylistItemToggle` (~708)
     no reenvían `settingsRef.current` entero.
2. `patchScreenMode` y `updateLedMessage` (`screen-mode.actions.ts:~55-175`) leen la fiesta afuera y después
   `saveFiesta(...)`. Pasalas a `actualizarFiesta(fiestaId, fn)` con la lectura **adentro**.

**Prueba:** en `src/__tests__/dos-operadores-no-se-pisan-la-pantalla.test.ts`, con una base de mentira que devuelve **copias**.

- Operador A pone un anuncio y operador B, a la vez, pasa al siguiente ítem: quedan las dos cosas.
- Se comprueba que la prueba **se pone en rojo** con el guardado viejo.

## Bloque 3 — lo que está prometido y no pasa

1. **El marco "animado" no se anima.** `dibujarMarcoDinamico` (`src/lib/entretenimiento/marcos-dinamicos.ts:18,37,99`)
   mueve brillos con `progresoAnimacion`, pero nadie se lo pasa, así que sale quieto. Pasale el avance del cuadro:
   - en la 360 (`plataforma-360/[fiestaId]/page.tsx:~605`), `frameIndex / frames.length`;
   - en la fotocabina (`fotocabina/[fiestaId]/page.tsx:~858`), el que corresponda.
2. **Fotocabina, boomerang con cuadros vacíos.** `fotocabina/[fiestaId]/page.tsx:~781-790` dibuja cada foto con
   `img.src = fUrl; drawImage(img…)` **sin esperar a que cargue**, así que los cuadros pueden salir negros. Esperá
   `await img.decode()` antes de `drawImage`.
3. **Vogue ignora el texto de marca.** `bogue/[fiestaId]/page.tsx:558` y `:712` escriben fijo "VOGUE LIVE". Usá
   `fiesta.station.brandText`, y si no hay, "AK Producciones".
4. **"Descargar y borrar" borra sin preguntar** (`muro-social/page.tsx:~1013`). Poné la misma confirmación que ya tiene
   "Borrar todas" (~1097), con la cantidad de fotos.

## Bloque 4 — lo que el rubro tiene y acá falta

1. **Espejo mágico: más animaciones con voz.** Hay 6 (`src/lib/entretenimiento/animaciones-con-locucion.ts`). Llevalas a
   **20**, en castellano rioplatense, para fiestas de 15, bodas y cumpleaños.
   - Cada una con su frase y su animación hecha con `framer-motion`, no sólo `animate-pulse`.
   - Que el operador elija cuáles usar y la estación las vaya alternando sola.
   - Sin nombres de personal y sin promesas.
2. **Trivia por mesas.** `TriviaEnVivo` (`src/components/games/TriviaEnVivo.tsx`) juega de a uno.
   - Sumá un modo "por mesas": el invitado elige su mesa al entrar y la pantalla muestra el podio por mesa.
   - Y una ronda lista: "¿Quién lo dijo, la quinceañera o la familia?" (en bodas, "¿él o ella?"), con preguntas que carga
     el operador.

## Pruebas

- **Navegador**, en `tests/e2e/control-de-pantalla-desde-el-celular.spec.ts`, a 390 de ancho:
  - con sesión del equipo, se ve la barra fija y todos sus botones miden 56 px o más;
  - tocar "Siguiente" cambia el ítem que la pantalla gigante (`/evento/muro-en-vivo/[fiestaId]`) muestra en menos de 5
    segundos;
  - un anuncio rápido aparece en la pantalla gigante;
  - no hay barra de desplazamiento hacia los costados.
- **Jest**, en `src/__tests__/la-fotocabina-boomerang-espera-las-fotos.test.ts`: los cuadros del boomerang no salen vacíos.
- **Jest**, en `src/__tests__/el-marco-se-anima.test.ts`: dos cuadros distintos dibujan el marco distinto.

Corré `npx tsc --noEmit` y `npx jest --silent` con cero errores, y pegá las últimas líneas. No subas `data/` ni `src/data/`.

```comprobar
archivo: src/app/evento/control-pantalla/[fiestaId]/page.tsx
usa: nextScreenItem en src/app/evento/control-pantalla/[fiestaId]/page.tsx
usa: updateLedMessage en src/app/evento/control-pantalla/[fiestaId]/page.tsx
usa: control-pantalla en src/app/(app)/fiestas/nueva/muro-social/page.tsx
usa: actualizarFiesta en src/app/actions/fiesta/screen-mode.actions.ts
usa: actualizarFiesta en src/app/actions/fiesta/portal.actions.ts
usa: progresoAnimacion en src/app/evento/plataforma-360/[fiestaId]/page.tsx
usa: decode() en src/app/evento/fotocabina/[fiestaId]/page.tsx
no-usa: 'VOGUE LIVE' en src/app/evento/bogue/[fiestaId]/page.tsx
prueba: tests/e2e/control-de-pantalla-desde-el-celular.spec.ts
prueba: src/__tests__/dos-operadores-no-se-pisan-la-pantalla.test.ts
prueba: src/__tests__/la-fotocabina-boomerang-espera-las-fotos.test.ts
prueba: src/__tests__/el-marco-se-anima.test.ts
```
