# Órdenes de trabajo — cómo está organizado esto

**Hay UNA sola orden vigente: `ahora.md`.** Todo lo demás está en `hechas/` y es
historia: se guarda para saber por qué se hizo algo, **no para trabajar sobre
eso**.

Antes se acumularon quince órdenes con 2700 líneas, la mayoría ya cumplidas, y
no había forma de saber cuál estaba viva. Si abrís una orden vieja de `hechas/`
vas a rehacer trabajo que ya está en la aplicación.

## La regla de siempre

**Una sola propuesta con todo lo de la tanda.** No una por bloque ni una por
archivo: cada fusión dispara un despliegue y se paga. Si un bloque se traba,
entregá el resto igual en la misma propuesta y avisá cuál faltó.

Antes de subir, los cuatro controles **sobre el conjunto entero**:

```
npx tsc --noEmit
npx jest --silent
npm run check:acentos
npm run build
```

Si alguno falla, no subas. Guardá en UTF-8.

## Lo que hay que leer antes de tocar nada

- **`docs/YA-RESUELTO.md`** — lo ya arreglado y las decisiones del dueño. Si un
  hallazgo tuyo figura ahí, es falso positivo. **Y anotá ahí todo lo que
  modifiques, en la misma propuesta**, con el porqué de cada decisión.
- **`ESTADO-ACTUAL.md`** — dónde quedó la última sesión.
- **`AGENTS.md`, sección "Errores ya cometidos"**.

## Cuando termines una orden

Se mueve a `hechas/` en la misma propuesta. Así esta carpeta siempre dice la
verdad sobre qué falta.
