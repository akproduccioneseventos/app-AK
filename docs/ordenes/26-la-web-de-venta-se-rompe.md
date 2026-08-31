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
