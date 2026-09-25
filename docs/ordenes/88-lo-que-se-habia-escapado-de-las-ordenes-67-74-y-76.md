# Orden 88 — Lo que se había escapado de las órdenes 67, 74 y 76

**Para Gemini. UNA SOLA PROPUESTA con los tres bloques.** Si uno se traba, entregá los otros en la
misma propuesta y decí cuál faltó. Arrancá de la versión principal **actualizada**. Antes de decir
"terminé", leé `docs/ANTES-DE-ENTREGAR.md` y corré tus pruebas de navegador.

**Por qué existe esta orden:** estos bloques estaban pedidos en órdenes que figuraban cumplidas.
Se habían agregado sin su línea de comprobación y nadie los hizo. Ahora `npm run ordenes?` los
marca, y queda en verde **sólo** cuando las líneas de abajo se cumplen.

## Bloque 1 — "Hoy" es el día de Uruguay (orden 67, bloque 2)

**Qué pasa:** estos lugares calculan "hoy" o "qué día es" con el día de **Greenwich**
(`toISOString().slice(0, 10)` o `.split('T')[0]`). De las nueve de la noche de Uruguay en adelante,
eso ya es mañana.

**Qué usar:** `hoyEnUruguay(fecha?)` de `src/lib/utils.ts`. Devuelve `AAAA-MM-DD` en hora de
Uruguay; sin argumento, es hoy. Para una fecha guardada como `AAAA-MM-DD`, **no** hagas
`new Date(texto)`: comparala como texto.

| Archivo | Línea aprox. | Qué cambiar |
|---|---|---|
| `src/lib/automatico/parte-manana.ts` | 41 y 63 | `hoyStr` → `hoyEnUruguay()` y `hoyEnUruguay(ahora)` |
| `src/lib/assistant/tool-registry.ts` | 312 | `hoyEnUruguay()` |
| `src/lib/assistant/tools/executors.ts` | 152, 185, 421 | `hoyEnUruguay()` |
| `src/lib/presencia-digital/revision-diaria.ts` | 16 | `hoyEnUruguay()` |
| `src/lib/presencia-digital/guardado-diario.ts` | 28 | `hoyEnUruguay()` |
| `src/lib/presencia-digital/metricas-historicas.ts` | 30 | `hoyEnUruguay()` |
| `src/lib/agentes/motor-agentes.ts` | 341 | `hoyEnUruguay(ahora)` |
| `src/app/actions/presencia-digital.ts` | 73 | `hoyEnUruguay()` |
| `src/app/actions/simulador-v2.ts` | 80, 87, 103 | días en Uruguay; las fechas guardadas, por texto (`.slice(0, 10)` del texto, no de un `Date`) |
| `src/app/actions/fiesta/portal.actions.ts` | 1019, 1023, 1037, 1041 | igual que el simulador: comparar el texto `AAAA-MM-DD` |
| `src/app/actions/playbooks.ts` | 144 | `hoyEnUruguay(d)` |

**No toques:**
- `src/app/actions/invoices.ts`, `src/lib/planPagos.ts`, `src/app/actions/assistant.ts` ni
  `src/app/actions/empleados.ts`: son de plata o ya los arregló Claude.
- `src/lib/reportes/rango-de-dias.ts`, que es el modelo.
- `src/app/actions/dashboard.ts:196` (es un enlace) y `src/lib/multiagent/assistant-crm-actions.ts:238`
  (una fecha a 60 días): no deciden qué día es hoy.

**La prueba** (`src/__tests__/hoy-es-uruguay-en-todos-lados.test.ts`): con el reloj en
`2026-09-26T02:30:00Z`, que en Uruguay son las 23:30 del 25, el parte de la mañana y la revisión
diaria de presencia digital usan **el 25**. Con el código de antes, tiene que ponerse en rojo.

## Bloque 2 — El secretario hace tres cosas más (orden 74, bloque 5)

Está **todo el detalle** en `docs/ordenes/74-el-secretario-que-habla-manos-libres.md`, bloque 5:
qué acciones llamar, los tres lugares obligatorios y qué no tocar. Hoy `src/types/multiagent.ts`
(~línea 81) tiene en `action.type` sólo `none | save_learning | create_task | create_reminder |
navigate | create_lead | draft_budget | prepare_whatsapp`.

**Los nombres, exactos:** `complete_task` (marca una tarea como hecha con `updateTareas`, leyendo
primero la lista entera), `add_guest` (`addInvitado`) y `create_incident` (`createIncidente`).
Ninguno toca plata.

**La prueba** (`src/__tests__/el-secretario-hace-tres-cosas-mas.test.ts`): con la IA simulada que
devuelve cada acción, se llama de verdad a `updateTareas`, `addInvitado` y `createIncidente`, con
los datos que dijo la IA. Y `complete_task` **no borra las otras tareas** de la lista.

## Bloque 3 — Importar invitados desde el celular (devolución 76b, vuelta 2)

Todo el detalle está en `docs/ordenes/DEVOLUCION-76b-la-importacion-en-el-celular.md`. En el
celular, el botón `btn-confirmar-guardado-planilla` queda tapado por la tabla de vista previa.
**Sacá el `test.skip` sólo cuando pase en `chromium-mobile`.**

```comprobar
no-usa: toISOString().split('T')[0] en src/lib/automatico/parte-manana.ts
no-usa: toISOString().split('T')[0] en src/lib/presencia-digital/revision-diaria.ts
no-usa: toISOString().split('T')[0] en src/app/actions/simulador-v2.ts
prueba: src/__tests__/hoy-es-uruguay-en-todos-lados.test.ts
usa: complete_task en src/types/multiagent.ts
usa: create_incident en src/types/multiagent.ts
prueba: src/__tests__/el-secretario-hace-tres-cosas-mas.test.ts
no-usa: La planilla se importa desde la computadora. en tests/e2e/importar-invitados-de-una-planilla.spec.ts
```
