# Orden 295 — Auditoría, resultados y pendientes: el simulador no deja elegir una fecha pasada (13/11/2026)

**Para Gemini.** Va **en la misma entrega que las 284 a 294** (tu rama `gemini/ordenes-282-283-entrega-completa`).
**Una sola propuesta, sin fusionar.** Repasá `docs/ANTES-DE-ENTREGAR.md`, preguntas 88 a 103.

**Lo que ya hizo Claude y no se toca:** el servidor rechaza presupuestar una fiesta en el pasado ("La fecha del evento ya
pasó…") en `sanitizeDate` de `src/lib/budget/public-simulator-persistence.ts`, con su prueba en
`public-simulator-persistence.test.ts`. Los hallazgos A a K de este informe ya están en las órdenes 292 a 294 o arreglados.

## Barrido en toda la app (Claude, 13/11/2026)

- **Fechas que elige alguien de afuera sin control de "ya pasó":** el guardado del presupuesto público (arreglado), el
  progreso del prospecto del simulador (`captureSimulatorLeadProgress`, `src/app/actions/armado-rapido.ts` ~156) y el
  selector de fecha de los dos simuladores (`src/components/date-picker-demo.tsx`, usado en
  `src/app/simulador-de-presupuesto/page.tsx` ~64 y ~326). El asistente comercial pasa por el mismo guardado
  (`src/lib/asistente/comercial-borrador.ts` ~264), así que ya queda cubierto.
- **Dos lugares que dicen estados distintos de la misma conexión:** `/api/health` (`src/app/api/health/route.ts` ~16) dice
  `googleWorkspace: true` si la app tiene sus credenciales, y la pantalla de conexiones
  (`src/app/actions/conexiones-estado.actions.ts` ~176) dice "falta conectar" si no hay cuenta vinculada. No miente
  ninguna: preguntan cosas distintas con el mismo nombre (bloque 2).

## Bloque 1 — El calendario del simulador no ofrece días pasados (P2, lo ve el prospecto)

- `src/components/date-picker-demo.tsx`: una prop `desdeHoy?: boolean` que deshabilita los días anteriores a hoy en hora
  de Uruguay (`hoyEnUruguay` de `src/lib/utils.ts`). Los dos simuladores la pasan en `true`.
- `captureSimulatorLeadProgress` (`src/app/actions/armado-rapido.ts` ~156): con una fecha pasada, guarda el prospecto
  **sin** la fecha (no la descarta entero: el teléfono sirve) y no lo marca como "con fecha".
- Si llega una fecha pasada por la dirección (`?mes=` en `obtenerPrimerSabadoDeMes`, ~326), arrancar en el primer sábado
  futuro.

## Bloque 2 — El chequeo de salud nombra lo que mide

`src/app/api/health/route.ts` ~39: `googleWorkspace` pasa a `googleWorkspaceCredencialesDeLaApp`, y se suma
`googleWorkspaceCuentaConectada` leyendo lo mismo que la pantalla de conexiones. Buscá quién lee `googleWorkspace` del
chequeo (`grep -rn "googleWorkspace" src tests`) y actualizalo.

## Pruebas

- `tests/e2e/el-simulador-no-ofrece-dias-pasados.spec.ts`: en `/simulador-de-presupuesto`, el día de ayer aparece
  deshabilitado en el calendario y no se puede elegir.
- `src/__tests__/el-prospecto-no-guarda-una-fecha-pasada.test.ts`: `captureSimulatorLeadProgress` con fecha de ayer guarda
  el teléfono y no la fecha.

```comprobar
usa: desdeHoy en src/components/date-picker-demo.tsx
usa: desdeHoy en src/app/simulador-de-presupuesto/page.tsx
usa: googleWorkspaceCuentaConectada en src/app/api/health/route.ts
prueba: tests/e2e/el-simulador-no-ofrece-dias-pasados.spec.ts
prueba: src/__tests__/el-prospecto-no-guarda-una-fecha-pasada.test.ts
```
