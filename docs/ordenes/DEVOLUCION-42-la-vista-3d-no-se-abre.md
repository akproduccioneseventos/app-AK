# Devolución — El botón "Vista 3D" de la pantalla de decoración no abre el 3D

**Para Gemini. Es el único control que hoy frena la publicación.**

## Qué pasa, medido y no supuesto

En `src/app/(app)/fiestas/nueva/decoracion/page.tsx`, con una fiesta que tiene dos elementos
en el plano:

- El plano 2D se dibuja bien: **dos elementos** (`[data-deco-element="true"]`).
- El botón **"Vista 3D"** (línea ~1883) está **visible, habilitado y sin nada encima**.
- Al tocarlo —y también forzando el toque desde el navegador— **no pasa nada**: el botón
  **sigue diciendo "Vista 3D"** en vez de cambiar a "Plano 2D", el cartel *"Vista 3D
  Interactiva del Salón"* (línea ~1979) **no aparece**, y los muebles marcados
  `data-3d-mueble` son **cero**.
- **No hay ningún error en la pantalla.** No se rompe: simplemente no cambia.

Para el operador es un botón que se aprieta y no hace nada, que es justo lo que este proyecto
persigue.

## Por qué aparece recién ahora

La prueba `tests/e2e/la-vista-3d-muestra-los-muebles.spec.ts` tiene una salida de emergencia
para cuando el plano viene vacío (líneas 96-107), y **hasta ahora siempre salía por ahí**: la
pantalla rebotaba al ingreso y el plano llegaba vacío. Con la sesión arreglada, la prueba
**entra por primera vez al camino de verdad** y ahí se ve el defecto.

O sea: **la prueba está bien y el defecto es viejo.** Nadie lo había visto porque el control
nunca había llegado a mirarlo.

## Qué hay que encontrar

`is3DMode` (línea ~196) se prende con `setIs3DMode(m => !m)` desde el botón, y el bloque que
dibuja el 3D es `{is3DMode ? (...)}` en la línea ~1944. Entre esas dos cosas se corta algo.
Dos sospechas para mirar primero, **y hay que medir cuál es antes de tocar**:

1. **Que el bloque se vuelva a montar y pierda el estado** apenas se prende (la pantalla tiene
   autoguardado y recargas de datos).
2. **Que el dibujo en 3D no arranque en ese navegador** y se lleve puesto todo el bloque sin
   dejar rastro. `SalonScene` entra por carga diferida.

## Qué NO hacer

- **No sacar ni ablandar la prueba.** Es la única que mira esto.
- **No tocar `SalonScene` ni sus piezas** (`src/components/salon-3d/`): andan en las otras dos
  pantallas que las usan.
- Si en el navegador de prueba el 3D no puede dibujarse, la pantalla tiene que **mostrar la
  foto o un aviso en criollo**, nunca quedarse igual que antes: un botón que no cambia nada es
  peor que no tenerlo.

```comprobar
archivo: src/app/(app)/fiestas/nueva/decoracion/page.tsx
usa: is3DMode en src/app/(app)/fiestas/nueva/decoracion/page.tsx
prueba: tests/e2e/la-vista-3d-muestra-los-muebles.spec.ts
```

**Va junto con la orden 75**, que es la que agranda el salón 3D: conviene arreglar esto primero,
porque es la misma pantalla.
