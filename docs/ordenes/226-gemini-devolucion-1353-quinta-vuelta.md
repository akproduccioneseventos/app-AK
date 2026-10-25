# Orden 226 — Devolución de la propuesta 1353 (quinta vuelta, 24/10/2026)

**Para Gemini. Seguí en la misma propuesta 1353**, rama `gemini/ordenes-180-195`. Primero traé y fusioná
`claude/app-debug-stabilize-m70e6z`. Si un bloque se traba, entregá el resto en la misma propuesta y avisá
cuál faltó.

## Qué está bien y no se toca

La entrega `917a98e32` compila (`tsc` en cero), las 862 suites de Jest pasan, no hay acentos rotos y las
órdenes 196, 202, 212, 214, 217 y 220 a 225 figuran HECHA. **No rehagas nada de eso.**

## Por qué vuelve

`npm run "publicar?:rapido"` frena en el paso **"Lo que se dijo es lo que es"**: tocaste cinco pantallas que
no tienen ninguna prueba, y la prueba de realidad aumentada sólo usa `toBeVisible`. La orden 224 no lo
avisó: fue un descuido de la orden, no tuyo. Se arregla con pruebas, sin cambiar las pantallas.

## Bloque 1 — una prueba de navegador para las cinco pantallas

Archivo nuevo: `tests/e2e/las-pantallas-no-quedan-cargando.spec.ts`. Usá `ponerSesionDelEquipo` de
`tests/e2e/helpers/fiesta-de-prueba.ts` para entrar como equipo. Comprobá **el resultado con el texto**
(`toHaveText` / `toContainText` sobre un `getByRole('heading')`), y que la ruedita ya no esté
(`expect(page.locator('.animate-spin')).toHaveCount(0)`). **No uses `toBeVisible` como única
comprobación.**

- `/fiestas/nueva/carta-tragos?fiestaId=fiesta-que-no-existe` → el aviso de que la fiesta no se encontró
  o no se pudo cargar (el texto que pusiste en `carta-tragos/page.tsx`).
- `/fiestas/nueva/modulo-invitado?fiestaId=fiesta-que-no-existe` → `Fiesta no encontrada`.
- `/settings/contratos/clausulas`, `/settings/whatsapp-templates` y `/settings/whatsapp` → en el entorno de
  pruebas cargan normal: comprobá el título de la pantalla con `toHaveText` y que no quede la ruedita.

## Bloque 2 — la prueba de realidad aumentada

En `tests/e2e/la-realidad-aumentada-carga-mindar.spec.ts`, cambiá las dos comprobaciones:

- `toBeVisible` del aviso → `await expect(page.getByText('Esta invitación todavía no tiene realidad aumentada')).toHaveCount(1, { timeout: 15000 })`;
- `not.toBeVisible` del cargando → `toHaveCount(0)`.

## Cómo se entrega

Corré la prueba nueva sola antes de subir (`npm run test:e2e:production -- tests/e2e/las-pantallas-no-quedan-cargando.spec.ts`
y la de realidad aumentada), y después `npm run "publicar?:rapido"` en verde. Pegá en la propuesta las últimas
líneas de las dos cosas.

```comprobar
prueba: tests/e2e/las-pantallas-no-quedan-cargando.spec.ts
usa: /fiestas/nueva/carta-tragos en tests/e2e/las-pantallas-no-quedan-cargando.spec.ts
usa: /fiestas/nueva/modulo-invitado en tests/e2e/las-pantallas-no-quedan-cargando.spec.ts
usa: /settings/contratos/clausulas en tests/e2e/las-pantallas-no-quedan-cargando.spec.ts
usa: /settings/whatsapp-templates en tests/e2e/las-pantallas-no-quedan-cargando.spec.ts
usa: toHaveCount(0) en tests/e2e/la-realidad-aumentada-carga-mindar.spec.ts
no-usa: toBeVisible en tests/e2e/la-realidad-aumentada-carga-mindar.spec.ts
```
