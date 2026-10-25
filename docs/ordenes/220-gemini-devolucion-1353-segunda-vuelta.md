# Orden 220 — Devolución de la propuesta 1353 (segunda vuelta, 23/10/2026)

**Para Gemini. Una sola propuesta: seguí en la misma 1353**, rama `gemini/ordenes-180-195`. Antes de
tocar nada, traé la rama `claude/app-debug-stabilize-m70e6z` actual y fusionala en la tuya: trae los
arreglos de plata publicados el 23/10 (órdenes 218 y 219) y el candado de la plata reforzado. Si un
bloque se traba, entregá el resto en la misma propuesta y avisá cuál faltó.

Leé `docs/ANTES-DE-ENTREGAR.md` antes de decir "terminé".

## Qué se revisó

Tu entrega fusionada con la rama de Claude:

- acentos bien;
- 802 suites de Jest en verde;
- un error de tipos;
- las órdenes 188 y 190 en FALTA en `npm run "ordenes?"`.

Lo que sigue es lo que hay que corregir. Todo lo demás de la entrega queda como está: **no rehagas
lo que ya anda**.

## Bloque 1 — plata: `updateGestionCostosInterno` volvió a quedar pública

`src/app/actions/fiesta/costos.actions.ts` (~línea 210) exporta `updateGestionCostosInterno(fiestaId, costos)`.
Ese archivo empieza con `'use server'`, así que **cualquiera desde internet puede reescribir los costos de
una fiesta sin permiso**. Es el mismo defecto por el que se devolvió la 1333 (orden 188, bloque 1).

- **Borrá** esa función de `costos.actions.ts`. No la muevas ni la renombres: las llamadas automáticas ya
  usan `mutarCostosInterno` de `src/lib/fiesta/costos-interno.ts`.
- En `src/app/actions/fiesta/decoracion.actions.ts` (líneas 6-7), sacá `guardarCostosInterno` del import
  y la línea `void guardarCostosInterno;`. Ese archivo usa `mutarCostosInterno` y nada más.
- En `src/__tests__/la-fiesta-llega-con-la-plata-de-cada-perfil.test.ts` sacá `updateGestionCostosInterno`
  del import y la línea `expect(typeof updateGestionCostosInterno)...`.
- El candado (`src/__tests__/el-candado-de-la-plata.test.ts`) ahora la frena: tiene que quedar en verde
  **sin** agregar nada a `A_PROPOSITO`.

La línea de la orden 188 que pedía `updateGestionCostosInterno` en decoración estaba vieja y ya se
corrigió. Ahora pide `mutarCostosInterno`.

## Bloque 2 — la prueba de la orden 183 prueba copias, no la app

`la-fiesta-llega-con-la-plata-de-cada-perfil.test.ts` importa `reponerLaPlata` de
`src/lib/fiesta/reponer-la-plata.ts` y `sinCobros` de `src/lib/budget/sin-cobros.ts`. **Las dos son copias
nuevas que la app no usa.** El guardado de verdad usa la `reponerLaPlata` interna de
`src/app/actions/fiesta/fiesta.actions.ts` (~163), y los presupuestos usan la `sinCobros` interna de
`src/app/actions/presupuestos.ts` (~90). La prueba pasa aunque la app esté rota.

- **Borrá** la `reponerLaPlata` nueva de `src/lib/fiesta/reponer-la-plata.ts` (líneas 24 en adelante;
  `compraGuardadaDeCadaUna` queda) y el archivo `src/lib/budget/sin-cobros.ts`.
- Reescribí los casos 4 y 5 llamando a **`saveFiesta`** real, con la sesión de mentira de cada perfil. El
  modelo de cómo mockear la sesión y la base está en `src/__tests__/auditoria-71-campos-y-compras.test.ts`.
  La base de mentira devuelve copias (regla 11).
- Reescribí el caso 7 llamando a **`getPresupuestos`** / **`getPresupuestoById`** reales de
  `src/app/actions/presupuestos.ts` con sesión de operador.
- Comprobación: si sacás la línea `const conPlata = sinPlata ? reponerLaPlata(datos, actual) : datos;` de
  `saveFiesta`, el caso 5 se pone en rojo. Si sacás `.map(sinCobros)` de `presupuestos.ts`, el caso 7
  también. Probalo rompiéndolo y dejalo anotado arriba de la prueba.

## Bloque 3 — error de tipos

`src/app/actions/crowd-sync.ts:30`:

`Element implicitly has an 'any' type ... 'Record<string, CrowdSyncState> | {}'`

Tipá el `.catch` para que devuelva `{} as Record<string, CrowdSyncState>`. `npx tsc --noEmit` tiene que dar
cero.

## Bloque 4 — la orden 190 sigue en FALTA por una frase

`src/lib/asistente/voz-en-vivo.ts` (~225) dice *"No ejecuto acciones por voz: si te piden..."*. La idea
quedó bien (fuera de las herramientas no se hace nada), pero esa frase dice lo contrario de lo que ahora
hace la llamada. Reescribila sin esas palabras, por ejemplo: *"Fuera de las herramientas no cambies, cobres,
mandes ni borres nada: decí que lo dejás listo en el chat y que la persona lo confirma ahí."*

## Bloque 5 — guardados de lista entera en lo nuevo (pregunta de `company-atomic-writes`)

Estos `writeData(...)` nuevos leen la lista, la cambian y la guardan entera. Si dos pasan a la vez, se
pierde uno. Cambialos por `mutateGenericJsonArray` (o `mutarDocumentoConTransaccion` si es un documento),
leyendo **adentro** del turno:

- `src/app/api/asistente/voz-en-vivo/cliente/route.ts` ~93. **Va primero**: es el contador de minutos de
  voz del cliente. Con dos llamadas a la vez se pasa del tope, y eso es gasto de IA.
- `src/app/api/cron/asistente-proactivo/route.ts` ~232
- `src/app/api/cron/metricas-de-redes/route.ts` ~89
- `src/lib/agentes/motor-agentes.ts` ~44
- `src/lib/asistente/avisar-al-duenio.ts` ~84
- `src/lib/asistente/avisos-proactivos.ts` ~58

La prueba del contador de minutos: dos llamadas a la vez, con la base de mentira devolviendo copias,
suman las dos. Y tiene que ponerse en rojo con el `writeData` viejo.

## Qué NO tocar

- Plata, cobros, permisos: nada fuera de lo que dicen los bloques 1 y 2.
- Lo de las órdenes 180 a 195 que ya figura HECHA.

```comprobar
no-usa: export async function updateGestionCostosInterno en src/app/actions/fiesta/costos.actions.ts
no-usa: void guardarCostosInterno en src/app/actions/fiesta/decoracion.actions.ts
no-usa: export function reponerLaPlata en src/lib/fiesta/reponer-la-plata.ts
usa: saveFiesta en src/__tests__/la-fiesta-llega-con-la-plata-de-cada-perfil.test.ts
usa: getPresupuestos en src/__tests__/la-fiesta-llega-con-la-plata-de-cada-perfil.test.ts
no-usa: No ejecuto acciones por voz en src/lib/asistente/voz-en-vivo.ts
no-usa: writeData( en src/app/api/asistente/voz-en-vivo/cliente/route.ts
prueba: src/__tests__/el-candado-de-la-plata.test.ts
prueba: src/__tests__/la-fiesta-llega-con-la-plata-de-cada-perfil.test.ts
```
