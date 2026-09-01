# Orden 26 — La web de venta se rompe por dentro

**Para Gemini. Escrita el 31 de agosto de 2026. URGENTE: lo ve un prospecto.**

## Qué pasa, y está comprobado

**El recorrido de las 353 pantallas encontró 16 pantallas con el mismo error interno de React
(#310).** Varias son de la web de venta: `/blog`, `/blog/[slug]`, `/landing`,
`/landing/xv-anos`, `/presentacion`, `/public`, `/portal-cliente`, `/prospectos`, `/evento`,
`/evento/actual`, `/album/[fiestaId]`, `/invitado/[fiestaId]/[invitadoId]`,
`/proveedor/[id]`, `/catalogo/[tipo]` (#419) y `/configuracion/backup-final`.

**Ya se descartó que sea un problema del recorrido.** Se escribió
`tests/e2e/la-web-de-venta-no-se-rompe.spec.ts`, que abre `/blog`, `/landing` y `/presentacion`
**cada una sola, en su propia ventana**, y **las tres fallan igual**. O sea: **es real**, no es
que el recorrido le eche la culpa a la pantalla equivocada.

**Esa prueba es tu punto de partida: hacela pasar.**

## Lo que YA se descartó, para que no lo busques de nuevo

- **No es el armazón de la app** (`src/components/app-shell.tsx`). Corta temprano en la línea
  310 con `if (isSpecialRender) return ...`, **pero no hay ningún gancho de React después de
  ese corte**, así que no es la causa.
- **No es una pantalla sola:** son 16 muy distintas entre sí, así que **hay una causa común**.
  Buscala en lo que comparten: el diseño raíz (`src/app/layout.tsx`), los proveedores que
  envuelven la app, o algún componente que usan todas.

## Qué significa el error, en criollo

El error #310 de React es **"se ejecutaron más ganchos que en el dibujado anterior"**. Pasa
cuando un componente llama a un gancho (`useState`, `useEffect`, `useMemo`...) **adentro de un
`if`, después de un `return` temprano, o dentro de un bucle**. En un dibujado hay 5 ganchos y
en el siguiente 6, y React se cae.

**Lo típico:** un componente que hace `if (algo) return null;` **antes** de llamar a sus
ganchos.

## Cómo se busca

1. Corré la prueba y mirá qué componente aparece en el error sin minificar
   (`npm run dev` y abrí `/blog`: en desarrollo el error dice el nombre del componente).
2. Buscá en ese componente ganchos **después** de un `return`, adentro de un `if`, o dentro de
   un `map`.
3. La regla de React: **todos los ganchos, siempre, arriba de todo y en el mismo orden**. Si
   hace falta cortar, se corta **después** de llamarlos.

## CÓMO SE ENTREGA

**UNA SOLA PROPUESTA.** Antes de entregar: **`npm run "publicar?"` completo en verde**, y que
`tests/e2e/la-web-de-venta-no-se-rompe.spec.ts` **pase**.

**Ampliá esa prueba con las otras pantallas de la lista** una vez que arregles la causa: si es
una sola, se arreglan todas juntas.

## LO QUE NO SE TOCA

- **No cambies la prueba para que pase.** La prueba está bien y lo que falla es la app.
- **No toques los textos de venta ni los precios**: son decisiones comerciales del dueño.
- **Plata, cobros, comida y permisos: los hace Claude.**

---

## LO QUE YA SE INVESTIGO (1 de septiembre de 2026). NO LO REPITAS.

**Se reprodujo el error con el mensaje completo**, levantando la app en modo desarrollo y
abriendo `/blog`. Dice, textual:

    Error: Rendered more hooks than during the previous render.
      at updateMemo ... at Object.useMemo
      at Router (next/dist/client/components/app-router.js:170)

**O sea: el gancho que falla esta adentro del enrutador de Next**, no en una pantalla nuestra.
Eso descarta que sea una pantalla suelta y explica por que son 16 a la vez.

### Descartado, uno por uno, mirando el codigo

- **El armazon de la app** (`src/components/app-shell.tsx`): corta temprano en la linea 310,
  **pero no hay ningun gancho despues de ese corte.** No es.
- **El asistente virtual** (`src/components/public/AsistenteVirtual.tsx`): corta en la linea 76
  con `if (!hasFetchedSettings || ...) return null`, **y tampoco hay ganchos despues.** No es.
- **Dos copias de React conviviendo** (era la sospecha mas fuerte, porque el Salon 3D falla por
  algo parecido): **hay una sola**, `react@18.3.1`, sin copias fisicas duplicadas. No es.

### La pista que queda, y es la buena

**Justo antes del error aparece esto en la consola:**

    Error cargando ajustes del asistente: TypeError: Failed to fetch

Es una llamada al servidor que **falla**, y el error de React aparece **inmediatamente
despues**. La sospecha es que **el enrutador de Next se vuelve a dibujar distinto cuando una
llamada al servidor falla**, y ahi cambia la cantidad de ganchos.

**Por donde seguir:**

1. Que esa llamada **no falle nunca en silencio**: que el asistente atrape el error y no dispare
   un redibujado del enrutador.
2. Probar si con eso arreglado el error desaparece en las 16 pantallas.
3. Si desaparece, **la causa era esa** y se arregla en un solo lugar.

### UNA ADVERTENCIA IMPORTANTE ANTES DE TOCAR NADA

**Puede que esto NO le pase a un visitante real.** En el entorno donde se probo, **las llamadas
hacia afuera fallan siempre** (`ERR_TUNNEL_CONNECTION_FAILED`), y es justo una llamada fallida
la que dispara el error.

**Lo primero, entonces:** abrir `/blog` en la web publicada, de verdad, y mirar la consola del
navegador. **Si ahi no aparece, el problema es del entorno de prueba y no de la app**, y se
anota en `docs/YA-RESUELTO.md` como falso positivo en vez de tocar codigo.

**Esa comprobacion va primero. No arregles nada antes de hacerla.**
