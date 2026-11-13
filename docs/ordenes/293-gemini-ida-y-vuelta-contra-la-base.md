# Orden 293 — Lo que guarda se prueba contra la base de verdad: la ida y vuelta (13/11/2026)

**Para Gemini.** Va **en la misma entrega que las 284 a 292** (tu rama `gemini/ordenes-282-283-entrega-completa`).
**Una sola propuesta, sin fusionar.** Repasá `docs/ANTES-DE-ENTREGAR.md`, preguntas 88 a 100.

**Por qué (pedido del dueño, 13/11/2026: "pensá un método para que no suceda"):** la prueba funcional del auditor encontró
once acciones que decían "listo" sin haber guardado lo que decían. Las pruebas de Jest daban verde porque la base de
mentira se porta mejor que la real, o reemplaza justo la pieza donde estaba la falla.

**Lo que ya hizo Claude y no se toca:** el control `src/__tests__/lo-que-guarda-se-prueba-contra-la-base.test.ts` y la lista
`docs/ida-y-vuelta-pendientes.json` (108 acciones). Una acción nueva que guarda plata o comida, o que borra, sin prueba
contra la base no deja publicar; y una acción de la lista que ya tiene su prueba tiene que salir de la lista.

## Barrido en toda la app (Claude, 13/11/2026)

El control recorrió todas las acciones de `src/app/actions/` (y las funciones del mismo archivo que llaman): 108 guardan
plata, comida o borran y ninguna tiene una prueba contra la base. Son las de `docs/ida-y-vuelta-pendientes.json`.

## Cómo es una prueba de ida y vuelta (copiá el molde de `tests/firebase/estaciones-invitado-entrega-real.test.ts`)

- Vive en `tests/firebase/ida-y-vuelta-<area>.test.ts`. Corre con `npm run test:rules` (emulador de la base).
- **Sin** `AK_USE_LOCAL_JSON_ONLY` (`delete process.env.AK_USE_LOCAL_JSON_ONLY`): tiene que pasar por la base.
- De mentira **sólo** la sesión y el permiso (`@/lib/auth/require-session`, `next/headers`) y lo que sale a internet.
  **Nunca** `@/lib/data-service` ni `@/lib/firebase-sync`: ahí es donde estaban las fallas.
- Tres pasos: (1) cargar el dato inicial con `writeData`; (2) llamar a la **acción real**; (3) **volver a leer de la base**
  (`dbAdmin.collection(...).doc(...).get()` o `readData` después de borrar la copia local) y comprobar el estado final.
  Si la acción se puede deshacer (revertir, quitar, volver a "Ninguna"), hacer la vuelta y comprobar que quedó **igual
  que al principio**.
- Nunca `expect(result.success)` solo: siempre lo que quedó guardado.

## Bloque 1 — Primero, las once del auditor (P1)

En `tests/firebase/ida-y-vuelta-auditor.test.ts`: `revertPriceAdjustment` (+10% y vuelta: 100 y 40), `adjustAllServicePrices`
(-200% rechazado y el precio igual), `updateMenuAsignado` (asignar y quitar: el campo no está en la base),
`deleteTaskTemplate` y las bajas de canvas y marketing (la única: la colección queda vacía), `resetAllPresupuestos` (el
prospecto sin `presupuestoId`), `updateGuestRsvp` (Celíaco → Ninguna: `isCeliac` falso). Cada una sale de la lista de
pendientes en la misma entrega. Las que todavía fallan, se arreglan con la orden 292.

## Bloque 2 — Después, toda la plata de la lista

Por cada acción de `docs/ida-y-vuelta-pendientes.json` de `presupuestos.ts`, `invoices*`, `price-adjustments.ts`,
`servicios-empresa.ts`, `gastos*`, `cupones*`, pagos y recibos: su prueba de ida y vuelta en
`tests/firebase/ida-y-vuelta-plata.test.ts`, y sale de la lista. Si una prueba encuentra una falla, se arregla en la misma
entrega y se avisa en el informe.

## Bloque 3 — Lo que quede, por orden

Comida (`invitados`, `menus`, `insumos`, catering) en `tests/firebase/ida-y-vuelta-comida.test.ts`, y las bajas en
`tests/firebase/ida-y-vuelta-bajas.test.ts`. Si no entra todo en esta entrega, la lista dice cuánto quedó; no se agrega
nada a la lista para que el control se calle.

```comprobar
prueba: tests/firebase/ida-y-vuelta-auditor.test.ts
prueba: tests/firebase/ida-y-vuelta-plata.test.ts
no-usa: price-adjustments.ts:revertPriceAdjustment en docs/ida-y-vuelta-pendientes.json
no-usa: fiesta/catering.actions.ts:updateMenuAsignado en docs/ida-y-vuelta-pendientes.json
no-usa: presupuestos.ts:resetAllPresupuestos en docs/ida-y-vuelta-pendientes.json
```
