# PARA GEMINI - Orden 188: devolución de la propuesta 1333 (órdenes 180 a 183 y 185)

**Una sola propuesta con todos los bloques.** Si un bloque se traba, entregá el resto igual en la misma
propuesta y avisá cuál faltó. Antes de decir "terminé", pasá `docs/ANTES-DE-ENTREGAR.md` (ojo con la
nueva, la 54).

**Arrancá de la rama `claude/app-debug-stabilize-m70e6z` de hoy, no de `main`.** Esa rama ya tiene la
orden 183 hecha (commits `e8c94e271` y `aa1c86195`: `recortarFiestaPorPerfil`, seña y saldo, aviso del
panel, borrado por perfil). La 1333 la volvió a programar encima y al juntarlas se rompen 12 pruebas.
**No rehagas la 183**: tomá lo de esa rama como está y sumale sólo lo que falta de 180, 181, 182 y 185.

## Lo que midió Claude (19/10/2026)

- La rama `claude/app-debug-stabilize-m70e6z` sola: las pruebas de abajo, 67 de 67 en verde.
- La 1333 sola: 7 fallan. La 1333 junto con esa rama: 12 fallan. Las otras dos entregas (1328 y 1324)
  juntas con la rama no rompen nada.

## Bloque 1 — plata: la versión "interna" de costos es pública (el candado la frena)

`updateGestionCostosInterno` está exportada desde `src/app/actions/fiesta/costos.actions.ts`, que empieza
con `'use server'`. **Todo lo que se exporta de ese archivo se puede llamar desde el navegador**, así que
cualquiera podía escribir los costos de una fiesta sin permiso. Lo frena
`src/__tests__/el-candado-de-la-plata.test.ts`.

- Mové esa función a `src/lib/fiesta/costos-interno.ts`, **sin** `'use server'` y con `import 'server-only'`
  arriba.
- `updateGestionCostos` (la pública, en `costos.actions.ts`) sigue pidiendo `requireAppSession` y
  `requireEventPermission(fiestaId, [PERMISOS.GANANCIAS])`, y llama a la del archivo nuevo.
- Las llamadas automáticas (en `costos.actions.ts` y en `src/app/actions/fiesta/decoracion.actions.ts`)
  importan la del archivo nuevo.
- **No agregues la función a la lista de excepciones del candado.**

## Bloque 2 — plata y decoración: pruebas que tienen que volver a verde SIN tocarlas

El arreglo va en el código, no en estas pruebas:

- `src/__tests__/frontera-general-de-fiestas.test.ts` › "La secretaria sigue igual › lee y guarda": la
  secretaria tiene CONTABILIDAD; guarda 95000 y queda 90000. Lo que ella puede ver lo tiene que poder guardar.
- `src/__tests__/auditoria-71-campos-y-compras.test.ts` › COMPRA01: una pantalla vieja de compras no
  deshace un pago.
- `src/__tests__/decoracion-no-gasta-de-mas.test.ts` (las tres).
- `src/__tests__/la-planificacion-no-pierde-lo-que-guarda.test.ts` (las dos de "sacar la decoración").
- `src/__tests__/pregunta-58-rebarrido.test.ts` › "Foto del moodboard".

## Bloque 3 — pruebas que leen un archivo que la 1333 movió

La 1333 pasó los enlaces del portal a `src/lib/portal/portal-modules.ts` y
`src/lib/portal/portal-redirects.ts`. `src/__tests__/portal-y-encargado-sin-fugas-ni-desvios.test.ts`
sigue leyendo `src/app/portal/page.tsx` y `src/app/portal/[fiestaId]/[module]/page.tsx`. Cambiá **sólo de
dónde lee**; lo que comprueba queda igual: "documentos" lleva a `/portal/${id}/contrato` y nada lleva a
`/fiestas/nueva/`.

## Bloque 4 — el menú del equipo perdió una opción

`src/__tests__/asistente-mapa-y-navegacion.test.ts` pide 39 opciones y hay 38. Si la que salió es el
duplicado de Marketing que pidió la orden 182, bajá el número a 38, corré `npm run mapa:generar` y **decí
en la entrega cuál salió**. Si salió otra, devolvela.

## Bloque 5 — lo que falta de la orden 182

`npm run "ordenes?"` dice que la 182 va 7 de 10: las pantallas no usan lo que armaste.
- `src/app/(app)/fiestas/nueva/page.tsx` tiene que mostrar las 5 pestañas usando `pestana` de
  `src/lib/fiesta/fiesta-modules.ts` (hoy sólo importa el tipo).
- `src/app/portal/page.tsx` tiene que mostrar los 5 pasos usando `paso` de `src/lib/portal/portal-modules.ts`.
- `src/app/marketing/page.tsx` tiene que tener "Campañas y anuncios".
- La prueba `tests/e2e/la-app-ordenada.spec.ts` tiene que mirar que se ven las pestañas y los pasos, no
  que el archivo exista.

## Qué NO tocar

- Lo de la orden 183 que ya está en la rama (bloque de arriba).
- Las pruebas del bloque 2.
- Ninguna dirección se borra (las de los QR impresos y las viejas siguen andando).

## Prueba

Todo `npx jest` en verde, más la 182 en `npm run "ordenes?"` como HECHA.

```comprobar
archivo: src/lib/fiesta/costos-interno.ts
usa: updateGestionCostosInterno en src/app/actions/fiesta/decoracion.actions.ts
no-usa: export async function updateGestionCostosInterno en src/app/actions/fiesta/costos.actions.ts
prueba: src/__tests__/el-candado-de-la-plata.test.ts
prueba: src/__tests__/decoracion-no-gasta-de-mas.test.ts
```
