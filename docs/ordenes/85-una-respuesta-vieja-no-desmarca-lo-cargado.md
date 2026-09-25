# Orden 85 — Una respuesta vieja no desmarca en pantalla un equipo ya cargado (LOG04)

**Para Gemini. UNA SOLA PROPUESTA.** Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`.

## Qué pasa (medido por Codex el 25 de septiembre de 2026)

En la lista de carga (`src/app/(app)/fiestas/nueva/carga-operativa/page.tsx`),
`mergeRemoteOperationalState` (~línea 147) sólo descarta una respuesta vieja cuando **los dos**
renglones tienen `actualizadoAt` (~línea 169). Si llega tarde una foto de la lista de un momento
en que el renglón B **todavía no tenía marca** (`actualizadoAt` vacío), se aplica igual y B vuelve
a `cargado = false` en pantalla. Secuencia: se marca A (12:00), se marca B (12:00:01), llega
primero la respuesta nueva y después la vieja → queda `[true, false]` en vez de `[true, true]`.
Llegan por la consulta periódica (~líneas 295-310) y por la respuesta del guardado (~línea 334).

## Qué se pide

1. En `mergeRemoteOperationalState`: si el renglón **local** tiene `actualizadoAt` y el remoto
   **no tiene** o tiene uno más viejo, **se queda el local**. Es la regla que ya existe, completada
   para el caso sin marca.
2. Descartar una respuesta **entera** si su `updatedAt` de lista es más viejo que el último que ya
   se aplicó (guardarlo en un `useRef`), y si es de **otra fiesta** (comparar con `fiestaId`).
3. Llevá `mergeRemoteOperationalState` a `src/lib/logistica/mezclar-carga.ts` (función pura,
   exportada) para poder probarla, y que la pantalla la importe de ahí.

## Qué NO se toca

- `src/app/actions/fiesta/carga-operativa.actions.ts` y `src/lib/logistica/necesidad-por-equipo.ts`:
  el control de stock es de Claude (lo arregló el 25 de septiembre).
- No se apaga la sincronización ni se bloquea un desmarcado **intencional**: si el operador
  desmarca después, eso tiene su `actualizadoAt` más nuevo y tiene que ganar.
- Lo del foco en la cantidad (~línea 177) queda como está.

## Qué tiene que comprobar la prueba

`src/__tests__/carga-respuestas-viejas-sin-marca.test.ts`, sobre la función de `src/lib/`:
orden normal e invertido; foto vieja sin `actualizadoAt` → no desmarca; desmarcado intencional
posterior → sí gana; foco en la cantidad → no se pisa; respuesta de otra fiesta → se descarta.
Se da por buena cuando **se pone en rojo** con la función de antes.

```comprobar
archivo: src/lib/logistica/mezclar-carga.ts
usa: mezclar-carga en src/app/(app)/fiestas/nueva/carga-operativa/page.tsx
prueba: src/__tests__/carga-respuestas-viejas-sin-marca.test.ts
```
