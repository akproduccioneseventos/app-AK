# Orden 89 — La inteligencia artificial no frena la fila, y la barra no ofrece lo agotado

**Para Gemini. UNA SOLA PROPUESTA con los dos bloques.** Arrancá de la versión principal
actualizada. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md` y corré tus pruebas de
navegador. Si un bloque se traba, entregá el otro en la misma propuesta y decí cuál faltó.

**De dónde sale:** Codex propuso doce bloques el 25 de septiembre. El dueño pidió mandar **sólo lo
que suma**. Claude los revisó contra el código y quedaron dos:

- **Ya existían, y no se mandan:** la música y el marco del 360 ya quedan grabados en el archivo
  (`captureStream` más audio en `src/app/evento/plataforma-360/[fiestaId]/page.tsx`, ~línea 499).
  La entrega separada de la captura ya la cubrió la orden 81.
- **No suman o cambian lo que anda, y se descartaron:**
  - identidad visual y movimiento, porque tocan pantallas que funcionan;
  - rediseñar el mural;
  - tableros nuevos de cifras;
  - la vista previa de venta y los perfiles XV, boda y empresa;
  - auditorías y ensayos con equipos reales, que no los puede hacer una IA.

## Bloque 1 — La inteligencia artificial de la fotocabina no deja esperando al siguiente

**Qué pasa hoy:** en `src/app/evento/touchpix/[fiestaId]/page.tsx`, en la pestaña `faceswap`
(~líneas 502-545), la pantalla hace `setIsProcessing(true)` y **espera** a que vuelva
`applyFaceSwap(formData)`. Recién ahí aplica el marco y se puede subir. Mientras tanto la cabina
queda tomada: el invitado siguiente espera lo que tarde el proveedor. En la pestaña `ai_themes`
pasa lo mismo con `applyTouchpixTheme`.

**Qué se pide:**

1. Al capturar en `faceswap` o `ai_themes`, mostrale al invitado su foto **original** con el texto
   *"Tu foto con inteligencia artificial se está preparando. Va a aparecer en la galería de la
   fiesta en unos segundos: escaneá el código."* y el código de la galería que ya existe
   (`/evento/galeria/[fiestaId]`). **La pantalla queda libre** para la próxima captura.
2. El pedido a la IA sigue **en esa misma pantalla, en segundo plano**:
   - lista de trabajos pendientes en el estado (`trabajosIA`), cada uno con un identificador de
     captura (`capturaId`, por ejemplo `crypto.randomUUID()`);
   - **como máximo dos a la vez**; si hay dos andando, la tercera captura espera su turno y el
     invitado lo ve.
3. Cuando vuelve la IA, se sube el resultado con `uploadTouchpixPhoto` (~línea 806, la misma
   forma de armar el `formData`), con `guestId` si lo hay.
   - **Si la IA falla**, se sube la **original con el efecto local** (lo que hoy hace el
     `fallback`), y se dice que es el efecto local, nunca que es IA.
   - **Una captura, una sola subida:** guardá en un `Set` los `capturaId` ya subidos y no subas dos
     veces el mismo.
4. Si la pantalla se recarga con trabajos a medias, lo que no terminó se pierde. **No inventes
   una cola en el servidor**: eso se paga, y el dueño dijo que no. La original de cada captura ya
   queda guardada en el equipo por la orden 81.

**No toques:** `src/app/actions/touchpix-ai.ts` (`applyFaceSwap`, `applyTouchpixTheme`,
`uploadTouchpixPhoto`) ni el consentimiento (`consentAccepted`). Los consume la pantalla tal como
están.

## Bloque 2 — La barra muestra "Agotado" en vez de ofrecer lo que no hay

**Qué pasa hoy:** el servidor rechaza un trago sin stock
(`src/app/actions/fiesta/barra-tecnologica.actions.ts` ~línea 600: *"Ese trago figura sin stock
disponible."*). Pero `MiniQuiosco` (`src/app/invitacion/[fiestaId]/invitado/[guestId]/MiniQuiosco.tsx`,
~línea 191, `drinks.map`) lo muestra igual que los demás. El invitado lo elige, lo confirma y
recién ahí le dicen que no hay.

**Qué se pide:** si `drink.stockDisponible` viene y es `<= 0`, la tarjeta sale en gris con la
etiqueta **"Agotado"**, el botón para elegirlo desactivado y el trago **al final del carrusel**.
"Sugerirme uno" (`chooseRandomDrink`) no puede sugerir uno agotado. Lo mismo en la pantalla de la
barra, `BarraTecnologicaTouchPage`.

**No toques:** `createBarDrinkOrder`, el descuento de botellas ni nada de
`barra-tecnologica.actions.ts`. Es plata, de Claude.

## Qué tiene que comprobar cada prueba (resultado, no ingrediente)

- **Bloque 1** (`tests/e2e/89-ia-no-frena-la-fila.spec.ts`, con cámara falsa y la IA simulada
  lenta, 8 segundos):
  - el invitado A captura en `faceswap`; **antes de que vuelva la IA**, el botón de captura está
    habilitado y B puede sacar su foto;
  - cuando vuelve lo de A, se sube una sola vez;
  - con la IA fallando, se sube la original y la pantalla no dice "IA".
  - Rompela a propósito: con el `await` de antes, se tiene que poner en rojo.
- **Bloque 2** (`tests/e2e/89-la-barra-no-ofrece-lo-agotado.spec.ts`): con un trago de stock 0 en
  la carta de prueba, se ve "Agotado", no se puede elegir, y "Sugerirme uno" nunca lo trae (probar
  20 veces).

```comprobar
usa: trabajosIA en src/app/evento/touchpix/[fiestaId]/page.tsx
prueba: tests/e2e/89-ia-no-frena-la-fila.spec.ts
usa: Agotado en src/app/invitacion/[fiestaId]/invitado/[guestId]/MiniQuiosco.tsx
prueba: tests/e2e/89-la-barra-no-ofrece-lo-agotado.spec.ts
```
